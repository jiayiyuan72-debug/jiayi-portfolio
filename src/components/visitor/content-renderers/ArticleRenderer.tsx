import { Section, ContentItem } from '@/types';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

export default function ArticleRenderer({ section, contentItems }: Props) {
  return (
    <div className="space-y-8">
      {contentItems.map(item => {
        const fields = item.fields || {};

        return (
          <article
            key={item.id}
            className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-[#e8e4de] card-hover"
          >
            <h3 className="text-xl font-semibold text-[#2d2a24] mb-2">
              {item.title}
            </h3>

            <div className="flex items-center gap-3 text-xs text-[#8b8b8b] mb-4">
              {item.published_at && (
                <time dateTime={item.published_at}>
                  {new Date(item.published_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              )}
              {fields.read_time && (
                <span>· {fields.read_time} 分钟阅读</span>
              )}
            </div>

            {fields.excerpt && (
              <p className="text-sm text-[#5a5349] italic mb-4 border-l-2 border-[#d4a574] pl-4">
                {fields.excerpt}
              </p>
            )}

            {/* 正文 */}
            {item.body && (
              <div className="prose text-sm text-[#5a5349] whitespace-pre-line">
                {item.body}
              </div>
            )}

            {/* 标签 */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-[#e8e4de]">
                {item.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-[#f8f5f0] text-[#8b8b8b] rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        );
      })}

      {contentItems.length === 0 && (
        <p className="text-sm text-[#b8b4ae]">暂无文章</p>
      )}
    </div>
  );
}
