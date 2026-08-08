import { CanvasNode } from '@/types/canvas';
import PhotoWallClient from './PhotoWallClient';
import MemoryCardClient from './MemoryCardClient';

interface Props {
  nodes: CanvasNode[];
}

/**
 * 访客端：读 fields.canvas_data 递归渲染容器树
 * - 根级节点强制 100% 宽度（填满容器）
 * - 子节点尊重用户设定的宽度（px 或 %）
 * - 图片高度：cover 模式用设定高度，其他用 auto
 * - 响应式：row 在移动端自动堆叠
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
  return `${basis} 1 0`;
}

function NodeRenderer({ node, isRoot = false }: { node: CanvasNode; isRoot?: boolean }) {
  const p = node.props || {};
  // Build typography style (cascades to children via CSS)
  const typoStyle: React.CSSProperties = {};
  if (p.fontFamily) typoStyle.fontFamily = p.fontFamily;
  if (p.fontSize) typoStyle.fontSize = p.fontSize;
  if (p.fontWeight) typoStyle.fontWeight = p.fontWeight;
  if (p.fontStyle) typoStyle.fontStyle = p.fontStyle;
  if (p.textDecoration) typoStyle.textDecoration = p.textDecoration;
  if (p.color) typoStyle.color = p.color;
  if (p.textAlign) typoStyle.textAlign = p.textAlign as React.CSSProperties['textAlign'];
  if (p.lineHeight) typoStyle.lineHeight = p.lineHeight;
  if (p.letterSpacing) typoStyle.letterSpacing = p.letterSpacing;
  if (p.textTransform) typoStyle.textTransform = p.textTransform as any;

  const style: React.CSSProperties = {
    width: isRoot ? '100%' : (p.width || '100%'),
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
    ...typoStyle,
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
          <div key={c.id} style={{ flex: colFlex(c.props), minWidth: stack ? 120 : 0, maxWidth: '100%' }}>
            <NodeRenderer node={c} />
          </div>
        ))}
      </div>
    );
  }
  if (node.type === 'column') {
    const colWidth = (!isRoot && p.width === '100%') ? 'auto' : (style.width || 'auto');
    return (
      <div style={{ ...style, width: colWidth, display: 'flex', flexDirection: 'column', justifyContent: p.valign || 'top' }}>
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
      const pp = node.props || {};
      return (
        <div
          style={{ ...style, borderLeft: isQuote ? '4px solid #d4a574' : undefined, background: isQuote ? '#f8f5f0' : undefined, padding: isQuote ? undefined : pad(pp), lineHeight: pp.lineHeight ? undefined : 1.7, color: pp.color || (isQuote ? undefined : '#5a5349') }}
          className="text-sm"
          dangerouslySetInnerHTML={{ __html: (node.content as any)?.html || '' }}
        />
      );
    }
    case 'image': {
      const c = node.content as any;
      if (!c?.src) return <div style={{ ...style, minHeight: 40, background: '#f5f5f0' }} />;
      const fitMode = c.fitMode || 'fit-width';
      // cover 模式尊重设定高度；其他模式高度自动
      const imgContainerStyle: React.CSSProperties = { ...style };
      if (fitMode !== 'cover' && imgContainerStyle.height) {
        imgContainerStyle.height = 'auto';
      }
      return (
        <div style={imgContainerStyle}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.src} alt={c.alt || ''}
            style={{
              width: fitMode === 'original' ? undefined : '100%',
              maxWidth: fitMode === 'original' ? '100%' : undefined,
              height: fitMode === 'cover' ? '100%' : 'auto',
              objectFit: fitMode === 'cover' ? 'cover' : undefined,
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
    case 'timeline': {
      const items = (node.content as any)?.items || [];
      return (
        <div style={style}>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: '#d4a574' }} />
            {items.map((item: any, i: number) => (
              <div key={i} style={{ position: 'relative', marginBottom: 16 }}>
                <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: '#d4a574', border: '2px solid #fff', boxShadow: '0 0 0 2px #d4a574' }} />
                <div style={{ background: '#fff', borderRadius: 8, padding: '12px 16px', boxShadow: '0 1px 3px rgba(0,0,0,.06)', border: '1px solid #f0ede5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#d4a574', fontWeight: 600 }}>{item.icon || '📌'} {item.date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: '#2d2a24', marginBottom: 4 }}>{item.title}</div>
                      <div style={{ fontSize: 13, color: '#5a5349', lineHeight: 1.6 }}>{item.description}</div>
                    </div>
                    {item.image && (
                      <img src={item.image} alt={item.title || ''} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case 'skill-bar': {
      const skills = (node.content as any)?.skills || [];
      return (
        <div style={{ ...style, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {skills.map((s: any, i: number) => (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: '#2d2a24' }}>{s.name}</span>
                <span style={{ fontSize: 12, color: '#8b8b8b' }}>{s.level}%</span>
              </div>
              <div style={{ height: 8, borderRadius: 4, background: '#f0ede5', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${s.level}%`, borderRadius: 4, background: s.color || '#4a90e2', transition: 'width 1.5s ease' }} />
              </div>
            </div>
          ))}
        </div>
      );
    }
    case 'stats': {
      const stats = (node.content as any)?.stats || [];
      return (
        <div style={{ ...style, display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-around' }}>
          {stats.map((s: any, i: number) => (
            <div key={i} style={{ textAlign: 'center', flex: '1 1 120px', minWidth: 120 }}>
              <div style={{ fontSize: 32, marginBottom: 4 }}>{s.icon || '📊'}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#2d2a24' }}>{s.value}{s.suffix}</div>
              <div style={{ fontSize: 13, color: '#8b8b8b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      );
    }
    case 'tags': {
      const tags = (node.content as any)?.tags || [];
      const color = (node.content as any)?.color || '#4a90e2';
      return (
        <div style={{ ...style, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tags.map((tag: string, i: number) => (
            <span key={i} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 999, background: `${color}15`, color, border: `1px solid ${color}30` }}>{tag}</span>
          ))}
        </div>
      );
    }
    case 'video': {
      const c = node.content as any;
      const url = c?.url || '';
      const platform = c?.platform || 'youtube';
      if (!url) return <div style={{ ...style, minHeight: 200, background: '#f5f5f0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8b4ae', fontSize: 14 }} />;
      let embedUrl = url;
      if (platform === 'youtube') { const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/); if (m) embedUrl = `https://www.youtube.com/embed/${m[1]}`; }
      else if (platform === 'bilibili') { const m = url.match(/bilibili\.com\/video\/(BV[\w]+)/); if (m) embedUrl = `https://player.bilibili.com/player.html?bvid=${m[1]}`; }
      return (
        <div style={{ ...style, position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden' }}>
          <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allowFullScreen />
        </div>
      );
    }
    case 'accordion': {
      const panels = (node.content as any)?.panels || [];
      return (
        <div style={{ ...style, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {panels.map((panel: any, i: number) => (
            <details key={i} style={{ borderRadius: 8, border: '1px solid #e8e6e0', overflow: 'hidden' }} open={i === 0}>
              <summary style={{ padding: '12px 16px', cursor: 'pointer', fontWeight: 500, fontSize: 14, color: '#2d2a24', background: '#faf9f6', listStyle: 'none' }}>
                {panel.title}
              </summary>
              <div style={{ padding: '12px 16px', fontSize: 13, color: '#5a5349', lineHeight: 1.6, background: '#fff' }}>
                {panel.content}
              </div>
            </details>
          ))}
        </div>
      );
    }
    case 'photo-wall': {
      const c = node.content as any;
      const imgs = c?.images || [];
      const cols = c?.columns || 3;
      const gap = c?.gap ?? 8;
      if (imgs.length === 0) return <div style={{ ...style, minHeight: 80, background: '#f5f5f0', borderRadius: node.props?.borderRadius || 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8b4ae', fontSize: 13 }} />;
      return (
        <div style={style}>
          <PhotoWallClient images={imgs} columns={cols} gap={gap} borderRadius={node.props?.borderRadius || 8} />
        </div>
      );
    }
    case 'memory-card': {
      const p = node.props || {};
      const c = node.content as any;
      return (
        <div style={style}>
          <MemoryCardClient
            title={c?.title || '记忆卡片'}
            subtitle={c?.subtitle || '点击查看详细内容'}
            icon={c?.icon || '\U0001F3B4'}
            coverImage={c?.coverImage || ''}
            canvasData={c?.canvasData || []}
            bgColor={p.bgColor || '#f8f5f0'}
            borderRadius={p.borderRadius || 12}
          />
        </div>
      );
    }
    default:
      return <div style={style} />;
  }
}
