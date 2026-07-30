// 智能导入解析引擎
// 使用 DeepSeek API 进行智能文档解析

import { ParsedItem, ParseResult, ImportType } from './types';
import { extractTextFromFile } from './extractors';

// DeepSeek API 密钥
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/**
 * 解析文件 — 主入口
 */
export async function parseFile(
  filePath: string,
  fileName: string,
  fileType: string,
  importType: ImportType,
  fileUrl?: string
): Promise<ParseResult> {
  try {
    // 1. 提取文本
    const { text, error } = await extractTextFromFile(filePath, fileName, fileType, fileUrl);
    if (error) {
      return { success: false, items: [], summary: { totalItems: 0, highConfidence: 0, lowConfidence: 0, sections: [] }, error };
    }
    if (!text.trim()) {
      return { success: false, items: [], summary: { totalItems: 0, highConfidence: 0, lowConfidence: 0, sections: [] }, error: '未能从文件中提取到任何文本内容' };
    }

    // 2. 调用 DeepSeek API 进行解析
    const items = await callDeepSeekParser(text, fileName, importType);

    // 3. 构造结果
    const highConfidence = items.filter(i => i.confidence >= 0.7).length;
    const lowConfidence = items.filter(i => i.confidence < 0.7).length;
    const sections = [...new Set(items.map(i => i.targetSection))];

    return {
      success: true,
      items,
      summary: {
        totalItems: items.length,
        highConfidence,
        lowConfidence,
        sections,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      items: [],
      summary: { totalItems: 0, highConfidence: 0, lowConfidence: 0, sections: [] },
      error: error.message || '解析失败',
    };
  }
}

/**
 * 调用 DeepSeek API 解析文本
 */
async function callDeepSeekParser(
  text: string,
  fileName: string,
  importType: ImportType
): Promise<ParsedItem[]> {
  // 构建 system prompt
  const systemPrompt = buildSystemPrompt(importType);

  // 构建 user prompt
  const userPrompt = buildUserPrompt(text, fileName, importType);

  // 处理文本长度（DeepSeek context window 有限）
  const truncatedText = text.length > 30000 ? text.slice(0, 30000) + '\n... (内容过长，已截断)' : text;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: userPrompt.replace('{{TEXT}}', truncatedText),
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`DeepSeek API 错误: ${response.status} ${err.substring(0, 200)}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    if (!content) throw new Error('DeepSeek API 返回为空');

    // 提取 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('未能从 API 响应中提取 JSON');

    const parsed = JSON.parse(jsonMatch[0]);

    // 兼容不同返回格式
    let items: any[] = [];
    if (parsed.items) items = parsed.items;
    else if (parsed.entries) items = parsed.entries;
    else if (Array.isArray(parsed)) items = parsed;
    else if (parsed.data) items = Array.isArray(parsed.data) ? parsed.data : [parsed.data];
    else items = [parsed];

    // 转换为 ParsedItem[]
    return items.map((item: any) => ({
      targetSection: item.targetSection || mapToSection(importType),
      targetSectionName: item.targetSectionName || '',
      title: item.title || item.name || '未命名',
      fields: item.fields || {},
      body: item.body || item.description || item.content || '',
      tags: item.tags || [],
      media_urls: item.media_urls || [],
      file_urls: item.file_urls || [],
      confidence: typeof item.confidence === 'number' ? item.confidence : 0.5,
      missingFields: item.missingFields || [],
      sourceFile: fileName,
    }));
  } catch (error: any) {
    console.error('DeepSeek API 调用失败:', error.message);
    // 失败时返回空数组，让用户手动输入
    return [];
  }
}

function buildSystemPrompt(importType: ImportType): string {
  return `你是一个个人网站内容解析助手。你的任务是从用户上传的文档中提取结构化信息，用于填充个人网站的各个板块。

请严格按 JSON 格式返回，只返回 JSON，不要包含其他说明文字。

返回格式：
{
  "items": [
    {
      "targetSection": "板块slug",
      "title": "内容标题",
      "fields": { 字段名: 字段值 },
      "body": "详细描述/正文",
      "tags": ["标签"],
      "confidence": 0.85,
      "missingFields": ["未能提取的字段名"]
    }
  ]
}

板块 slug 对应关系：
- experience = 求职经历（包含公司、岗位、时间、工作内容、产出、思考）
- education = 求学经历（学校、专业、学历、时间、活动、获奖）
- travel = 旅游足迹（目的地、时间、照片、日记、标签）
- diary = 每日日记（日期、天气、心情、正文）
- thoughts = 所思所想（文章标题、摘要、正文）
- life = 生活记录
- about = 个人信息

置信度规则：
- 明确提取到关键字段 → 0.8-1.0
- 部分提取到 → 0.5-0.7
- 不确定 → 0.3-0.5
- 完全猜测 → 0.1-0.3`;
}

function buildUserPrompt(text: string, fileName: string, importType: ImportType): string {
  const typeHints: Record<ImportType, string> = {
    auto: '请根据内容自动判断属于哪个板块。',
    resume: '这是一份求职简历/求职资料。请提取工作/实习经历。字段包括：company（公司）、position（岗位）、start_date（开始时间）、end_date（结束时间）、content（工作内容）、output（主要产出）、reflection（业务思考）。targetSection 设为 experience。',
    education: '这是求学资料。请提取教育经历。字段包括：school（学校）、major（专业）、degree（学历）、start_date（开始时间）、end_date（结束时间）、activities（学生工作/活动）、achievements（获奖情况）。targetSection 设为 education。',
    travel: '这是旅游游记/旅行资料。请提取旅游信息。字段包括：destination（目的地）、travel_date（出行时间）、tags（标签）、diary（日记文本）。targetSection 设为 travel。',
    diary: '这是日记/日常记录。请提取日记信息。字段包括：weather（天气）、mood（心情）、date（日期）。targetSection 设为 diary。',
    article: '这是文章/思考类内容。请提取文章信息。字段包括：excerpt（摘要）、read_time（阅读分钟数）。targetSection 设为 thoughts。',
    photos: '这是一批图片。请根据图片文件名和上下文判断用途，推荐放入的板块。',
  };

  return `文件名：${fileName}
导入类型：${typeHints[importType]}

文档内容：
{{TEXT}}

请分析以上内容，提取结构化信息，返回 JSON 格式。`;
}

function mapToSection(importType: ImportType): string {
  const map: Record<ImportType, string> = {
    auto: 'life',
    resume: 'experience',
    education: 'education',
    travel: 'travel',
    diary: 'diary',
    article: 'thoughts',
    photos: 'gallery',
  };
  return map[importType] || 'life';
}
