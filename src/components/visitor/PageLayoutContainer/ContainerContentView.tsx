import { PageContainer, ImageFocal } from '@/types/page-layout';

interface Props {
  container: PageContainer;
  /** 编辑态：文本容器 contentEditable、图片容器可触发上传（后台编辑器用） */
  editing?: boolean;
  onEditContent?: (patch: Record<string, any>) => void;
  onPickImage?: () => void;
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
export default function ContainerContentView({ container, editing, onEditContent, onPickImage }: Props) {
  const { type, content } = container;
  const style = container.style || {};

  switch (type) {
    case 'text': {
      const autoFont = content.autoFont;
      const fontSize = autoFont ? Math.max(10, (container.w || 200) * 0.08) : (content.fontSize || DEFAULT_FONT);
      return (
        <div
          className={`whitespace-pre-wrap leading-relaxed ${editing ? 'cursor-text outline-none' : ''}`}
          style={{ color: style.color || '#2d2a24', textAlign: content.align || 'left', fontSize, lineHeight: 1.5, minHeight: '100%' }}
          contentEditable={editing || undefined}
          suppressContentEditableWarning
          onBlur={(e) => onEditContent?.({ text: e.currentTarget.innerText })}
        >
          {!editing && (content.text || '')}
          {editing && ''}
        </div>
      );
    }
    case 'image': {
      if (editing && onPickImage) {
        // 编辑态：双击图片容器→上传（提示占位，双击由上层触发 onPickImage）
        return (
          <div
            className="w-full h-full flex flex-col items-center justify-center text-xs text-[#b8b4ae] bg-[#f5f5f0] rounded cursor-pointer hover:bg-[#efefec]"
            onClick={onPickImage}
          >
            <span className="text-xl mb-1">🖼️</span>
            {content.url ? <span className="px-2">点击更换图片</span> : <span>双击上传图片</span>}
          </div>
        );
      }
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
    case 'quote':
      return (
        <div className="w-full h-full p-2 border-l-4 border-[#d4a574] bg-[#f8f5f0] flex flex-col justify-center overflow-hidden">
          <div className="text-sm text-[#5a5349] italic whitespace-pre-wrap">{content.text || '引用…'}</div>
          {content.author && <div className="text-xs text-[#b8b4ae] mt-1">— {content.author}</div>}
        </div>
      );
    case 'gallery':
      return (
        <div className="w-full h-full overflow-auto grid gap-1" style={{ gridTemplateColumns: 'repeat(3,1fr)', gridAutoRows: '1fr' }}>
          {(content.images || []).map((img: string, i: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={img} className="w-full h-full object-cover rounded" />
          ))}
          {(!content.images || content.images.length === 0) && (
            <div className="col-span-3 flex items-center justify-center text-xs text-[#b8b4ae] bg-[#f5f5f0] rounded">双击添加图片</div>
          )}
        </div>
      );
    case 'section':
    case 'row':
    case 'column':
      // 布局容器：透明骨架，供子容器定位
      return (
        <div className="w-full h-full"
          style={{ background: style.bg || 'transparent', border: style.outline ? '1px dashed #d4a57480' : 'none', borderRadius: style.radius ?? 0 }}>
          {content.label && editing && (
            <div className="absolute top-1 left-2 text-[10px] text-[#b8b4ae]">{content.label}</div>
          )}
        </div>
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
