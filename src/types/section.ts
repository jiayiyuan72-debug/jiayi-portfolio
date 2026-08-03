// 板块类型定义
export type LayoutType =
  | 'timeline'
  | 'card'
  | 'gallery'
  | 'article'
  | 'travelogue'
  | 'diary'
  | 'mixed';

export interface FieldDefinition {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  max_length?: number;
  options?: string[];
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'image'
  | 'file'
  | 'select'
  | 'multiselect'
  | 'rich_text'
  | 'boolean';

export interface PageConfig {
  show_in_nav?: boolean;
  subtitle?: string;
  cover_image?: string;
  page_meta_title?: string;
  page_meta_description?: string;
}

export interface StyleConfig {
  bg_color?: string;
  text_color?: string;
  accent_color?: string;
  columns?: number;
  max_width?: string;
  padding?: string;
  gap?: string;
  card_style?: 'elevated' | 'bordered' | 'minimal';
  show_border?: boolean;
  show_date?: boolean;
  show_tags?: boolean;
  show_mood?: boolean;
  show_year_labels?: boolean;
  icon?: string;
  lightbox?: boolean;
  show_captions?: boolean;
  show_map?: boolean;
  layout?: string;
  font_family?: string;
  animation?: string;
  /** 多页面结构下的板块独立页配置 */
  page?: PageConfig;
}

export interface Section {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_visible: boolean;
  layout_type: LayoutType;
  field_schema: FieldDefinition[];
  style_config: StyleConfig;
  meta_title: string;
  meta_description: string;
  created_at: string;
  updated_at: string;
}

export type SectionInput = Omit<Section, 'id' | 'created_at' | 'updated_at'>;
