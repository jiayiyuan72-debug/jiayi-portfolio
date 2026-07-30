// 文本提取器 — 从各种文件格式中提取纯文本

import { supabaseAdmin } from '../supabase/admin';

/**
 * 从文件中提取纯文本
 */
export async function extractTextFromFile(
  filePath: string,
  fileName: string,
  fileType: string,
  fileUrl?: string
): Promise<{ text: string; error?: string }> {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  try {
    // 如果是通过 URL 访问的，先下载
    let buffer: Buffer | null = null;

    if (fileUrl) {
      const response = await fetch(fileUrl);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } else if (filePath) {
      const { data, error } = await supabaseAdmin.storage
        .from('portfolio-media')
        .download(filePath);
      if (error) throw new Error('下载文件失败: ' + error.message);
      buffer = Buffer.from(await data.arrayBuffer());
    }

    if (!buffer) return { text: '', error: '无法读取文件' };

    // 根据扩展名选择提取方式
    switch (ext) {
      case 'pdf':
        return await extractFromPdf(buffer);
      case 'docx':
        return await extractFromDocx(buffer);
      case 'txt':
      case 'md':
      case 'markdown':
        return { text: buffer.toString('utf-8') };
      default:
        // 尝试作为文本处理
        try {
          return { text: buffer.toString('utf-8') };
        } catch {
          return { text: '', error: `不支持的文件格式: .${ext}` };
        }
    }
  } catch (error: any) {
    return { text: '', error: error.message };
  }
}

/**
 * 从 PDF 提取文本
 */
async function extractFromPdf(buffer: Buffer): Promise<{ text: string; error?: string }> {
  try {
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(buffer);
    return { text: data.text };
  } catch (error: any) {
    return { text: '', error: 'PDF 解析失败: ' + error.message };
  }
}

/**
 * 从 Word 文档提取文本
 */
async function extractFromDocx(buffer: Buffer): Promise<{ text: string; error?: string }> {
  try {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return { text: result.value };
  } catch (error: any) {
    return { text: '', error: 'Word 解析失败: ' + error.message };
  }
}
