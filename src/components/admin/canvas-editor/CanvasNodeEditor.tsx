'use client';

import { useRef, useState } from 'react';
import { CanvasNode, CANVAS_TYPE_LABELS } from '@/types/canvas';

interface Props {
  node: CanvasNode;
  selected: boolean;
  editing: boolean;
  depth: number;
  onSelect: () => void;
  onEdit: (id: string) => void;
  onStopEdit: () => void;
  onUpdateContent: (id: string, patch: Record<string, any>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveOrder: (dir: -1 | 1) => void;
  onPickImage: (id: string) => void;
  onPickGallery: (id: string) => void;
}

const EDITABLE_TYPES = ['text', 'quote'];

/** 单个容器节点：递归渲染；单击选中、双击编辑/传图；编辑态 contenteditable + 迷你工具栏 */
export default function CanvasNodeEditor({ node, selected, editing, depth, onSelect, onEdit, onStopEdit, onUpdateContent, onDuplicate, onDelete, onMoveOrder, onPickImage, onPickGallery }: Props) {
  const p = node.props || {};
  const isEditable = EDITABLE_TYPES.includes(node.type);
  const isImage = node.type === 'image' || node.type === 'gallery';
  const [showToolbar, setShowToolbar] = useState(false);

  const boxRef = useRef<HTMLDivElement>(null);

  const boxStyle: React.CSSProperties = {
    width: p.width || '100%',
    height: p.height === 'auto' ? undefined : p.height,
    marginTop: p.marginTop, marginRight: p.marginRight, marginBottom: p.marginBottom, marginLeft: p.marginLeft,
    padding: p.paddingTop != null ? `${p.paddingTop}px ${p.paddingRight ?? 0}px ${p.paddingBottom ?? 0}px ${p.paddingLeft ?? 0}px` : undefined,
    background: p.bgColor || (node.type === 'section' ? '#faf9f6' : node.type === 'card' ? '#ffffff' : 'transparent'),
    borderRadius: p.borderRadius ?? 0,
    boxSizing: 'border-box',
    textAlign: 'left',
  };

  const handleDoubleClick = () => {
    if (isEditable) onEdit(node.id);
    else if (node.type === 'image') onPickImage(node.id);
    else if (node.type === 'gallery') onPickGallery(node.id);
  };

  // 编辑态：contenteditable
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

  const enterEdit = () => { if (isEditable) onEdit(node.id); };
  const hasEdit = isEditable || isImage;

  const SelectMenu = () => (
    <div className="absolute -top-8 right-0 z-30 flex items-center gap-0.5 bg-[#2d2a24] text-white text-[10px] rounded-lg px-1 py-0.5 shadow">
      <button onClick={onDuplicate} className="px-1 hover:opacity-70" title="复制">⧉</button>
      <button onClick={() => onMoveOrder(-1)} className="px-1 hover:opacity-70" title="上移">↑</button>
      <button onClick={() => onMoveOrder(1)} className="px-1 hover:opacity-70" title="下移">↓</button>
      <button onClick={onDelete} className="px-1 hover:opacity-70 text-red-300" title="删除">🗑</button>
    </div>
  );

  // ---- 布局容器：行/列/卡片 ----
  if (node.type === 'row') {
    return (
      <div ref={boxRef} onClick={onSelect} onDoubleClick={handleDoubleClick}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2] border-2 border-[#4a90e2]' : (editing ? 'border-2 border-dashed border-green-500' : 'border border-[#e8e4de]')} rounded bg-white/50`}
        style={{ ...boxStyle, display: 'flex', gap: p.gap ?? 12 }}>
        {selected && <SelectMenu />}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-2 py-4">拖入「列」</div>}
        {node.children.map((c, i) => (
          <div key={c.id} style={{ flex: 1, minWidth: 0 }} className="relative">
            <CanvasNodeEditor
              node={c} selected={false} editing={editing} depth={depth + 1}
              onSelect={onSelect} onEdit={onEdit} onStopEdit={onStopEdit} onUpdateContent={onUpdateContent}
              onDuplicate={onDuplicate} onDelete={onDelete} onMoveOrder={onMoveOrder} onPickImage={onPickImage} onPickGallery={onPickGallery}
            />
          </div>
        ))}
      </div>
    );
  }

  if (node.type === 'column') {
    return (
      <div ref={boxRef} onClick={onSelect}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2] border-2 border-[#4a90e2]' : 'border border-dashed border-[#d8d4cc]'} rounded`}
        style={{ ...boxStyle, minHeight: 40, display: 'flex', flexDirection: 'column', justifyContent: p.valign || 'top', gap: 4 }}>
        {node.children.map(c => (
          <CanvasNodeEditor key={c.id} node={c} selected={false} editing={editing} depth={depth + 1}
            onSelect={onSelect} onEdit={onEdit} onStopEdit={onStopEdit} onUpdateContent={onUpdateContent}
            onDuplicate={onDuplicate} onDelete={onDelete} onMoveOrder={onMoveOrder} onPickImage={onPickImage} onPickGallery={onPickGallery} />
        ))}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-2 py-3">拖入内容</div>}
      </div>
    );
  }

  if (node.type === 'card') {
    return (
      <div ref={boxRef} onClick={onSelect}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2] border-2 border-[#4a90e2]' : 'border border-[#e8e6e0]'} rounded bg-white`}
        style={{ ...boxStyle, boxShadow: { none: 'none', sm: '0 1px 2px rgba(0,0,0,.05)', md: '0 2px 8px rgba(0,0,0,.08)', lg: '0 4px 16px rgba(0,0,0,.1)' }[p.shadow || 'sm'] }}>
        {node.children.map(c => (
          <CanvasNodeEditor key={c.id} node={c} selected={false} editing={editing} depth={depth + 1}
            onSelect={onSelect} onEdit={onEdit} onStopEdit={onStopEdit} onUpdateContent={onUpdateContent}
            onDuplicate={onDuplicate} onDelete={onDelete} onMoveOrder={onMoveOrder} onPickImage={onPickImage} onPickGallery={onPickGallery} />
        ))}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-3 py-4">卡片内容</div>}
      </div>
    );
  }

  // ---- 区块 ----
  if (node.type === 'section') {
    return (
      <section ref={boxRef} onClick={onSelect}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2] border-2 border-[#4a90e2]' : 'border border-[#e8e4de]'} rounded`}
        style={boxStyle}>
        <div className="flex items-center justify-between mb-2">
          {(node.content as any)?.showTitle !== false && (
            <span className="text-sm font-semibold text-[#2d2a24]">{((node.content as any)?.title) || '区块'}</span>
          )}
          <span className="text-[10px] text-[#b8b4ae]">{CANVAS_TYPE_LABELS[node.type].label}</span>
        </div>
        {node.children.map(c => (
          <CanvasNodeEditor key={c.id} node={c} selected={false} editing={editing} depth={depth + 1}
            onSelect={onSelect} onEdit={onEdit} onStopEdit={onStopEdit} onUpdateContent={onUpdateContent}
            onDuplicate={onDuplicate} onDelete={onDelete} onMoveOrder={onMoveOrder} onPickImage={onPickImage} onPickGallery={onPickGallery} />
        ))}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] py-4">拖入内容</div>}
        {selected ? <SelectMenu /> : editing ? renderToolbar() : null}
      </section>
    );
  }

  // ---- 叶子 / 内容容器 ----
  const leafStyle: React.CSSProperties = {
    ...boxStyle,
    position: 'relative',
    minHeight: node.type === 'spacer' ? undefined : 24,
    cursor: isEditable || isImage ? 'text' : 'default',
  };

  return (
    <div ref={boxRef} onClick={onSelect} onDoubleClick={handleDoubleClick}
      className={`relative ${selected && selected ? 'ring-1 ring-[#4a90e2] border border-[#4a90e2]' : 'border border-[#e8e4de] hover:border-[#4a90e2]/50 rounded'} rounded`}
      style={leafStyle}
      onMouseEnter={() => setShowToolbar(true)} onMouseLeave={() => setShowToolbar(false)}
    >
      {/* 内容渲染 + 编辑态 */}
      {node.type === 'text' || node.type === 'quote' ? (
        node.type === 'quote'
          ? <div className={`border-l-4 border-[#d4a574] bg-[#f8f5f0] px-3 py-2 ${editing ? 'outline-none' : ''}`}
              contentEditable={editing || undefined} suppressContentEditableWarning
              onBlur={(e) => { onUpdateContent(node.id, { html: e.currentTarget.innerHTML }); onStopEdit(); }}
              dangerouslySetInnerHTML={{ __html: editing ? '' : contentHtml }} />
          : <div className={`text-sm lead-1.7 ${editing ? 'outline-none' : ''}`} style={{ lineHeight: 1.7 }}
              contentEditable={editing || undefined} suppressContentEditableWarning
              onBlur={(e) => { onUpdateContent(node.id, { html: e.currentTarget.innerHTML }); onStopEdit(); }}
              dangerouslySetInnerHTML={{ __html: editing ? '' : contentHtml }} />
      ) : node.type === 'image' ? (
        (node.content as any)?.src
          ? <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={(node.content as any).src} alt={(node.content as any).alt || ''} className="w-full h-auto rounded" style={{ borderRadius: p.borderRadius ?? 0 }} />
              {(node.content as any).caption && <div className="text-xs text-[#b8b4ae] text-center mt-1">{(node.content as any).caption}</div>}
            </div>
          : <div className="text-xs text-[#b8b4ae] py-4 text-center">双击上传图片</div>
      ) : node.type === 'gallery' ? (
        <div className="text-xs text-[#b8b4ae] py-4 text-center">双击管理图片组</div>
      ) : node.type === 'divider' ? (
        <hr style={{ border: 'none', borderTop: `${p.lineWidth ?? 1}px solid ${p.lineColor || '#e8e6e0'}` }} />
      ) : node.type === 'spacer' ? (
        <div style={{ height: p.height || '24px' }} />
      ) : null}

      {/* 迷你工具栏（text/quote 编辑态 或 hover） */}
      {(editing && isEditable) || (selected && showToolbar && (isEditable || isImage)) ? renderToolbar() : null}

      {/* 选中工具条 */}
      {selected && (
        <div className="absolute -top-8 right-0 z-20 flex items-center gap-0.5 bg-[#2d2a24] text-white text-[10px] rounded-lg px-1 py-0.5 shadow">
          <button onClick={onDuplicate} className="px-1 hover:opacity-70" title="复制 ⏎⏎">⧉</button>
          <button onClick={() => onMoveOrder(-1)} className="px-1 hover:opacity-70" title="上移">↑</button>
          <button onClick={() => onMoveOrder(1)} className="px-1 hover:opacity-70" title="下移">↓</button>
          <button onClick={onDelete} className="px-1 hover:opacity-70 text-red-300" title="删除">🗑</button>
        </div>
      )}
    </div>
  );
}

