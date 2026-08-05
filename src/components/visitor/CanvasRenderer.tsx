import { CanvasNode } from '@/types/canvas';

interface Props {
  nodes: CanvasNode[];
}

/** 
 * 访客端：读 fields.canvas_data 递归渲染容器树
 * - 根级节点强制 100% 宽度（忽略固定像素值）
 * - 容器内节点尊重设定宽度，但小于 150px 的固定宽度会被提升为 100%
 * - 流式布局 + 自适应高度 + 响应式
 */
export default function CanvasRenderer({ nodes }: Props) {
  if (!Array.isArray(nodes)) return null;
  return (
    <div className="w-full">{nodes.map(n => <NodeRenderer key={n.id} node={n} isRoot />)}</div>
  );
}

function pad(p: any) {
  return `${p.paddingTop ?? 0}px ${p.paddingRight ?? 0}px ${p.paddingBottom ?? 0}px ${p.paddingLeft ?? 0}px`;
}

/** 获取 column 的 flex 值，支持 flexBasis 比例 */
function colFlex(p: any) {
  const basis = p.flexBasis || '1';
  if (basis === 'auto') return '0 0 auto';
  return `${basis} 1 250px`;
}

/** 清理宽度值：根级或过窄的固定像素宽度统一用 100% */
function sanitizeWidth(rawWidth: string | undefined, isRoot: boolean): string {
  if (!rawWidth || rawWidth === '100%' || rawWidth === 'auto') return '100%';
  if (isRoot) return '100%';
  // 解析像素值，小于 150px 的视为过窄
  const pxMatch = rawWidth.match(/^(\d+(?:\.\d+)?)px$/);
  if (pxMatch && parseFloat(pxMatch[1]) < 150) return '100%';
  return rawWidth;
}

function NodeRenderer({ node, isRoot = false }: { node: CanvasNode; isRoot?: boolean }) {
  const p = node.props || {};
  const style: React.CSSProperties = {
    width: sanitizeWidth(p.width, isRoot),
    height: p.height === 'auto' ? undefined : p.height,
    marginTop: p.marginTop ?? 0,
    marginRight: p.marginRight ?? 0,
    marginBottom: p.marginBottom ?? 12,
    marginLeft: p.marginLeft ?? 0,
    padding: pad(p),
    background: p.bgColor || (node.type === 'section' ? '#faf9f6' : 'transparent'),
    borderRadius: p.borderRadius ?? 0,
    textAlign: 'left',
    boxSizing: 'border-box',
  };
  if (node.type === 'row') {
    const stack = p.responsiveStack !== false;
    return (
      <div style={{
        ...style,
        display: 'flex',
        flexWrap: stack ? 'wrap' : 'nowrap',
        gap: p.gap ?? 16,
        alignItems: p.alignItems || 'stretch',
      }}>
        {node.children.map(c => (
          <div key={c.id} style={{ flex: colFlex(c.props), minWidth: stack ? 200 : 0, maxWidth: '100%' }}>
            <NodeRenderer node={c} />
          </div>
        ))}
      </div>
    );
  }
  if (node.type === 'column') {
    return (
      <div style={{ ...style, display: 'flex', flexDirection: 'column', justifyContent: p.valign || 'top' }}>
        {node.children.map(c => <NodeRenderer key={c.id} node={c} />)}
      </div>
    );
  }
  if (node.type === 'section') {
    return (
      <div style={style}>
        {node.content?.showTitle !== false && node.content?.title && (
          <h3 className="text-lg font-semibold text-[#2d2a24] mb-3">{node.content.title}</h3>
        )}
        {node.children.map(c => <NodeRenderer key={c.id} node={c} />)}
      </div>
    );
  }
  if (node.type === 'card') {
    const shadow = { none: 'none', sm: '0 1px 2px rgba(0,0,0,.05)', md: '0 2px 8px rgba(0,0,0,.08)', lg: '0 4px 16px rgba(0,0,0,.1)' }[p.shadow || 'sm'];
    return (
      <div style={{ ...style, boxShadow: shadow, border: p.borderColor ? `1px solid ${p.borderColor}` : '1px solid #e8e6e0' }}>
        {node.children.map(c => <NodeRenderer key={c.id} node={c} />)}
      </div>
    );
  }
  return <LeafRenderer node={node} style={style} />;
}

function LeafRenderer({ node, style }: { node: CanvasNode; style: React.CSSProperties }) {
  switch (node.type) {
    case 'text':
    case 'quote': {
      const isQuote = node.type === 'quote';
      return (
        <div
          style={{ ...style, borderLeft: isQuote ? '4px solid #d4a574' : undefined, background: isQuote ? '#f8f5f0' : undefined, padding: isQuote ? undefined : pad(node.props), lineHeight: 1.7 }}
          className="text-sm text-[#5a5349]"
          dangerouslySetInnerHTML={{ __html: (node.content as any)?.html || '' }}
        />
      );
    }
    case 'image': {
      const c = node.content as any;
      if (!c?.src) return <div style={{ ...style, minHeight: 40, background: '#f5f5f0' }} />;
      return (
        <div style={style}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.src} alt={c.alt || ''}
            style={{
              width: c.fitMode === 'original' ? undefined : '100%',
              maxWidth: c.fitMode === 'original' ? '100%' : undefined,
              height: c.fitMode === 'cover' ? '100%' : 'auto',
              objectFit: c.fitMode === 'cover' ? 'cover' : undefined,
              borderRadius: node.props.borderRadius ?? 0,
            }} />
          {c.caption && <div className="text-xs text-[#b8b4ae] mt-1 text-center">{c.caption}</div>}
        </div>
      );
    }
    case 'gallery': {
      const c = node.content as any;
      const cols = c?.columns || 3;
      const imgs = c?.images || [];
      return (
        <div style={{ ...style, display: 'grid', gridTemplateColumns: `repeat(auto-fill, minmax(${Math.floor(100/cols)}%, 1fr))`, gap: c?.gap ?? 8 }}>
          {imgs.map((img: any, i: number) => (
            <div key={i} className="bg-[#f5f5f0] rounded overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.src || img} className="w-full object-cover" style={{ aspectRatio: '1/1' }} />
            </div>
          ))}
        </div>
      );
    }
    case 'divider':
      return <hr style={{ ...style, border: 'none', borderTop: `${node.props.lineWidth ?? 1}px solid ${node.props.lineColor || '#e8e6e0'}` }} />;
    case 'spacer':
      return <div style={{ ...style, height: node.props.height || '24px' }} />;
    default:
      return <div style={style} />;
  }
}
