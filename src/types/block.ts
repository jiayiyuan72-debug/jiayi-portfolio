// 可视化块编辑器类型定义
// 数据存储在 ContentItem.fields.blocks 中（JSON 数组），无需改数据库表结构

// 第一期基础块类型
export type BlockType = 'text' | 'heading' | 'image' | 'quote' | 'divider' | 'spacer';

export type TextAlign = 'left' | 'center' | 'right';
export type FontSize = 'sm' | 'md' | 'lg';
export type HeadingLevel = 'h2' | 'h3' | 'h4';
export type ImageWidth = 'full' | 'half' | 'third';
export type DividerStyle = 'solid' | 'dashed' | 'dotted';
export type SpacerHeight = 'sm' | 'md' | 'lg' | 'xl';

// 各块的可编辑属性
export interface BlockProps {
  // text
  content?: string;
  align?: TextAlign;
  fontSize?: FontSize;
  // heading
  level?: HeadingLevel;
  // image
  url?: string;
  caption?: string;
  width?: ImageWidth;
  // quote
  author?: string;
  // divider
  style?: DividerStyle;
  // spacer
  height?: SpacerHeight;
}

export interface Block {
  id: string;
  type: BlockType;
  props: BlockProps;
}

export type Blocks = Block[];

// 块创建的默认 props
export const DEFAULT_BLOCK_PROPS: Record<BlockType, BlockProps> = {
  text: { content: '在这里输入文本...', align: 'left', fontSize: 'md' },
  heading: { content: '标题', level: 'h3' },
  image: { url: '', caption: '', width: 'full', align: 'left' },
  quote: { content: '引用内容...', author: '' },
  divider: { style: 'solid' },
  spacer: { height: 'md' },
};

// 各块类型的中文标签与图标
export const BLOCK_TYPE_LABELS: Record<BlockType, { label: string; icon: string }> = {
  text: { label: '文本', icon: '📝' },
  heading: { label: '标题', icon: '🔠' },
  image: { label: '图片', icon: '🖼️' },
  quote: { label: '引用', icon: '💬' },
  divider: { label: '分隔线', icon: '➖' },
  spacer: { label: '留白', icon: '␣' },
};

export const SPACER_HEIGHTS: Record<SpacerHeight, number> = {
  sm: 16,
  md: 32,
  lg: 64,
  xl: 96,
};
