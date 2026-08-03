'use client';

import { ContentItem, GridLayout } from '@/types/content';

// 宽度档位（对应 PRD 3.2）: label / col_span
export const WIDTH_PRESETS = [
  { label: '1/4 行', span: 3 },
  { label: '1/3 行', span: 4 },
  { label: '1/2 行', span: 6 },
  { label: '3/4 行', span: 8 },
  { label: '整行', span: 12 },
];

// 智能排列时各内容类型的默认宽度
export const CONTENT_TYPE_DEFAULT_SPAN: Record<string, number> = {
  image: 6,
  text: 8,
  article: 8,
  video: 12,
  travelogue: 12,
  diary: 12,
  file: 6,
};

export const GRID_COLUMNS = 12;

export function getCurrentLayout(item: ContentItem): GridLayout {
  const layout = item.fields?.layout as GridLayout | undefined;
  return layout || { col_span: 6, row_span: 1 };
}

export function setLayout(item: ContentItem, layout: GridLayout): ContentItem {
  return {
    ...item,
    fields: { ...item.fields, layout },
  };
}
