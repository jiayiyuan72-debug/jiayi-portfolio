import { Section, ContentItem } from '@/types';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

export default function DiaryRenderer({ section, contentItems }: Props) {
  return (
    <div className="space-y-6">
      {contentItems.map(item => {
        const fields = item.fields || {};

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-[#e8e4de]"
          >
            {/* 日期 */}
            <div className="flex items-start justify-between mb-3">
              <div>
                {item.published_at && (
                  <time
                    dateTime={item.published_at}
                    className="text-sm font-medium text-[#2d2a24]"
                  >
                    {new Date(item.published_at).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </time>
                )}
                {!item.published_at && (
                  <span className="text-sm text-[#2d2a24] font-medium">
                    {item.title}
                  </span>
                )}
              </div>

              {/* 天气 + 心情 */}
              <div className="flex items-center gap-3 text-xs text-[#8b8b8b]">
                {fields.weather && <span>{fields.weather}</span>}
                {fields.mood && (
                  <span className="px-2 py-0.5 bg-[#f8f5f0] rounded-full">
                    {fields.mood}
                  </span>
                )}
              </div>
            </div>

            {/* 标题（如果已显示 date 且 title 不是日期） */}
            {item.published_at && item.title && (
              <h3 className="text-base font-medium text-[#2d2a24] mb-2">{item.title}</h3>
            )}

            {/* 正文 */}
            {item.body && (
              <div className="text-sm text-[#5a5349] leading-relaxed whitespace-pre-line">
                {item.body}
              </div>
            )}

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
        <p className="text-sm text-[#b8b4ae]">暂无日记</p>
      )}
    </div>
  );
}
