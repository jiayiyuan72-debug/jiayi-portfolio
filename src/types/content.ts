export type ContentType = 'text' | 'image' | 'video' | 'article' | 'file' | 'diary' | 'travelogue';
export type ContentStatus = 'draft' | 'published';

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
