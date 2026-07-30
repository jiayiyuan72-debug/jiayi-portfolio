import { Section, ContentItem } from '@/types';
import TimelineRenderer from './content-renderers/TimelineRenderer';
import CardRenderer from './content-renderers/CardRenderer';
import GalleryRenderer from './content-renderers/GalleryRenderer';
import ArticleRenderer from './content-renderers/ArticleRenderer';
import TravelogueRenderer from './content-renderers/TravelogueRenderer';
import DiaryRenderer from './content-renderers/DiaryRenderer';
import MixedRenderer from './content-renderers/MixedRenderer';

interface Props {
  section: Section;
  contentItems: ContentItem[];
}

const renderers: Record<string, React.ComponentType<Props>> = {
  timeline: TimelineRenderer,
  card: CardRenderer,
  gallery: GalleryRenderer,
  article: ArticleRenderer,
  travelogue: TravelogueRenderer,
  diary: DiaryRenderer,
  mixed: MixedRenderer,
};

export default function SectionRenderer({ section, contentItems }: Props) {
  const Renderer = renderers[section.layout_type];

  if (!Renderer) {
    return (
      <section id={section.slug}>
        <div className="text-[#b8b4ae]">未知布局类型: {section.layout_type}</div>
      </section>
    );
  }

  if (contentItems.length === 0 && section.layout_type !== 'mixed') {
    return null;
  }

  const style = section.style_config || {};

  return (
    <section
      id={section.slug}
      className="scroll-mt-16"
      style={{
        backgroundColor: style.bg_color || '#ffffff',
        color: style.text_color || '#2d2a24',
      }}
    >
      <div
        className="max-w-5xl mx-auto px-4 sm:px-6"
        style={{ padding: style.padding || '64px 24px' }}
      >
        {/* 板块标题 */}
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#2d2a24]">
            {section.name}
          </h2>
          {section.meta_description && (
            <p className="mt-2 text-sm text-[#8b8b8b]">{section.meta_description}</p>
          )}
        </div>

        <Renderer section={section} contentItems={contentItems} />
      </div>
    </section>
  );
}
