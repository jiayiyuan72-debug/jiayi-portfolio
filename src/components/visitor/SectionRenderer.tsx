import { Section, ContentItem } from '@/types';
import TimelineRenderer from './content-renderers/TimelineRenderer';
import CardRenderer from './content-renderers/CardRenderer';
import GalleryRenderer from './content-renderers/GalleryRenderer';
import ArticleRenderer from './content-renderers/ArticleRenderer';
import TravelogueRenderer from './content-renderers/TravelogueRenderer';
import DiaryRenderer from './content-renderers/DiaryRenderer';
import MixedRenderer from './content-renderers/MixedRenderer';
import GridRenderer from './GridRenderer';
import PageLayoutRenderer from './PageLayoutRenderer';
import CanvasRenderer from './CanvasRenderer';

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

  // 画板容器编辑器：板块内内容项带 fields.canvas_data（树形数组）时，优先用 CanvasRenderer
  const canvasData = contentItems.find(i => i.fields?.canvas_data)?.fields.canvas_data;
  // 自由布局：板块内有内容项带 fields.page_layout 时，按 JSON 渲染整页
  const freeLayout = contentItems.find(i => i.fields?.page_layout)?.fields.page_layout;
  // 可视化画布：若板块有任一内容项带了 fields.layout，则按 12 列网格渲染
  const hasGridLayout = contentItems.some(i => i.fields && i.fields.layout);

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
        className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8"
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

        {canvasData ? (
          <div className="w-full">
            <CanvasRenderer nodes={canvasData} />
          </div>
        ) : freeLayout ? (
          <PageLayoutRenderer layout={freeLayout} />
        ) : hasGridLayout ? (
          <GridRenderer section={section} contentItems={contentItems} />
        ) : (
          <Renderer section={section} contentItems={contentItems} />
        )}
      </div>
    </section>
  );
}
