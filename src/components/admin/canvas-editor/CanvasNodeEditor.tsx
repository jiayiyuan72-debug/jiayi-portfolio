'use client';

import { useRef, useState } from 'react';
import { CanvasNode, CanvasType, CANVAS_TYPE_LABELS, LAYOUT_TYPES, canNest, CAN_NEST_IN } from '@/types/canvas';

interface NodeCallbacks {
  onSelectId: (id: string) => void;
  onEditId: (id: string) => void;
  onStopEdit: () => void;
  onUpdateContent: (id: string, patch: Record<string, any>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveOrder: (id: string, dir: -1 | 1) => void;
  onPickImage: (id: string) => void;
  onPickGallery: (id: string) => void;
  onResize: (id: string, patch: { width?: string; height?: string }) => void;
  onAddChild: (parentId: string, type: CanvasType) => void;
}

interface Props extends NodeCallbacks {
  node: CanvasNode;
  selectedId: string | null;
  editingId: string | null;
  depth: number;
  preview: boolean;
}

const EDITABLE_TYPES = ['text', 'quote'];

/** Single canvas node: recursive render with proper child selection */
export default function CanvasNodeEditor(props: Props) {
  const { node, selectedId, editingId, depth, preview, onSelectId, onEditId, onStopEdit, onUpdateContent, onDuplicate, onDelete, onMoveOrder, onPickImage, onPickGallery, onResize, onAddChild } = props;

  const p = node.props || {};
  const isEditable = EDITABLE_TYPES.includes(node.type);
  const isImage = node.type === 'image' || node.type === 'gallery';
  const selected = !preview && node.id === selectedId;
  const editing = !preview && node.id === editingId;
  const [showToolbar, setShowToolbar] = useState(false);
  const [resizeTip, setResizeTip] = useState<{ w: number; h: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // 根级节点（depth=0）或过窄的固定像素宽度统一用 100%
  const rawW = p.width || '100%';
  const isRootNode = depth === 0;
  const pxMatch = rawW.match(/^(\d+(?:\.\d+)?)px$/);
  const tooNarrow = pxMatch && parseFloat(pxMatch[1]) < 150;
  const effectiveWidth = (isRootNode || tooNarrow) ? '100%' : rawW;

  const boxStyle: React.CSSProperties = {
    width: effectiveWidth,
    height: p.height === 'auto' ? undefined : p.height,
    marginTop: p.marginTop ?? 0, marginRight: p.marginRight ?? 0, marginBottom: p.marginBottom ?? 12, marginLeft: p.marginLeft ?? 0,
    padding: p.paddingTop != null ? `${p.paddingTop}px ${p.paddingRight ?? 0}px ${p.paddingBottom ?? 0}px ${p.paddingLeft ?? 0}px` : undefined,
    background: p.bgColor || (node.type === 'section' ? '#faf9f6' : node.type === 'card' ? '#ffffff' : 'transparent'),
    borderRadius: p.borderRadius ?? 0,
    boxSizing: 'border-box',
    textAlign: 'left',
  };

  const handleDoubleClick = () => {
    if (preview) return;
    if (isEditable) onEditId(node.id);
    else if (node.type === 'image') onPickImage(node.id);
    else if (node.type === 'gallery') onPickGallery(node.id);
  };

  const startResize = (dir: 'se' | 's') => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;
    const startW = parseFloat((p.width || '').replace('px', '')) || 200;
    const startH = parseFloat((p.height || '').replace('px', '')) || 80;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      const newW = Math.max(200, startW + dx);
      const newH = Math.max(40, startH + dy);
      onResize(node.id, { width: `${newW}px`, height: `${newH}px` });
      setResizeTip({ w: Math.round(newW), h: Math.round(newH) });
      void dir;
    };
    const up = () => {
      setResizeTip(null);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const contentHtml = (node.content as any)?.html || '';

  const renderToolbar = () => (
    <div className="absolute -top-9 left-0 z-20 flex items-center gap-0.5 bg-black/80 text-white text-xs rounded-lg px-1.5 py-0.5 shadow" onMouseDown={(e) => e.preventDefault()} onMouseUp={(e) => e.stopPropagation()}>
      <button onClick={() => document.execCommand('bold')} className="px-1 font-bold hover:opacity-70">B</button>
      <button onClick={() => document.execCommand('italic')} className="px-1 italic hover:opacity-70">I</button>
      <button onClick={() => document.execCommand('underline')} className="px-1 underline hover:opacity-70">U</button>
      <span className="opacity-30">|</span>
      {['h1','h2','h3'].map(l => (
        <button key={l} onClick={() => document.execCommand('formatBlock', false, l)} className="px-1 uppercase hover:opacity-70">{l}</button>
      ))}
      <button onClick={() => { const href = prompt('链接地址','https://'); if (href) document.execCommand('createLink', false, href); }} className="px-1 hover:opacity-70" title="链接">🔗</button>
      <button onClick={() => document.execCommand('insertUnorderedList')} className="px-1 hover:opacity-70">•≡</button>
    </div>
  );

  const SelectMenu = () => (
    <div className="absolute -top-8 right-0 z-30 flex items-center gap-0.5 bg-[#2d2a24] text-white text-[10px] rounded-lg px-1 py-0.5 shadow">
      <button onClick={(e) => { e.stopPropagation(); onDuplicate(node.id); }} className="px-1 hover:opacity-70" title="复制">⧉</button>
      <button onClick={(e) => { e.stopPropagation(); onMoveOrder(node.id, -1); }} className="px-1 hover:opacity-70" title="上移">↑</button>
      <button onClick={(e) => { e.stopPropagation(); onMoveOrder(node.id, 1); }} className="px-1 hover:opacity-70" title="下移">↓</button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="px-1 hover:opacity-70 text-red-300" title="删除">🗑</button>
    </div>
  );

  // Add-content bar for containers
  const AddContentBar = () => {
    if (preview || !selected || !LAYOUT_TYPES.includes(node.type)) return null;
    const allowed = CAN_NEST_IN[node.type];
    return (
      <div className="mt-2 flex flex-wrap gap-1 border-t border-dashed border-[#d4a574] pt-2">
        {allowed.map(t => (
          <button key={t} onClick={(e) => { e.stopPropagation(); onAddChild(node.id, t); }}
            className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">
            {CANVAS_TYPE_LABELS[t].icon} {CANVAS_TYPE_LABELS[t].label}
          </button>
        ))}
      </div>
    );
  };

  // Shared child props - key change: pass selectedId/editingId down so children can be selected
  const childProps = (c: CanvasNode) => ({
    key: c.id,
    node: c,
    selectedId,
    editingId,
    depth: depth + 1,
    preview,
    onSelectId,
    onEditId,
    onStopEdit,
    onUpdateContent,
    onDuplicate,
    onDelete,
    onMoveOrder,
    onPickImage,
    onPickGallery,
    onResize,
    onAddChild,
  });

  // ---- PREVIEW MODE: render real content without editing UI ----
  if (preview) {
    return <PreviewNode node={node} depth={depth} />;
  }

  // ---- Layout containers ----
  if (node.type === 'row') {
    return (
      <div ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }} onDoubleClick={handleDoubleClick}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'hover:ring-1 hover:ring-[#4a90e2]/40'} rounded bg-white/50`}
        style={{ ...boxStyle, display: 'flex', flexWrap: p.responsiveStack !== false ? 'wrap' : 'nowrap', gap: p.gap ?? 16, alignItems: p.alignItems || 'stretch', marginBottom: p.marginBottom ?? 12 }}>
        {selected && <SelectMenu />}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-2 py-4 flex-1">选中后从下方添加「列」</div>}
                {node.children.map(c => {
          const basis = c.props?.flexBasis || '1';
          const flexVal = basis === 'auto' ? '0 0 auto' : `${basis} 1 200px`;
          return (
            <div key={c.id} style={{ flex: flexVal, minWidth: 0 }} className="relative">
              <CanvasNodeEditor {...childProps(c)} />
            </div>
          );
        })}
        <AddContentBar />
      </div>
    );
  }

  if (node.type === 'column') {
    return (
      <div ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'hover:ring-1 hover:ring-[#4a90e2]/40'} border border-dashed border-[#d8d4cc] rounded`}
        style={{ ...boxStyle, minHeight: 40, display: 'flex', flexDirection: 'column', justifyContent: p.valign || 'top', gap: 4 }}>
        {selected && <SelectMenu />}
        {node.children.map(c => <CanvasNodeEditor {...childProps(c)} />)}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-2 py-3">选中后添加内容</div>}
        <AddContentBar />
      </div>
    );
  }

  if (node.type === 'card') {
    return (
      <div ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'hover:ring-1 hover:ring-[#4a90e2]/40'} border border-[#e8e6e0] rounded bg-white`}
        style={{ ...boxStyle, boxShadow: { none: 'none', sm: '0 1px 2px rgba(0,0,0,.05)', md: '0 2px 8px rgba(0,0,0,.08)', lg: '0 4px 16px rgba(0,0,0,.1)' }[p.shadow || 'sm'] }}>
        {selected && <SelectMenu />}
        {node.children.map(c => <CanvasNodeEditor {...childProps(c)} />)}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-3 py-4">卡片内容（选中后添加）</div>}
        <AddContentBar />
      </div>
    );
  }

  if (node.type === 'section') {
    return (
      <section ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'hover:ring-1 hover:ring-[#4a90e2]/40'} border border-[#e8e4de] rounded`}
        style={boxStyle}>
        {selected && <SelectMenu />}
        <div className="flex items-center justify-between mb-2">
          {(node.content as any)?.showTitle !== false && (
            <span className="text-sm font-semibold text-[#2d2a24]">{((node.content as any)?.title) || '区块'}</span>
          )}
          <span className="text-[10px] text-[#b8b4ae]">{CANVAS_TYPE_LABELS[node.type].label}</span>
        </div>
        {node.children.map(c => <CanvasNodeEditor {...childProps(c)} />)}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] py-4">选中后从下方添加内容</div>}
        <AddContentBar />
      </section>
    );
  }

  // ---- Leaf nodes ----
  const leafStyle: React.CSSProperties = {
    ...boxStyle,
    position: 'relative',
    minHeight: node.type === 'spacer' ? undefined : 24,
    cursor: isEditable || isImage ? 'text' : 'default',
  };

  return (
    <div ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }} onDoubleClick={handleDoubleClick}
      className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'border border-transparent hover:border-[#4a90e2]/40 hover:ring-1 hover:ring-[#4a90e2]/30'} rounded`}
      style={leafStyle}
      onMouseEnter={() => setShowToolbar(true)} onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Content rendering */}
      {node.type === 'text' ? (
        <div className={`text-sm ${editing ? 'outline-none ring-1 ring-green-400' : ''}`} style={{ lineHeight: 1.7 }}
          contentEditable={editing || undefined} suppressContentEditableWarning
          onBlur={(e) => { onUpdateContent(node.id, { html: e.currentTarget.innerHTML }); onStopEdit(); }}
          dangerouslySetInnerHTML={{ __html: editing ? contentHtml : contentHtml }} />
      ) : node.type === 'quote' ? (
        <div className={`border-l-4 border-[#d4a574] bg-[#f8f5f0] px-3 py-2 text-sm ${editing ? 'outline-none ring-1 ring-green-400' : ''}`} style={{ lineHeight: 1.7 }}
          contentEditable={editing || undefined} suppressContentEditableWarning
          onBlur={(e) => { onUpdateContent(node.id, { html: e.currentTarget.innerHTML }); onStopEdit(); }}
          dangerouslySetInnerHTML={{ __html: contentHtml }} />
      ) : node.type === 'image' ? (
        (node.content as any)?.src
          ? <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={(node.content as any).src} alt={(node.content as any).alt || ''}
                className="rounded"
                style={{
                  width: (node.content as any).fitMode === 'original' ? undefined : '100%',
                  maxWidth: (node.content as any).fitMode === 'original' ? '100%' : undefined,
                  height: (node.content as any).fitMode === 'cover' ? '100%' : 'auto',
                  objectFit: (node.content as any).fitMode === 'cover' ? 'cover' : undefined,
                }} />
              {(node.content as any).caption && <div className="text-xs text-[#b8b4ae] text-center mt-1">{(node.content as any).caption}</div>}
            </div>
          : <div className="text-xs text-[#b8b4ae] py-4 text-center cursor-pointer" onClick={(e) => { e.stopPropagation(); onPickImage(node.id); }}>双击或点击上传图片</div>
      ) : node.type === 'gallery' ? (
        <GalleryPreview node={node} onPickGallery={onPickGallery} />
      ) : node.type === 'divider' ? (
        <hr style={{ border: 'none', borderTop: `${p.lineWidth ?? 1}px solid ${p.lineColor || '#e8e6e0'}` }} />
      ) : node.type === 'spacer' ? (
        <div style={{ height: p.height || '24px' }} />
      ) : null}

      {/* Mini toolbar */}
      {(editing && isEditable) || (selected && showToolbar && (isEditable || isImage)) ? renderToolbar() : null}

      {/* Selection menu */}
      {selected && <SelectMenu />}

      {/* Resize handles */}
      {selected && !isEditable && node.type !== 'spacer' && node.type !== 'divider' && (
        <>
          <div onPointerDown={startResize('se')} title="缩放"
            className="absolute -bottom-1.5 -right-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white cursor-nwse-resize" style={{ touchAction: 'none' }} />
          <div onPointerDown={startResize('s')} title="调整高度"
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-full bg-blue-500 border border-white cursor-ns-resize" style={{ touchAction: 'none' }} />
        </>
      )}

      {/* Size tooltip */}
      {resizeTip && (
        <div className="absolute -bottom-7 right-0 z-30 bg-black/80 text-white text-[10px] rounded px-1.5 py-0.5 pointer-events-none">
          {resizeTip.w} × {resizeTip.h} px
        </div>
      )}
    </div>
  );
}

/** Gallery preview component */
function GalleryPreview({ node, onPickGallery }: { node: CanvasNode; onPickGallery: (id: string) => void }) {
  const c = node.content as any;
  const imgs = c?.images || [];
  const cols = c?.columns || 3;
  if (imgs.length === 0) {
    return <div className="text-xs text-[#b8b4ae] py-4 text-center cursor-pointer" onClick={(e) => { e.stopPropagation(); onPickGallery(node.id); }}>双击或点击管理图片组</div>;
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: c?.gap ?? 8 }}>
      {imgs.map((img: any, i: number) => (
        <div key={i} className="bg-[#f5f5f0] rounded overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.src || img} className="w-full object-cover" style={{ aspectRatio: '1/1' }} />
        </div>
      ))}
    </div>
  );
}

/** Preview mode: render content as visitors see it (no editing UI) */
function PreviewNode({ node, depth }: { node: CanvasNode; depth: number }) {
  const p = node.props || {};
  const style: React.CSSProperties = {
    width: p.width || '100%',
    height: p.height === 'auto' ? undefined : p.height,
    marginTop: p.marginTop ?? 0, marginRight: p.marginRight ?? 0, marginBottom: p.marginBottom ?? 12, marginLeft: p.marginLeft ?? 0,
    padding: p.paddingTop != null ? `${p.paddingTop}px ${p.paddingRight ?? 0}px ${p.paddingBottom ?? 0}px ${p.paddingLeft ?? 0}px` : undefined,
    background: p.bgColor || (node.type === 'section' ? '#faf9f6' : node.type === 'card' ? '#ffffff' : 'transparent'),
    borderRadius: p.borderRadius ?? 0,
    boxSizing: 'border-box',
    textAlign: 'left',
  };

  if (node.type === 'row') {
    const stack = p.responsiveStack !== false;
    return (
      <div style={{ ...style, display: 'flex', flexWrap: stack ? 'wrap' : 'nowrap', gap: p.gap ?? 16, alignItems: p.alignItems || 'stretch' }}>
        {node.children.map(c => {
          const cb = c.props?.flexBasis || '1';
          const cf = cb === 'auto' ? '0 0 auto' : `${cb} 1 200px`;
          return (
            <div key={c.id} style={{ flex: cf, minWidth: stack ? 200 : 0, maxWidth: '100%' }}>
              <PreviewNode node={c} depth={depth + 1} />
            </div>
          );
        })}
      </div>
    );
  }
  if (node.type === 'column') {
    return (
      <div style={{ ...style, display: 'flex', flexDirection: 'column', justifyContent: p.valign || 'top' }}>
        {node.children.map(c => <PreviewNode key={c.id} node={c} depth={depth + 1} />)}
      </div>
    );
  }
  if (node.type === 'section') {
    return (
      <div style={style}>
        {node.content?.showTitle !== false && node.content?.title && (
          <h3 className="text-lg font-semibold text-[#2d2a24] mb-3">{node.content.title}</h3>
        )}
        {node.children.map(c => <PreviewNode key={c.id} node={c} depth={depth + 1} />)}
      </div>
    );
  }
  if (node.type === 'card') {
    const shadow = { none: 'none', sm: '0 1px 2px rgba(0,0,0,.05)', md: '0 2px 8px rgba(0,0,0,.08)', lg: '0 4px 16px rgba(0,0,0,.1)' }[p.shadow || 'sm'];
    return (
      <div style={{ ...style, boxShadow: shadow, border: p.borderColor ? `1px solid ${p.borderColor}` : '1px solid #e8e6e0' }}>
        {node.children.map(c => <PreviewNode key={c.id} node={c} depth={depth + 1} />)}
      </div>
    );
  }

  // Leaf nodes in preview
  switch (node.type) {
    case 'text':
    case 'quote': {
      const isQuote = node.type === 'quote';
      return (
        <div
          style={{ ...style, borderLeft: isQuote ? '4px solid #d4a574' : undefined, background: isQuote ? '#f8f5f0' : undefined, lineHeight: 1.7 }}
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
              borderRadius: p.borderRadius ?? 0,
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
        <div style={{ ...style, display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: c?.gap ?? 8 }}>
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
      return <hr style={{ ...style, border: 'none', borderTop: `${p.lineWidth ?? 1}px solid ${p.lineColor || '#e8e6e0'}` }} />;
    case 'spacer':
      return <div style={{ ...style, height: p.height || '24px' }} />;
    default:
      return <div style={style} />;
  }
}
