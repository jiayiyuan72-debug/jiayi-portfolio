import Link from 'next/link';
import { Section } from '@/types/section';

interface Props {
  section: Section;
}

/**
 * 首页板块入口卡片：展示板块名称/副标题/封面，点击进入对应独立页 /{slug}
 */
export default function SectionEntryCard({ section }: Props) {
  const page = section.style_config?.page;
  const subtitle = page?.subtitle || section.meta_description || '';
  const coverImage = page?.cover_image;

  return (
    <Link
      href={`/${section.slug}`}
      className="group block bg-white rounded-xl overflow-hidden shadow-sm border border-[#e8e4de] hover:shadow-md hover:border-[#d4a574] transition-all duration-200"
    >
      {/* 封面图（可选） */}
      {coverImage ? (
        <div className="aspect-[16/9] overflow-hidden bg-[#f8f5f0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={section.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-[#f8f5f0] to-[#efe7dc]">
          <span
            className="text-4xl opacity-60"
            style={{ fontFamily: "'Ma Shan Zheng', cursive, 'system-ui'" }}
          >
            {section.style_config?.icon || section.name.slice(0, 1)}
          </span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#2d2a24] group-hover:text-[#d4a574] transition-colors">
            {section.name}
          </h3>
          <span className="text-[#b8b4ae] text-xs group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
        {subtitle && (
          <p className="mt-1.5 text-sm text-[#8b8b8b] line-clamp-2">{subtitle}</p>
        )}
      </div>
    </Link>
  );
}
