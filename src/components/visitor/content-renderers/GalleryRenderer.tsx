import { Section, ContentItem } from '@/types';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

export default function GalleryRenderer({ section, contentItems }: Props) {
  const columns = section.style_config?.columns || 3;

  return (
    <div
      className="grid gap-4"
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${columns === 4 ? '200px' : '250px'}, 1fr))`,
      }}
    >
      {contentItems.map(item => {
        const fields = item.fields || {};

        return (
          <div
            key={item.id}
            className="group relative aspect-square bg-[#f8f5f0] rounded-xl overflow-hidden border border-[#e8e4de]"
          >
            {/* 占位图（无实际图片时显示） */}
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">📷</span>
            </div>

            {/* 悬停信息 */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end p-4">
              <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm font-medium">{item.title || fields.caption}</p>
                {fields.location && (
                  <p className="text-xs text-white/70 mt-1">{fields.location}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {contentItems.length === 0 && (
        <p className="text-sm text-[#b8b4ae] col-span-full">暂无图片</p>
      )}
    </div>
  );
}
