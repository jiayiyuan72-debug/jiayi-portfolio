import { Section, ContentItem } from '@/types';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

export default function CardRenderer({ section, contentItems }: Props) {
  const columns = section.style_config?.columns || 2;

  return (
    <div
      className="grid gap-6"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${columns === 1 ? '320px' : '280px'}, 1fr))`,
      }}
    >
      {contentItems.map(item => {
        const fields = item.fields || {};

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-[#e8e4de] card-hover"
          >
            {/* 副标题 */}
            {fields.subtitle && (
              <span className="text-xs text-[#8b8b8b] block mb-1">{fields.subtitle}</span>
            )}

            <h3 className="text-lg font-semibold text-[#2d2a24] mb-2">{item.title}</h3>

            {/* 正文 */}
            {item.body && (
              <div className="text-sm text-[#5a5349] leading-relaxed whitespace-pre-line mb-3">
                {item.body.length > 200
                  ? item.body.slice(0, 200) + '...'
                  : item.body
                }
              </div>
            )}

            {/* 字段内容 */}
            {Object.entries(fields).map(([key, value]) => {
              if (key === 'subtitle' || key === 'avatar' || key === 'cover_image') return null;
              if (!value) return null;

              const fieldDef = section.field_schema?.find(f => f.key === key);
              const label = fieldDef?.label || key;

              return (
                <div key={key} className="mt-2 text-sm text-[#5a5349]">
                  <span className="text-[#8b8b8b]">{label}: </span>
                  <span>{String(value)}</span>
                </div>
              );
            })}

            {/* 标签 */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#e8e4de]">
                {item.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-[#f8f5f0] text-[#8b8b8b] rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {contentItems.length === 0 && (
        <p className="text-sm text-[#b8b4ae] col-span-full">暂无内容</p>
      )}
    </div>
  );
}
