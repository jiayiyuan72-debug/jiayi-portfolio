// canvas_data 树形容器编辑器类型（按 container-editor-requirement.md）
// 数据存于 ContentItem.fields.canvas_data（JSON 数组，树形嵌套），无需改库

export type CanvasType =
  | 'section' | 'row' | 'column' | 'card'
  | 'text' | 'image' | 'quote' | 'divider' | 'spacer' | 'gallery';

export interface CanvasProps {
  width?: string;        // '100%' | '320px' ...
  height?: string;       // 'auto' | px
  marginTop?: number;
  marginRight?: number;
  marginBottom?: number;
  marginLeft?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  bgColor?: string;
  borderRadius?: number;
  // 布局容器/特有
  gap?: number;          // row
  valign?: 'top' | 'center' | 'bottom'; // column
  shadow?: 'none' | 'sm' | 'md' | 'lg'; // card
  borderColor?: string;  // card
  lineWidth?: number;    // divider
  lineColor?: string;    // divider
}

export interface CanvasNode {
  id: string;
  type: CanvasType;
  props: CanvasProps;
  content: Record<string, any> | null;
  children: CanvasNode[];
}

// 各容器类型的标签 + 图标
export const CANVAS_TYPE_LABELS: Record<CanvasType, { label: string; icon: string }> = {
  section: { label: '区块', icon: '📦' },
  row: { label: '行', icon: '↔️' },
  column: { label: '列', icon: '↕️' },
  card: { label: '卡片', icon: '🃏' },
  text: { label: '文本', icon: '📝' },
  image: { label: '图片', icon: '🖼️' },
  quote: { label: '引用', icon: '💬' },
  divider: { label: '分隔线', icon: '➖' },
  spacer: { label: '留白', icon: '⬜' },
  gallery: { label: '图片组', icon: '🎨' },
};

// 布局容器（可含子）
export const LAYOUT_TYPES: CanvasType[] = ['section', 'row', 'column', 'card'];

// 嵌套规则（section 六）：每种容器可以作为子放入哪些类型
export const CAN_NEST_IN: Record<CanvasType, CanvasType[]> = {
  section: ['row', 'column', 'card', 'text', 'image', 'quote', 'divider', 'spacer', 'gallery'],
  row: ['column'],
  column: ['card', 'text', 'image', 'quote', 'divider', 'spacer', 'gallery'],
  card: ['text', 'image', 'quote', 'gallery'],
  text: [],
  image: [],
  quote: [],
  divider: [],
  spacer: [],
  gallery: [],
};

export const MAX_DEPTH = 3;

// 默认属性 / 内容（文档 16.4）
export function defaultCanvasNode(type: CanvasType): CanvasNode {
  const id = 'ctr_' + crypto.randomUUID().slice(0, 10);
  const baseProps: CanvasProps = { width: '100%', height: 'auto', marginBottom: 12 };
  switch (type) {
    case 'section':
      return { id, type, props: { ...baseProps, paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16, bgColor: '#faf9f6', borderRadius: 10 }, content: { title: '区块', showTitle: true }, children: [] };
    case 'row':
      return { id, type, props: { ...baseProps, gap: 12 }, content: { gap: 12 }, children: [defaultCanvasNode('column'), defaultCanvasNode('column')] };
    case 'column':
      return { id, type, props: { width: '50%', height: 'auto', paddingBottom: 0 }, content: { valign: 'top' }, children: [] };
    case 'card':
      return { id, type, props: { ...baseProps, paddingTop: 14, paddingRight: 14, paddingBottom: 14, paddingLeft: 14, bgColor: '#ffffff', borderRadius: 10, shadow: 'sm' }, content: { shadow: 'sm', borderColor: '#e8e6e0' }, children: [] };
    case 'text':
      return { id, type, props: { ...baseProps }, content: { html: '<p>双击编辑文字</p>' }, children: [] };
    case 'image':
      return { id, type, props: { ...baseProps, borderRadius: 8 }, content: { src: '', alt: '', caption: '' }, children: [] };
    case 'quote':
      return { id, type, props: { ...baseProps }, content: { html: '<p>双击编辑引用内容</p>' }, children: [] };
    case 'divider':
      return { id, type, props: { width: '100%', marginTop: 8, marginBottom: 8, lineWidth: 1, lineColor: '#e8e6e0' }, content: null, children: [] };
    case 'spacer':
      return { id, type, props: { width: '100%', height: '24px', marginTop: 0, marginBottom: 0 }, content: null, children: [] };
    case 'gallery':
      return { id, type, props: { ...baseProps }, content: { images: [], layout: 'grid', columns: 3, gap: 8 }, children: [] };
  }
}

// 判断某类型能否放入 parent 容器
export function canNest(parent: CanvasNode | null, childType: CanvasType): boolean {
  if (!parent) return true; // 根级可放任意
  if (!CAN_NEST_IN[parent.type].includes(childType)) return false;
  return true;
}
