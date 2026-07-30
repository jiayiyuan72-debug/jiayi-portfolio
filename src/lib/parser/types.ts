// 解析引擎类型定义

export interface ParsedItem {
  // 推荐的板块
  targetSection: string; // slug: experience, education, travel, diary, thoughts, about, life
  targetSectionName?: string; // 板块名称
  // 内容标题
  title: string;
  // 字段值
  fields: Record<string, any>;
  // 正文
  body: string;
  // 标签
  tags: string[];
  // 媒体 URL
  media_urls?: string[];
  // 文件 URL
  file_urls?: string[];
  // 置信度 0-1
  confidence: number;
  // 未能识别的字段
  missingFields: string[];
  // 来源文件
  sourceFile?: string;
}

export interface ParseResult {
  success: boolean;
  items: ParsedItem[];
  summary: {
    totalItems: number;
    highConfidence: number;
    lowConfidence: number;
    sections: string[];
  };
  error?: string;
}

export interface ImportRequest {
  filePath: string;
  fileName: string;
  fileType: string;
  fileContent?: string;
  importType: ImportType;
}

export type ImportType = 'auto' | 'resume' | 'education' | 'travel' | 'diary' | 'article' | 'photos';
