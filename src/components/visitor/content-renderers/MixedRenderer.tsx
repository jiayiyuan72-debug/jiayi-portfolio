import { Section, ContentItem } from '@/types';
import CardRenderer from './CardRenderer';
import TimelineRenderer from './TimelineRenderer';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

export default function MixedRenderer({ section, contentItems }: Props) {
  return (
    <div className="space-y-10">
      {contentItems.map(item => {
        const fields = item.fields || {};

        return (
          <div key={item.id}>
            {/* 内容块标题 */}
            {item.title && (
              <h3 className="text-xl font-semibold text-[#2d2a24] mb-2">
                {item.title}
              </h3>
            )}
            {fields.subtitle && (
              <p className="text-sm text-[#8b8b8b] mb-4">{fields.subtitle}</p>
            )}

            {/* 正文 */}
            {item.body && (
              <div className="prose text-sm text-[#5a5349] whitespace-pre-line mb-4">
                {item.body}
              </div>
            )}

            {/* 标签 */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
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
        <p className="text-sm text-[#b8b4ae]">暂无内容</p>
      )}
    </div>
  );
}
