// canvas_data 树形容器编辑器类型（按 container-editor-requirement.md）
// 数据存于 ContentItem.fields.canvas_data（JSON 数组，树形嵌套），无需改库

export type CanvasType =
  | 'section' | 'row' | 'column' | 'card'
  | 'text' | 'image' | 'quote' | 'divider' | 'spacer' | 'gallery'
  | 'timeline' | 'skill-bar' | 'stats' | 'tags' | 'video' | 'accordion';

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
  timeline: { label: '时间轴', icon: '📅' },
  'skill-bar': { label: '技能条', icon: '📊' },
  stats: { label: '统计数字', icon: '🔢' },
  tags: { label: '标签', icon: '🏷️' },
  video: { label: '视频', icon: '🎬' },
  accordion: { label: '折叠面板', icon: '📁' },
};

// 布局容器（可含子）
export const LAYOUT_TYPES: CanvasType[] = ['section', 'row', 'column', 'card'];

// 嵌套规则（section 六）：每种容器可以作为子放入哪些类型
export const CAN_NEST_IN: Record<CanvasType, CanvasType[]> = {
  section: ['row', 'column', 'card', 'text', 'image', 'quote', 'divider', 'spacer', 'gallery', 'timeline', 'skill-bar', 'stats', 'tags', 'video', 'accordion'],
  row: ['column'],
  column: ['card', 'text', 'image', 'quote', 'divider', 'spacer', 'gallery', 'timeline', 'skill-bar', 'stats', 'tags', 'video', 'accordion'],
  card: ['text', 'image', 'quote', 'gallery', 'timeline', 'skill-bar', 'stats', 'tags', 'video', 'accordion'],
  text: [],
  image: [],
  quote: [],
  divider: [],
  spacer: [],
  gallery: [],
  timeline: [],
  'skill-bar': [],
  stats: [],
  tags: [],
  video: [],
  accordion: [],
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
      return { id, type, props: { width: 'auto', height: 'auto', flexBasis: '1', marginBottom: 0 }, content: { valign: 'top' }, children: [] };
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
    case 'timeline':
      return { id, type, props: { ...baseProps }, content: { items: [
        { date: '2026.06', title: '事件标题', description: '描述内容', icon: '🎯' },
        { date: '2025.09', title: '事件标题', description: '描述内容', icon: '💼' },
        { date: '2024.07', title: '事件标题', description: '描述内容', icon: '🎓' },
      ] }, children: [] };
    case 'skill-bar':
      return { id, type, props: { ...baseProps }, content: { skills: [
        { name: 'React', level: 90, color: '#4a90e2' },
        { name: 'TypeScript', level: 85, color: '#3178c6' },
        { name: 'Python', level: 75, color: '#3776ab' },
      ] }, children: [] };
    case 'stats':
      return { id, type, props: { ...baseProps }, content: { stats: [
        { value: 50, suffix: '+', label: '完成项目', icon: '📁' },
        { value: 5, suffix: '年', label: '工作经验', icon: '⏰' },
        { value: 1200, suffix: '+', label: 'GitHub Stars', icon: '⭐' },
      ] }, children: [] };
    case 'tags':
      return { id, type, props: { ...baseProps }, content: { tags: ['React', 'TypeScript', 'Node.js', 'Python', 'Next.js', 'Tailwind CSS', 'Git', 'Docker'], color: '#4a90e2' }, children: [] };
    case 'video':
      return { id, type, props: { ...baseProps, borderRadius: 12 }, content: { url: '', title: '', platform: 'youtube' }, children: [] };
    case 'accordion':
      return { id, type, props: { ...baseProps }, content: { panels: [
        { title: '问题一', content: '点击查看详细回答内容' },
        { title: '问题二', content: '点击查看详细回答内容' },
        { title: '问题三', content: '点击查看详细回答内容' },
      ] }, children: [] };
  }
}

/** 创建带 flexBasis 的列节点 */
export function defaultColumnNode(flexBasis: string = '1'): CanvasNode {
  const id = 'ctr_' + crypto.randomUUID().slice(0, 10);
  return {
    id,
    type: 'column',
    props: { width: 'auto', height: 'auto', flexBasis, marginBottom: 0 },
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
  | 'quote-section'   // 引言区块
  | 'timeline-section'  // 时间轴区块
  | 'skills-section'    // 技能展示区块
  | 'contact-section';  // 联系方式区块

export const TEMPLATE_LABELS: Record<TemplateId, { label: string; icon: string; desc: string }> = {
  'image-text': { label: '图文并排', icon: '🖼️', desc: '左图右文' },
  'text-image': { label: '文图并排', icon: '📝', desc: '左文右图' },
  'three-cards': { label: '三列卡片', icon: '🃏', desc: '三栏卡片' },
  'two-cards': { label: '两列卡片', icon: '🎴', desc: '两栏卡片' },
  'hero-banner': { label: '英雄横幅', icon: '🏔️', desc: '大图标题' },
  'gallery-grid': { label: '图片网格', icon: '🎨', desc: '多图展示' },
  'feature-list': { label: '特性列表', icon: '⭐', desc: '图标描述' },
  'quote-section': { label: '引言区块', icon: '💬', desc: '引用文字' },
  'timeline-section': { label: '时间轴', icon: '📅', desc: '经历展示' },
  'skills-section': { label: '技能展示', icon: '📊', desc: '进度条+标签' },
  'contact-section': { label: '联系方式', icon: '📱', desc: '联系卡片' },
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
    case 'timeline-section': {
      const tl = defaultCanvasNode('timeline');
      (tl.content as any).items = [
        { date: '2026.06', title: '字节跳动 - 直播策略运营', description: '负责直播内容策略和数据分析', icon: '🎯' },
        { date: '2025.09', title: '秋招准备', description: '系统准备互联网行业秋招', icon: '💼' },
        { date: '2024.07', title: '校园招聘', description: '第27届校招入职字节跳动', icon: '🎓' },
      ];
      return {
        id, type: 'section', props: { width: '100%', height: 'auto', paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, bgColor: '#faf9f6', borderRadius: 12, marginBottom: 16 },
        content: { title: '我的经历', showTitle: true },
        children: [tl],
      };
    }
    case 'skills-section': {
      const sb = defaultCanvasNode('skill-bar');
      const tg = defaultCanvasNode('tags');
      (tg.content as any).tags = ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'Python', '数据分析', '直播运营', '内容策略'];
      return {
        id, type: 'section', props: { width: '100%', height: 'auto', paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, bgColor: '#faf9f6', borderRadius: 12, marginBottom: 16 },
        content: { title: '技能专长', showTitle: true },
        children: [sb, tg],
      };
    }
    case 'contact-section': {
      const st = defaultCanvasNode('stats');
      (st.content as any).stats = [
        { value: 50, suffix: '+', label: '完成项目', icon: '📁' },
        { value: 5, suffix: '年', label: '工作经验', icon: '⏰' },
      ];
      const tx = defaultCanvasNode('text');
      (tx.content as any).html = '<p style="text-align:center;">📧 email@example.com<br/>📱 微信：your_wechat<br/>🔗 GitHub：github.com/username</p>';
      return {
        id, type: 'section', props: { width: '100%', height: 'auto', paddingTop: 24, paddingRight: 24, paddingBottom: 24, paddingLeft: 24, bgColor: '#f8f5f0', borderRadius: 12, marginBottom: 16 },
        content: { title: '联系方式', showTitle: true },
        children: [st, tx],
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
