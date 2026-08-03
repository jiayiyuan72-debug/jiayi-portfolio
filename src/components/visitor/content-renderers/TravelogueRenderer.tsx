import { Section, ContentItem } from '@/types';
import BlockRenderer from '../BlockRenderer';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

export default function TravelogueRenderer({ section, contentItems }: Props) {
  return (
    <div className="space-y-8">
      {contentItems.map(item => {
        const fields = item.fields || {};

        return (
          <div
            key={item.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e8e4de] card-hover"
          >
            {/* 封面占位 */}
            <div className="h-48 bg-gradient-to-br from-[#e8c4a0] to-[#d4a574]/30 flex items-center justify-center">
              <span className="text-5xl">📍</span>
            </div>

            <div className="p-6">
              <h3 className="text-xl font-semibold text-[#2d2a24] mb-1">
                {fields.destination || item.title}
              </h3>

              {fields.travel_date && (
                <span className="text-xs text-[#8b8b8b] block mb-4">
                  {fields.travel_date}
                </span>
              )}

              {/* 日记内容：块编辑模式用 BlockRenderer，经典模式用 body */}
              {Array.isArray(fields.blocks) && fields.blocks.length > 0 ? (
                <div className="prose text-sm text-[#5a5349]">
                  <BlockRenderer blocks={fields.blocks} />
                </div>
              ) : (
                item.body && (
                  <div className="prose text-sm text-[#5a5349] whitespace-pre-line">
                    {item.body}
                  </div>
                )
              )}

              {/* 照片集占位 */}
              {fields.photos && Array.isArray(fields.photos) && fields.photos.length > 0 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                  {fields.photos.map((photo: string, i: number) => (
                    <div
                      key={i}
                      className="flex-shrink-0 w-24 h-24 bg-[#f8f5f0] rounded-lg flex items-center justify-center"
                    >
                      <span className="text-2xl">📸</span>
                    </div>
                  ))}
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
            </div>
          </div>
        );
      })}

      {contentItems.length === 0 && (
        <p className="text-sm text-[#b8b4ae]">暂无游记</p>
      )}
    </div>
  );
}
