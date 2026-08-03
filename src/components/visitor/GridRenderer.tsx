import { Section, ContentItem, GridLayout } from '@/types';
import BlockRenderer from './BlockRenderer';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

const GRID_COLUMNS = 12;

/**
 * 可视化画布前台网格渲染器：当板块内容带有 fields.layout 时，
 * 按 12 列 CSS Grid + 每块的 col_span 排列（支持跨列）。
 * 无 layout 的内容项仍按原逻辑由 SectionRenderer 走原 Renderer。
 */
export default function GridRenderer({ section, contentItems }: Props) {
  const style = section.style_config || {};
  const gap = typeof style.gap === 'string' ? style.gap : '20px';

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`, gap }}
    >
      {contentItems.map(item => {
        const layout = (item.fields?.layout as GridLayout | undefined) || { col_span: 6, row_span: 1 };
        const span = Math.max(1, Math.min(GRID_COLUMNS, layout.col_span || 6));

        return (
          <div
            key={item.id}
            style={{ gridColumn: `span ${span}` }}
            className="bg-white rounded-xl p-5 shadow-sm border border-[#e8e4de]"
          >
            <GridBlockContent item={item} />
          </div>
        );
      })}
    </div>
  );
}

/** 单个网格块的内容渲染（优先渲染块编辑器内容，否则按 content_type 简化展示） */
function GridBlockContent({ item }: { item: ContentItem }) {
  const fields = item.fields || {};
  const cover = fields.cover_image || fields.image;
  const hasBlocks = Array.isArray(fields.blocks) && fields.blocks.length > 0;

  // 内容同时带有块编辑器数据时，用 BlockRenderer 渲染（兼容画布+块编辑并存）
  if (fields.useBlockEditor || hasBlocks) {
    return (
      <div className="text-left">
        {item.title && <h4 className="text-lg font-semibold text-[#2d2a24] mb-2">{item.title}</h4>}
        <BlockRenderer blocks={(fields.blocks || []).filter((b: any) => !(b.type === 'image' && !(b.props?.url)))} />
      </div>
    );
  }

  return (
    <div className="text-left">
      {cover && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt={item.title} className="w-full rounded-lg object-cover mb-3 max-h-72" loading="lazy" />
      )}
      {item.title && (
        <h4 className="text-base font-semibold text-[#2d2a24] mb-1">{item.title}</h4>
      )}
      {fields.subtitle && (
        <p className="text-xs text-[#8b8b8b] mb-2">{fields.subtitle}</p>
      )}
      {item.body && (
        <p className="text-sm text-[#5a5349] leading-relaxed whitespace-pre-line">
          {item.body.length > 240 ? item.body.slice(0, 240) + '…' : item.body}
        </p>
      )}
      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {item.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 bg-[#f8f5f0] text-[#8b8b8b] rounded">
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
