export type ContentType = 'text' | 'image' | 'video' | 'article' | 'file' | 'diary' | 'travelogue';
export type ContentStatus = 'draft' | 'published';

// 可视化画布编辑：每个内容块在 12 列网格中的布局（写入 ContentItem.fields.layout）
export interface GridLayout {
  col_span: number;   // 1-12
  row_span?: number;  // 默认 1
}

export interface ContentItem {
  id: string;
  section_id: string;
  title: string;
  content_type: ContentType;
  fields: Record<string, any>;
  body: string;
  media_urls: string[];
  file_urls: string[];
  tags: string[];
  sort_order: number;
  is_visible: boolean;
  status: ContentStatus;
  published_at: string | null;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

export type ContentInput = Omit<ContentItem, 'id' | 'created_at' | 'updated_at'>;
