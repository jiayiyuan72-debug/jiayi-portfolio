// 容器化自由布局：PageContainer / PageLayout 类型
// 布局 JSON 存于 ContentItem.fields.page_layout（与 12 列画布的 fields.layout 区分）

export type PageContainerType =
  | 'section'
  | 'row'
  | 'column'
  | 'card'
  | 'text'
  | 'image'
  | 'video'
  | 'rich'
  | 'button'
  | 'quote'
  | 'divider'
  | 'spacer'
  | 'gallery'
  | 'group';

// 图片填充模式
export type ImageFit = 'contain' | 'cover' | 'fill';
// 图片焦点（cover 模式下展示图片哪一部分）：相对整图坐标 0-1
export interface ImageFocal { x: number; y: number; scale?: number }

export interface PageContainer {
  id: string;
  type: PageContainerType;
  // 相对父容器（父容器左上角为原点）的定位与尺寸
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  parentId: string | null;
  // 填充模式：true=占满父容器剩余空间，false=固定尺寸
  fill?: boolean;
  content: Record<string, any>;
  style: Record<string, any>;
}

// 扁平存储的布局
export interface PageLayout {
  containers: PageContainer[];
}

// 各容器的通用默认
export const DEFAULT_PAGE_FONT = 14;

export const CONTAINER_TYPE_LABELS: Record<PageContainerType, { label: string; icon: string }> = {
  section: { label: '区块', icon: '🗂️' },
  row: { label: '行', icon: '🛤️' },
  column: { label: '列', icon: '📚' },
  card: { label: '卡片', icon: '🃏' },
  text: { label: '文本', icon: '📝' },
  image: { label: '图片', icon: '🖼️' },
  video: { label: '视频', icon: '🎬' },
  rich: { label: '富文本', icon: '🧾' },
  button: { label: '按钮', icon: '🔘' },
  quote: { label: '引用', icon: '💬' },
  divider: { label: '分隔线', icon: '➖' },
  spacer: { label: '占位', icon: '␣' },
  gallery: { label: '图片组', icon: '🖼️' },
  group: { label: '容器组', icon: '📦' },
};

// 各容器类型新增时的默认内容/尺寸
export function defaultContainer(type: PageContainerType): PageContainer {
  const base = { id: crypto.randomUUID(), type, x: 20, y: 20, w: 200, h: 120, z: 1, parentId: null, content: {}, style: {} };
  switch (type) {
    case 'section':
      return { ...base, content: { label: '区块' }, style: { bg: 'transparent', outline: true }, w: 560, h: 240 };
    case 'row':
      return { ...base, content: { label: '行' }, style: { bg: 'transparent', outline: true }, w: 480, h: 120 };
    case 'column':
      return { ...base, content: { label: '列' }, style: { bg: 'transparent', outline: true }, w: 160, h: 240 };
    case 'card':
      return { ...base, content: { title: '卡片标题', text: '卡片内容…' }, style: { bg: '#ffffff', radius: 8, border: true }, w: 240, h: 140 };
    case 'text':
      return { ...base, content: { text: '双击编辑文本…', autoFont: false, align: 'left' }, style: { color: '#2d2a24' }, w: 240, h: 80 };
    case 'image':
      return { ...base, content: { url: '', fit: 'contain', focal: { x: 0.5, y: 0.5, scale: 1 } }, w: 240, h: 160 };
    case 'video':
      return { ...base, content: { url: '', type: 'embed' }, w: 320, h: 180 };
    case 'rich':
      return { ...base, content: { html: '' }, w: 300, h: 160 };
    case 'button':
      return { ...base, content: { label: '按钮', href: '', color: '#2d2a24', textColor: '#ffffff' }, w: 120, h: 40 };
    case 'quote':
      return { ...base, content: { text: '引用内容…', author: '' }, w: 280, h: 90 };
    case 'divider':
      return { ...base, content: { style: 'solid' }, h: 24, w: 240 };
    case 'spacer':
      return { ...base, content: {}, style: { bg: 'transparent' }, w: 200, h: 80 };
    case 'gallery':
      return { ...base, content: { images: [] }, w: 320, h: 160 };
    case 'group':
      return { ...base, content: {}, style: { label: '容器组' }, w: 300, h: 200 };
  }
}
