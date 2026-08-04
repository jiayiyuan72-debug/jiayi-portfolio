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
  flexBasis?: string;    // column 宽度比例: '1' | '2' | '0.5' | 'auto'
  responsiveStack?: boolean; // row 在移动端自动堆叠为垂直
  alignItems?: 'start' | 'center' | 'end' | 'stretch'; // row 交叉轴对齐
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

// 默认属性 / 内容
export function defaultCanvasNode(type: CanvasType): CanvasNode {
  const id = 'ctr_' + crypto.randomUUID().slice(0, 10);
  const baseProps: CanvasProps = { width: '100%', height: 'auto', marginBottom: 12 };
  switch (type) {
    case 'section':
      return { id, type, props: { ...baseProps, paddingTop: 16, paddingRight: 16, paddingBottom: 16, paddingLeft: 16, bgColor: '#faf9f6', borderRadius: 10 }, content: { title: '区块', showTitle: true }, children: [] };
    case 'row':
      return { id, type, props: { ...baseProps, gap: 16, responsiveStack: true, alignItems: 'stretch' }, content: { gap: 16 }, children: [defaultColumnNode('1'), defaultColumnNode('1')] };
    case 'column':
      return { id, type, props: { width: '100%', height: 'auto', flexBasis: '1', marginBottom: 0 }, content: { valign: 'top' }, children: [] };
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

/** 创建带 flexBasis 的列节点 */
export function defaultColumnNode(flexBasis: string = '1'): CanvasNode {
  const id = 'ctr_' + crypto.randomUUID().slice(0, 10);
  return {
    id,
    type: 'column',
    props: { width: '100%', height: 'auto', flexBasis, marginBottom: 0 },
    content: { valign: 'top' },
    children: [],
  };
}

/** 创建 N 列行 */
export function createRowWithColumns(count: number): CanvasNode {
  const id = 'ctr_' + crypto.randomUUID().slice(0, 10);
  const cols = Array.from({ length: count }, () => defaultColumnNode('1'));
  return {
    id,
    type: 'row',
    props: { width: '100%', height: 'auto', gap: 16, marginBottom: 12, responsiveStack: true, alignItems: 'stretch' },
    content: { gap: 16 },
    children: cols,
  };
}

// ---- 预设布局模板 ----
export type TemplateId =
  | 'image-text'      // 图文并排（左图右文）
  | 'text-image'      // 文图并排（左文右图）
  | 'three-cards'     // 三列卡片
  | 'two-cards'       // 两列卡片
  | 'hero-banner'     // 英雄横幅（大图+标题）
  | 'gallery-grid'    // 图片网格
  | 'feature-list'    // 特性列表（图标+标题+描述）
  | 'quote-section';  // 引言区块

export const TEMPLATE_LABELS: Record<TemplateId, { label: string; icon: string; desc: string }> = {
  'image-text': { label: '图文并排', icon: '🖼️', desc: '左图右文' },
  'text-image': { label: '文图并排', icon: '📝', desc: '左文右图' },
  'three-cards': { label: '三列卡片', icon: '🃏', desc: '三栏卡片' },
  'two-cards': { label: '两列卡片', icon: '🎴', desc: '两栏卡片' },
  'hero-banner': { label: '英雄横幅', icon: '🏔️', desc: '大图标题' },
  'gallery-grid': { label: '图片网格', icon: '🎨', desc: '多图展示' },
  'feature-list': { label: '特性列表', icon: '⭐', desc: '图标描述' },
  'quote-section': { label: '引言区块', icon: '💬', desc: '引用文字' },
};

/** 生成预设布局模板的 CanvasNode 树 */
export function createTemplate(templateId: TemplateId): CanvasNode {
  const id = 'ctr_' + crypto.randomUUID().slice(0, 10);
  const rowProps: CanvasProps = { width: '100%', height: 'auto', gap: 16, marginBottom: 12, responsiveStack: true, alignItems: 'center' };
  const rowPropsStretch: CanvasProps = { width: '100%', height: 'auto', gap: 16, marginBottom: 12, responsiveStack: true, alignItems: 'stretch' };

  switch (templateId) {
    case 'image-text': {
      return {
        id, type: 'row', props: rowProps, content: {},
        children: [
          { ...defaultColumnNode('1'), children: [defaultCanvasNode('image')] },
          { ...defaultColumnNode('1'), children: [{
            ...defaultCanvasNode('text'),
            content: { html: '<h3>标题</h3><p>在这里描述内容。双击编辑文字，可以添加段落、列表等。</p>' },
          }] },
        ],
      };
    }
    case 'text-image': {
      return {
        id, type: 'row', props: rowProps, content: {},
        children: [
          { ...defaultColumnNode('1'), children: [{
            ...defaultCanvasNode('text'),
            content: { html: '<h3>标题</h3><p>在这里描述内容。双击编辑文字。</p>' },
          }] },
          { ...defaultColumnNode('1'), children: [defaultCanvasNode('image')] },
        ],
      };
    }
    case 'three-cards': {
      return {
        id, type: 'row', props: rowPropsStretch, content: {},
        children: [1, 2, 3].map(() => ({
          ...defaultColumnNode('1'),
          children: [{
            ...defaultCanvasNode('card'),
            children: [
              { ...defaultCanvasNode('text'), content: { html: '<h4>卡片标题</h4>' } },
              { ...defaultCanvasNode('text'), content: { html: '<p>卡片描述文字</p>' } },
            ],
          }],
        })),
      };
    }
    case 'two-cards': {
      return {
        id, type: 'row', props: rowPropsStretch, content: {},
        children: [1, 2].map(() => ({
          ...defaultColumnNode('1'),
          children: [{
            ...defaultCanvasNode('card'),
            children: [
              { ...defaultCanvasNode('text'), content: { html: '<h4>卡片标题</h4>' } },
              { ...defaultCanvasNode('text'), content: { html: '<p>卡片描述文字</p>' } },
            ],
          }],
        })),
      };
    }
    case 'hero-banner': {
      return {
        id, type: 'section', props: { width: '100%', height: 'auto', paddingTop: 32, paddingRight: 24, paddingBottom: 32, paddingLeft: 24, bgColor: '#f8f5f0', borderRadius: 12, marginBottom: 16 },
        content: { title: '', showTitle: false },
        children: [
          { ...defaultCanvasNode('text'), content: { html: '<h2 style="text-align:center;">大标题</h2>' }, props: { ...defaultCanvasNode('text').props, marginBottom: 8 } },
          { ...defaultCanvasNode('text'), content: { html: '<p style="text-align:center; color:#8b8b8b;">副标题描述文字</p>' }, props: { ...defaultCanvasNode('text').props, marginBottom: 16 } },
          { ...defaultCanvasNode('image'), props: { ...defaultCanvasNode('image').props, borderRadius: 12, height: '280px' }, content: { src: '', alt: '', caption: '', fitMode: 'cover' } },
        ],
      };
    }
    case 'gallery-grid': {
      return {
        id, type: 'row', props: rowPropsStretch, content: {},
        children: [1, 2, 3].map(() => ({
          ...defaultColumnNode('1'),
          children: [defaultCanvasNode('image')],
        })),
      };
    }
    case 'feature-list': {
      return {
        id, type: 'row', props: rowPropsStretch, content: {},
        children: [1, 2, 3].map((n) => ({
          ...defaultColumnNode('1'),
          children: [
            { ...defaultCanvasNode('text'), content: { html: `<p style="text-align:center; font-size:28px;">⭐</p>` }, props: { ...defaultCanvasNode('text').props, marginBottom: 4 } },
            { ...defaultCanvasNode('text'), content: { html: `<h4 style="text-align:center;">特性 ${n}</h4>` }, props: { ...defaultCanvasNode('text').props, marginBottom: 4 } },
            { ...defaultCanvasNode('text'), content: { html: `<p style="text-align:center; color:#8b8b8b; font-size:13px;">描述文字</p>` }, props: { ...defaultCanvasNode('text').props, marginBottom: 0 } },
          ],
        })),
      };
    }
    case 'quote-section': {
      return {
        id, type: 'section', props: { width: '100%', height: 'auto', paddingTop: 24, paddingRight: 32, paddingBottom: 24, paddingLeft: 32, bgColor: '#f8f5f0', borderRadius: 12, marginBottom: 16 },
        content: { title: '', showTitle: false },
        children: [{
          ...defaultCanvasNode('quote'),
          content: { html: '<p style="font-size:18px; text-align:center;">"在这里写一段引言或座右铭"</p>' },
          props: { ...defaultCanvasNode('quote').props, paddingTop: 16, paddingBottom: 16 },
        }],
      };
    }
  }
}

// 判断某类型能否放入 parent 容器
export function canNest(parent: CanvasNode | null, childType: CanvasType): boolean {
  if (!parent) return true; // 根级可放任意
  if (!CAN_NEST_IN[parent.type].includes(childType)) return false;
  return true;
}
