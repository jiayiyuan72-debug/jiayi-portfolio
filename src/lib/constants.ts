export const SITE_NAME = 'Jiayi 的个人空间';

export const QUESTIONNAIRE_KEY = 'jiayi_questionnaire';
export const SKIP_DAYS = 7;

export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
];

// 文件大小上限：15MB（相机照片 JPEG/RAW 导出常达 10-15MB）
// 需与 Supabase 桶 portfolio-media 的 file_size_limit 一致（已同步调大）
export const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

export const STORAGE_BUCKET = 'portfolio-media';

export const LAYOUT_LABELS: Record<string, string> = {
  timeline: '时间轴',
  card: '卡片列表',
  gallery: '图片画廊',
  article: '文章列表',
  travelogue: '游记',
  diary: '日记流',
  mixed: '混合布局',
};
