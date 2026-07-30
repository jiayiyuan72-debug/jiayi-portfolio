import { Section, ContentItem } from '@/types';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

export default function TimelineRenderer({ section, contentItems }: Props) {
  const accentColor = section.style_config?.accent_color || '#d4a574';

  return (
    <div className="relative">
      {/* 时间轴线 */}
      <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-[#e8e4de] -translate-x-1/2" />

      {contentItems.map((item, index) => {
        const fields = item.fields || {};
        const isLeft = index % 2 === 0;

        return (
          <div
            key={item.id}
            className={`relative flex items-start mb-12 ${
              isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
            } flex-row`}
          >
            {/* 时间线节点 */}
            <div
              className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full -translate-x-1/2 mt-2 z-10"
              style={{ backgroundColor: accentColor }}
            />

            {/* 内容卡片 */}
            <div className={`ml-10 md:ml-0 md:w-1/2 ${isLeft ? 'md:pr-12' : 'md:pl-12'}`}>
              <div className="bg-white rounded-xl p-6 shadow-sm border border-[#e8e4de] card-hover">
                {/* 时间 */}
                {(fields.start_date || fields.end_date) && (
                  <span className="text-xs text-[#8b8b8b] block mb-2">
                    {fields.start_date || ''}
                    {fields.start_date && fields.end_date ? ' - ' : ''}
                    {fields.end_date || ''}
                  </span>
                )}

                <h3 className="text-lg font-semibold text-[#2d2a24] mb-1">
                  {item.title}
                </h3>

                {(fields.company || fields.position || fields.school || fields.major) && (
                  <p className="text-sm text-[#8b8b8b] mb-3">
                    {fields.company || fields.school || ''}
                    {fields.position || fields.major ? ` · ${fields.position || fields.major}` : ''}
                  </p>
                )}

                {/* 描述/工作内容 */}
                {item.body && (
                  <div className="text-sm text-[#5a5349] leading-relaxed whitespace-pre-line mb-3">
                    {item.body}
                  </div>
                )}

                {/* 活动/获奖 */}
                {(fields.activities || fields.achievements) && (
                  <div className="space-y-2 mt-3 pt-3 border-t border-[#e8e4de]">
                    {fields.activities && (
                      <div>
                        <span className="text-xs font-medium text-[#8b8b8b]">学生工作/活动</span>
                        <p className="text-sm text-[#5a5349] whitespace-pre-line mt-1">{fields.activities}</p>
                      </div>
                    )}
                    {fields.achievements && (
                      <div>
                        <span className="text-xs font-medium text-[#8b8b8b]">获奖情况</span>
                        <p className="text-sm text-[#5a5349] whitespace-pre-line mt-1">{fields.achievements}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* 输出与思考 */}
                {fields.output && (
                  <div className="mt-3 pt-3 border-t border-[#e8e4de]">
                    <span className="text-xs font-medium text-[#8b8b8b]">主要产出</span>
                    <p className="text-sm text-[#5a5349] whitespace-pre-line mt-1">{fields.output}</p>
                  </div>
                )}
                {fields.reflection && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-[#8b8b8b]">业务思考</span>
                    <p className="text-sm text-[#5a5349] italic mt-1">{fields.reflection}</p>
                  </div>
                )}

                {/* 工作内容字段 */}
                {fields.content && (
                  <div className="mt-3 pt-3 border-t border-[#e8e4de]">
                    <span className="text-xs font-medium text-[#8b8b8b]">工作内容</span>
                    <p className="text-sm text-[#5a5349] whitespace-pre-line mt-1">{fields.content}</p>
                  </div>
                )}

                {/* 标签 */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
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
            </div>
          </div>
        );
      })}
    </div>
  );
}
