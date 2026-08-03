import { Block, SPACER_HEIGHTS } from '@/types/block';

interface Props {
  blocks: Block[];
}

const FONT_SIZES: Record<string, string> = {
  sm: '0.875rem',
  md: '1rem',
  lg: '1.25rem',
};

const IMAGE_WIDTHS: Record<string, string> = {
  full: '100%',
  half: '50%',
  third: '33.333%',
};

/** 前台块渲染器：按顺序渲染每个内容块 */
export default function BlockRenderer({ blocks }: Props) {
  return (
    <div className="block-container space-y-4">
      {blocks.map(block => {
        const p = block.props || {};

        switch (block.type) {
          case 'text':
            return (
              <p
                key={block.id}
                className="text-[#5a5349] leading-relaxed whitespace-pre-line"
                style={{
                  textAlign: p.align || 'left',
                  fontSize: FONT_SIZES[p.fontSize || 'md'],
                }}
              >
                {p.content}
              </p>
            );
          case 'heading': {
            const Tag = (p.level || 'h3') as 'h2' | 'h3' | 'h4';
            return (
              <Tag key={block.id} className="text-[#2d2a24] font-semibold">
                {p.content}
              </Tag>
            );
          }
          case 'image':
            return (
              <figure key={block.id} className="my-2" style={{ textAlign: p.align || 'left' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.caption || ''}
                  className="rounded-lg border border-[#e8e4de] object-cover max-h-96"
                  style={{ width: p.width ? IMAGE_WIDTHS[p.width] : '100%' }}
                  loading="lazy"
                />
                {p.caption && (
                  <figcaption className="mt-1.5 text-xs text-[#b8b4ae]">{p.caption}</figcaption>
                )}
              </figure>
            );
          case 'quote':
            return (
              <blockquote
                key={block.id}
                className="border-l-4 border-[#d4a574] pl-4 my-2 text-[#5a5349] italic leading-relaxed"
              >
                <p className="whitespace-pre-line">"{p.content}"</p>
                {p.author && <cite className="block mt-1 text-sm not-italic text-[#b8b4ae]">— {p.author}</cite>}
              </blockquote>
            );
          case 'divider':
            return (
              <hr
                key={block.id}
                className="border-0 border-top my-2"
                style={{
                  borderTop: `1px ${p.style || 'solid'} #e8e4de`,
                  width: '100%',
                }}
              />
            );
          case 'spacer':
            return (
              <div key={block.id} style={{ height: SPACER_HEIGHTS[p.height || 'md'] }} />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
