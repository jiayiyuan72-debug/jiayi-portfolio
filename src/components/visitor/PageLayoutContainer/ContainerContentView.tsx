import { PageContainer, ImageFocal } from '@/types/page-layout';

interface Props {
  container: PageContainer;
}

// 图片 cover 模式：根据焦点 focal 计算展示的哪一部分
function focalBackground(url: string, fit: string, focal?: ImageFocal) {
  const f = focal || { x: 0.5, y: 0.5, scale: 1 };
  if (fit === 'cover') {
    // object-position + 通过 scale 放大实现"选择展示的一部分"
    const px = f.x * 100;
    const py = f.y * 100;
    const scale = f.scale || 1;
    return {
      backgroundImage: `url(${url})`,
      backgroundSize: `${scale * 100}% ${scale * 100}%`,
      backgroundPosition: `${px}% ${py}%`,
    } as React.CSSProperties;
  }
  return {
    backgroundImage: `url(${url})`,
    backgroundSize: fit === 'contain' ? 'contain' : '100% 100%',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } as React.CSSProperties;
}

/** 单个容器内容渲染（前台与编辑预览共用） */
export default function ContainerContentView({ container }: Props) {
  const { type, content } = container;
  const style = container.style || {};

  switch (type) {
    case 'text': {
      const autoFont = content.autoFont;
      const fontSize = autoFont ? Math.max(10, (container.w || 200) * 0.08) : (content.fontSize || DEFAULT_FONT);
      return (
        <div
          className="whitespace-pre-wrap leading-relaxed"
          style={{ color: style.color || '#2d2a24', textAlign: content.align || 'left', fontSize, lineHeight: 1.5 }}
        >
          {content.text || ''}
        </div>
      );
    }
    case 'image': {
      if (!content.url) {
        return <div className="w-full h-full flex items-center justify-center text-xs text-[#b8b4ae] bg-[#f5f5f0]">图片</div>;
      }
      return (
        <div className="w-full h-full rounded overflow-hidden" style={focalBackground(content.url, content.fit || 'contain', content.focal)} />
      );
    }
    case 'video': {
      if (!content.url) return <div className="w-full h-full flex items-center justify-center text-xs text-[#b8b4ae] bg-[#f5f5f0]">视频</div>;
      // 支持外链 embed 或直链视频
      const isEmbed = content.type === 'embed' || /embed|youtube|bilibili/i.test(content.url);
      if (isEmbed && /^https?:\/\//.test(content.url)) {
        return (
          <div className="w-full h-full">
            <iframe src={content.url} className="w-full h-full" frameBorder="0" allowFullScreen />
          </div>
        );
      }
      return <video src={content.url} controls className="w-full h-full object-contain" />;
    }
    case 'rich':
      return (
        <div
          className="prose text-sm leading-relaxed overflow-auto"
          dangerouslySetInnerHTML={{ __html: content.html || '' }}
          style={{ color: style.color || '#2d2a24' }}
        />
      );
    case 'card':
      return (
        <div
          className="w-full h-full rounded-lg p-3 flex flex-col overflow-hidden"
          style={{
            background: style.bg || '#ffffff',
            borderRadius: style.radius ?? 8,
            border: style.border === false ? 'none' : '1px solid #e8e4de',
          }}
        >
          {content.title && <div className="font-semibold text-[#2d2a24] mb-1">{content.title}</div>}
          <div className="text-sm text-[#5a5349] whitespace-pre-wrap">{content.text}</div>
        </div>
      );
    case 'button':
      return (
        <button
          className={`inline-flex items-center justify-center px-4 rounded-full transition-colors text-sm ${content.href ? '' : 'cursor-default'}`}
          style={{ background: content.color || '#2d2a24', color: content.textColor || '#ffffff' }}
          onClick={content.href ? () => { if (content.href.startsWith('/')) return; } : undefined}
        >
          {content.label || '按钮'}
        </button>
      );
    case 'divider':
      return (
        <div className="w-full" style={{ borderTop: `1px ${content.style || 'solid'} #e8e4de` }} />
      );
    case 'spacer':
    case 'group':
      return (
        <div className="w-full h-full" style={{ background: style.bg || 'transparent' }}>
          {type === 'group' && content.label && (
            <div className="text-[10px] text-[#b8b4ae] mb-1">{content.label}</div>
          )}
        </div>
      );
    default:
      return null;
  }
}

const DEFAULT_FONT = 14;
