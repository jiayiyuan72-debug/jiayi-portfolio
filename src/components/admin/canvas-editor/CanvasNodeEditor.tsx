'use client';

import { useRef, useState, useEffect } from 'react';
import { CanvasNode, CanvasType, CANVAS_TYPE_LABELS, LAYOUT_TYPES, canNest, CAN_NEST_IN, TemplateId } from '@/types/canvas';

/** 5-way drop position: before / after / inside / left / right */
type DropPosition = 'before' | 'after' | 'inside' | 'left' | 'right';

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
  onPickPhotoWall: (id: string) => void;
  onEditMemoryCard: (id: string) => void;
  onResize: (id: string, patch: { width?: string; height?: string; flexBasis?: string }) => void;
  onAddChild: (parentId: string, type: CanvasType) => void;
  onQuickAddImage: (parentId: string) => void;
  onDropOnNode: (nodeId: string, position: DropPosition, type: CanvasType | TemplateId, isTemplate?: boolean) => void;
  onMoveNode: (sourceId: string, targetId: string, position: DropPosition) => void;
  onInsertBefore: (id: string) => void;
}

interface Props extends NodeCallbacks {
  node: CanvasNode;
  selectedId: string | null;
  editingId: string | null;
  depth: number;
  preview: boolean;
  flexParentId?: string;
  flexParentBasis?: string;
}

const EDITABLE_TYPES = ['text', 'quote'];

/** Single canvas node: recursive render with proper child selection */
export default function CanvasNodeEditor(props: Props) {
  const { node, selectedId, editingId, depth, preview, onSelectId, onEditId, onStopEdit, onUpdateContent, onDuplicate, onDelete, onMoveOrder, onPickImage, onPickGallery, onPickPhotoWall, onEditMemoryCard, onResize, onAddChild, onQuickAddImage, onDropOnNode, onMoveNode, onInsertBefore, flexParentId, flexParentBasis } = props;

  const p = node.props || {};
  const isEditable = EDITABLE_TYPES.includes(node.type);
  const isImage = node.type === 'image' || node.type === 'gallery';
  const selected = !preview && node.id === selectedId;
  const editing = !preview && node.id === editingId;
  const [showToolbar, setShowToolbar] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [resizeTip, setResizeTip] = useState<{ w: number; h: number } | null>(null);
  const [dropZone, setDropZone] = useState<DropPosition | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Build typography style from props (only includes set values so defaults are preserved)
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

  const boxStyle: React.CSSProperties = {
    width: p.width || '100%',
    height: p.height === 'auto' ? undefined : p.height,
    marginTop: p.marginTop ?? 0, marginRight: p.marginRight ?? 0, marginBottom: p.marginBottom ?? 12, marginLeft: p.marginLeft ?? 0,
    padding: p.paddingTop != null ? `${p.paddingTop}px ${p.paddingRight ?? 0}px ${p.paddingBottom ?? 0}px ${p.paddingLeft ?? 0}px` : undefined,
    background: p.bgColor || (node.type === 'section' ? '#faf9f6' : node.type === 'card' ? '#ffffff' : 'transparent'),
    borderRadius: p.borderRadius ?? 0,
    boxSizing: 'border-box',
    textAlign: 'left',
    ...typoStyle,
  };

  const handleDoubleClick = () => {
    if (preview) return;
    if (isEditable) onEditId(node.id);
    else if (node.type === 'image') onPickImage(node.id);
    else if (node.type === 'gallery') onPickGallery(node.id);
  };

  // ---- 5-way drop zone handlers ----
  const handleDragOver = (e: React.DragEvent) => {
    if (preview) return;

    // Only proceed if this is a recognized drag type
    const types = e.dataTransfer.types;
    const isNodeDrag = types.includes('application/x-canvas-node-id');
    const isLibraryDrag = types.includes('application/x-canvas-type') || types.includes('application/x-canvas-template');
    if (!isNodeDrag && !isLibraryDrag) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = isNodeDrag ? 'move' : 'copy';

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    let pos: DropPosition;
    if (LAYOUT_TYPES.includes(node.type)) {
      // For layout containers: 5-way detection
      const xRatio = x / w;
      const yRatio = y / h;
      if (xRatio < 0.15) pos = 'left';
      else if (xRatio > 0.85) pos = 'right';
      else if (yRatio < 0.2) pos = 'before';
      else if (yRatio > 0.8) pos = 'after';
      else pos = 'inside';
    } else {
      // For leaf nodes: left/right + before/after
      const xRatio = x / w;
      if (xRatio < 0.3) pos = 'left';
      else if (xRatio > 0.7) pos = 'right';
      else pos = y < h * 0.5 ? 'before' : 'after';
    }
    setDropZone(pos);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    // Only clear dropZone when truly leaving this element
    const related = e.relatedTarget as Node | null;
    if (related && e.currentTarget.contains(related)) return;
    setDropZone(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (preview) return;
    e.preventDefault();
    e.stopPropagation();

    const pos = dropZone || 'after';

    // Check for existing node drag (move)
    const nodeId = e.dataTransfer.getData('application/x-canvas-node-id');
    if (nodeId) {
      if (nodeId !== node.id) {
        onMoveNode(nodeId, node.id, pos);
      }
      setDropZone(null);
      return;
    }

    // Otherwise, component library drag (add new)
    const type = e.dataTransfer.getData('application/x-canvas-type') as CanvasType;
    const templateId = e.dataTransfer.getData('application/x-canvas-template') as TemplateId;
    if (!type && !templateId) { setDropZone(null); return; }

    if (templateId) {
      onDropOnNode(node.id, pos, templateId, true);
    } else {
      onDropOnNode(node.id, pos, type, false);
    }
    setDropZone(null);
  };

  // ---- Smart resize: flexBasis for nodes inside a row's column ----
  const startResize = (dir: 'se' | 's') => (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX, startY = e.clientY;

    // If this node is inside a flex column, adjust the column's flexBasis proportionally
    if (flexParentId) {
      const currentBasis = parseFloat(flexParentBasis || '1') || 1;
      const containerEl = boxRef.current?.closest('.flex-row-container') as HTMLElement | null;
      const containerW = containerEl?.offsetWidth || 800;
      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const deltaRatio = dx / containerW;
        const newBasis = Math.max(0.1, currentBasis + deltaRatio * 2);
        const newBasisStr = newBasis.toFixed(2);
        onResize(flexParentId, { flexBasis: newBasisStr });
        setResizeTip({ w: Math.round(newBasis * 100), h: 0 });
        void dir;
      };
      const up = () => {
        setResizeTip(null);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      return;
    }

    // Normal resize (absolute pixels)
    const startW = parseFloat((p.width || '').replace('px', '')) || 300;
    const startH = parseFloat((p.height || '').replace('px', '')) || 120;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      const newW = Math.max(60, startW + dx);
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
    <div className="absolute -top-9 left-0 z-20 flex items-center gap-0.5 bg-black/80 text-white text-xs rounded-lg px-1.5 py-0.5 shadow flex-wrap max-w-[420px]" onMouseDown={(e) => e.preventDefault()} onMouseUp={(e) => e.stopPropagation()}>
      {!editing && <span className="text-[9px] text-amber-300 px-1 select-none">双击编辑</span>}
      {editing && <span className="text-[9px] text-green-300 px-1 select-none">编辑中</span>}
      <button onClick={() => document.execCommand('bold')} className="px-1 font-bold hover:opacity-70" title="粗体">B</button>
      <button onClick={() => document.execCommand('italic')} className="px-1 italic hover:opacity-70" title="斜体">I</button>
      <button onClick={() => document.execCommand('underline')} className="px-1 underline hover:opacity-70" title="下划线">U</button>
      <button onClick={() => document.execCommand('strikeThrough')} className="px-1 line-through hover:opacity-70" title="删除线">S</button>
      <span className="opacity-30">|</span>
      {['h1','h2','h3'].map(l => (
        <button key={l} onClick={() => document.execCommand('formatBlock', false, l)} className="px-1 uppercase hover:opacity-70" title={`标题 ${l}`}>{l}</button>
      ))}
      <button onClick={() => document.execCommand('formatBlock', false, 'p')} className="px-1 hover:opacity-70" title="正文段落">¶</button>
      <button onClick={() => document.execCommand('formatBlock', false, 'blockquote')} className="px-1 hover:opacity-70" title="引用块">❝</button>
      <span className="opacity-30">|</span>
      <select
        onChange={(e) => { document.execCommand('styleWithCSS', false, 'true'); document.execCommand('fontSize', false, e.target.value); e.target.selectedIndex = 0; }}
        className="bg-black/60 text-white text-[10px] outline-none cursor-pointer rounded px-0.5"
        defaultValue=""
        title="字号"
      >
        <option value="" disabled>字号</option>
        <option value="1">8px</option>
        <option value="2">10px</option>
        <option value="3">12px</option>
        <option value="4">14px</option>
        <option value="5">18px</option>
        <option value="6">24px</option>
        <option value="7">36px</option>
      </select>
      <label className="cursor-pointer relative" title="文字颜色">
        <span className="text-[10px]">🎨</span>
        <input
          type="color"
          onChange={(e) => document.execCommand('foreColor', false, e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ width: '100%', height: '100%' }}
        />
      </label>
      <label className="cursor-pointer relative" title="背景色">
        <span className="text-[10px]">🏷</span>
        <input
          type="color"
          onChange={(e) => document.execCommand('hiliteColor', false, e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
          style={{ width: '100%', height: '100%' }}
        />
      </label>
      <span className="opacity-30">|</span>
      <button onClick={() => document.execCommand('justifyLeft')} className="px-1 hover:opacity-70" title="左对齐">⬅</button>
      <button onClick={() => document.execCommand('justifyCenter')} className="px-1 hover:opacity-70" title="居中">⬌</button>
      <button onClick={() => document.execCommand('justifyRight')} className="px-1 hover:opacity-70" title="右对齐">➡</button>
      <span className="opacity-30">|</span>
      <button onClick={() => document.execCommand('insertUnorderedList')} className="px-1 hover:opacity-70" title="无序列表">•≡</button>
      <button onClick={() => document.execCommand('insertOrderedList')} className="px-1 hover:opacity-70" title="有序列表">1≡</button>
      <button onClick={() => { const href = prompt('链接地址','https://'); if (href) document.execCommand('createLink', false, href); }} className="px-1 hover:opacity-70" title="链接">🔗</button>
      <button onClick={() => document.execCommand('removeFormat')} className="px-1 hover:opacity-70" title="清除格式">✕</button>
    </div>
  );

  const SelectMenu = () => (
    <div className="absolute -top-8 right-0 z-30 flex items-center gap-0.5 bg-[#2d2a24] text-white text-[10px] rounded-lg px-1 py-0.5 shadow">
      <button onClick={(e) => { e.stopPropagation(); onInsertBefore(node.id); }} className="px-1 hover:opacity-70 text-blue-300" title="在上方插入区块">↑+</button>
      <button onClick={(e) => { e.stopPropagation(); onDuplicate(node.id); }} className="px-1 hover:opacity-70" title="复制">⧉</button>
      <button onClick={(e) => { e.stopPropagation(); onMoveOrder(node.id, -1); }} className="px-1 hover:opacity-70" title="上移">↑</button>
      <button onClick={(e) => { e.stopPropagation(); onMoveOrder(node.id, 1); }} className="px-1 hover:opacity-70" title="下移">↓</button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className="px-1 hover:opacity-70 text-red-300" title="删除">🗑</button>
    </div>
  );

  // Drag handle: always visible (not in preview/editing mode)
  const showHandle = !preview && !editing;
  const DragHandle = showHandle ? (
    <div
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/x-canvas-node-id', node.id);
        e.dataTransfer.effectAllowed = 'move';
      }}
      onClick={(e) => e.stopPropagation()}
      className="absolute -top-2.5 left-0 z-40 w-6 h-6 rounded bg-[#4a90e2] text-white flex items-center justify-center cursor-grab hover:scale-110 text-xs select-none shadow opacity-50 hover:opacity-100 transition-opacity"
      title="拖动移动此元素"
    >
      ⠿
    </div>
  ) : null;

  // Drop zone visual indicators (5-way) with text labels
  const DropZoneIndicators = () => (
    <>
      {dropZone === 'before' && (
        <div className="absolute -top-3 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="h-0.5 w-full bg-blue-500 rounded-full absolute top-1.5" />
          <span className="bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap relative">↑ 放在上方</span>
        </div>
      )}
      {dropZone === 'after' && (
        <div className="absolute -bottom-3 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <div className="h-0.5 w-full bg-blue-500 rounded-full absolute top-1.5" />
          <span className="bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap relative">↓ 放在下方</span>
        </div>
      )}
      {dropZone === 'inside' && (
        <>
          <div className="absolute inset-0 border-2 border-blue-500 rounded z-40 pointer-events-none bg-blue-50/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 pointer-events-none">
            <span className="bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap">放入内部</span>
          </div>
        </>
      )}
      {dropZone === 'left' && (
        <div className="absolute top-0 bottom-0 -left-1 w-1.5 bg-blue-500 rounded-full z-40 pointer-events-none flex items-center justify-center">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap">← 左侧并排</span>
        </div>
      )}
      {dropZone === 'right' && (
        <div className="absolute top-0 bottom-0 -right-1 w-1.5 bg-blue-500 rounded-full z-40 pointer-events-none flex items-center justify-center">
          <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-blue-500 text-white text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap">右侧并排 →</span>
        </div>
      )}
    </>
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

  // Shared child props - pass all callbacks down so children can be selected/dropped on
  // Also propagate flexParentId to children of containers inside flex columns
  const childProps = (c: CanvasNode, extra?: Record<string, any>) => ({
    key: c.id,
    node: c,
    selectedId,
    editingId,
    depth: depth + 1,
    preview,
    // Propagate flex info to children (so nodes inside cards inside columns also get smart resize)
    ...(flexParentId ? { flexParentId, flexParentBasis } : {}),
    ...extra,
    onSelectId,
    onEditId,
    onStopEdit,
    onUpdateContent,
    onDuplicate,
    onDelete,
    onMoveOrder,
    onPickImage,
    onPickGallery,
    onPickPhotoWall,
    onEditMemoryCard,
    onResize,
    onAddChild,
    onQuickAddImage,
    onDropOnNode,
    onMoveNode,
    onInsertBefore,
  });

  // ---- PREVIEW MODE: render real content without editing UI ----
  if (preview) {
    return <PreviewNode node={node} depth={depth} />;
  }

  // ---- Layout containers ----
  if (node.type === 'row') {
    return (
      <div ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }} onDoubleClick={handleDoubleClick}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'hover:ring-1 hover:ring-[#4a90e2]/40'} rounded bg-white/50 flex-row-container`}
        style={{ ...boxStyle, display: 'flex', flexWrap: 'nowrap', gap: p.gap ?? 16, alignItems: p.alignItems || 'stretch', marginBottom: p.marginBottom ?? 12 }}>
        {DragHandle}
        {selected && <SelectMenu />}
        <DropZoneIndicators />
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-2 py-4 flex-1">选中后从下方添加「列」</div>}
        {node.children.map((c, i) => {
          const basis = c.props?.flexBasis || '1';
          const flexVal = basis === 'auto' ? '0 0 auto' : `${basis} 1 0`;
          return (
            <div key={c.id} style={{ flex: flexVal, minWidth: 0 }} className="relative">
              <CanvasNodeEditor {...childProps(c, { flexParentId: c.id, flexParentBasis: basis })} />
              {/* Column resize bar - between this column and the next */}
              {i < node.children.length - 1 && !preview && (
                <div
                  onPointerDown={(e) => {
                    e.preventDefault(); e.stopPropagation();
                    const startX = e.clientX;
                    const currentBasis = parseFloat(basis) || 1;
                    const containerW = boxRef.current?.offsetWidth || 800;
                    const move = (ev: PointerEvent) => {
                      const dx = ev.clientX - startX;
                      const deltaRatio = dx / containerW;
                      const newBasis = Math.max(0.1, Math.min(10, currentBasis + deltaRatio * 3));
                      onResize(c.id, { flexBasis: newBasis.toFixed(2) });
                    };
                    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                    window.addEventListener('pointermove', move);
                    window.addEventListener('pointerup', up);
                  }}
                  className="absolute top-0 -right-4 bottom-0 w-4 cursor-col-resize z-30 group/col-resize"
                  title="拖动调整列宽"
                  style={{ touchAction: 'none' }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 w-1 h-16 rounded-full bg-[#d8d4cc] group-hover/col-resize:bg-[#4a90e2] transition-colors" />
                </div>
              )}
            </div>
          );
        })}
        {/* Quick add image column */}
        {!preview && (selected || hovered) && (
          <button
            onClick={(e) => { e.stopPropagation(); onQuickAddImage(node.id); }}
            className="flex-shrink-0 w-10 min-h-[60px] flex flex-col items-center justify-center text-[#b8b4ae] hover:text-[#4a90e2] hover:bg-[#f0f7ff] rounded border-2 border-dashed border-[#d8d4cc] hover:border-[#4a90e2] transition-all"
            title="添加图片列"
          >
            <span className="text-lg leading-none">+</span>
            <span className="text-[8px] mt-0.5">图片</span>
          </button>
        )}
        <AddContentBar />
      </div>
    );
  }

  if (node.type === 'column') {
    const colWidth = p.width === '100%' ? 'auto' : (p.width || 'auto');
    return (
      <div ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'hover:ring-1 hover:ring-[#4a90e2]/40'} border border-dashed border-[#d8d4cc] rounded`}
        style={{ ...boxStyle, width: colWidth, minHeight: 40, display: 'flex', flexDirection: 'column', justifyContent: p.valign || 'top', gap: 4 }}>
        {DragHandle}
        {selected && <SelectMenu />}
        <DropZoneIndicators />
        {node.children.map(c => <CanvasNodeEditor {...childProps(c)} />)}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-2 py-3">选中后添加内容</div>}
        <AddContentBar />
      </div>
    );
  }

  if (node.type === 'card') {
    return (
      <div ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'hover:ring-1 hover:ring-[#4a90e2]/40'} border border-[#e8e6e0] rounded bg-white`}
        style={{ ...boxStyle, boxShadow: { none: 'none', sm: '0 1px 2px rgba(0,0,0,.05)', md: '0 2px 8px rgba(0,0,0,.08)', lg: '0 4px 16px rgba(0,0,0,.1)' }[p.shadow || 'sm'] }}>
        {DragHandle}
        {selected && <SelectMenu />}
        <DropZoneIndicators />
        {node.children.map(c => <CanvasNodeEditor {...childProps(c)} />)}
        {node.children.length === 0 && <div className="text-xs text-[#b8b4ae] px-3 py-4">卡片内容（选中后添加）</div>}
        <AddContentBar />
      </div>
    );
  }

  if (node.type === 'section') {
    return (
      <section ref={boxRef} onClick={(e) => { e.stopPropagation(); onSelectId(node.id); }}
        onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'hover:ring-1 hover:ring-[#4a90e2]/40'} border border-[#e8e4de] rounded`}
        style={boxStyle}>
        {DragHandle}
        {selected && <SelectMenu />}
        <DropZoneIndicators />
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
    overflow: 'visible',
    isolation: editing ? 'isolate' : undefined,
  };

  return (
    <div ref={boxRef} onClick={(e) => { e.stopPropagation(); if (!editing && selected && isEditable) { onEditId(node.id); } else if (!editing) { onSelectId(node.id); } }} onDoubleClick={handleDoubleClick}
      onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
      className={`relative ${selected ? 'ring-2 ring-[#4a90e2]' : 'border border-transparent hover:border-[#4a90e2]/40 hover:ring-1 hover:ring-[#4a90e2]/30'} rounded`}
      style={leafStyle}
      onMouseEnter={() => { setShowToolbar(true); setHovered(true); }} onMouseLeave={() => { setShowToolbar(false); setHovered(false); }}
    >
      {DragHandle}
      <DropZoneIndicators />

      {/* Content rendering */}
      {node.type === 'text' ? (
        <EditableText
          html={contentHtml}
          editing={editing}
          className={`text-sm ${editing ? 'outline-none ring-2 ring-green-400 bg-white relative z-10' : ''} cursor-text`}
          style={{ lineHeight: 1.7, ...typoStyle }}
          onSave={(html) => { onUpdateContent(node.id, { html }); onStopEdit(); }}
        />
      ) : node.type === 'quote' ? (
        <EditableText
          html={contentHtml}
          editing={editing}
          className={`border-l-4 border-[#d4a574] bg-[#f8f5f0] px-3 py-2 text-sm ${editing ? 'outline-none ring-2 ring-green-400 bg-white relative z-10' : ''} cursor-text`}
          style={{ lineHeight: 1.7, ...typoStyle }}
          onSave={(html) => { onUpdateContent(node.id, { html }); onStopEdit(); }}
        />
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
      ) : node.type === 'timeline' ? (
        <TimelinePreview node={node} />
      ) : node.type === 'skill-bar' ? (
        <SkillBarPreview node={node} />
      ) : node.type === 'stats' ? (
        <StatsPreview node={node} />
      ) : node.type === 'tags' ? (
        <TagsPreview node={node} />
      ) : node.type === 'video' ? (
        <VideoPreview node={node} />
      ) : node.type === 'accordion' ? (
        <AccordionPreview node={node} />
      ) : node.type === 'photo-wall' ? (
        <PhotoWallPreview node={node} onPickPhotoWall={onPickPhotoWall} />
      ) : node.type === 'memory-card' ? (
        <MemoryCardPreview node={node} onEditMemoryCard={onEditMemoryCard} />
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
          {flexParentId ? `flex: ${resizeTip.w}%` : `${resizeTip.w} × ${resizeTip.h} px`}
        </div>
      )}
    </div>
  );
}

/** Editable text component: separates editing mode (ref-based) from display mode (dangerouslySetInnerHTML) */
function EditableText({ html, editing, className, style, onSave }: {
  html: string;
  editing: boolean;
  className?: string;
  style?: React.CSSProperties;
  onSave: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editing && ref.current) {
      // Set content via ref to avoid React re-rendering the contentEditable
      ref.current.innerHTML = html;
      // Focus and move cursor to end
      ref.current.focus();
      const range = document.createRange();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  if (editing) {
    return (
      <div
        ref={ref}
        className={className}
        style={style}
        contentEditable
        suppressContentEditableWarning
        onBlur={(e) => onSave(e.currentTarget.innerHTML)}
        onMouseDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <div
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
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

/** Timeline editor preview */
function TimelinePreview({ node }: { node: CanvasNode }) {
  const items = (node.content as any)?.items || [];
  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: '#d4a574' }} />
      {items.map((item: any, i: number) => (
        <div key={i} style={{ position: 'relative', marginBottom: 12 }}>
          <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: '#d4a574', border: '2px solid #fff', boxShadow: '0 0 0 2px #d4a574' }} />
          <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #f0ede5' }}>
            <div style={{ fontSize: 11, color: '#d4a574', fontWeight: 600, marginBottom: 2 }}>{item.icon} {item.date}</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2a24', marginBottom: 2 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#5a5349' }}>{item.description}</div>
              </div>
              {item.image && (
                <img src={item.image} alt="" style={{ width: 60, height: 60, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              )}
            </div>
          </div>
        </div>
      ))}
      {items.length === 0 && <div className="text-xs text-[#b8b4ae] py-4 text-center">在属性面板中添加时间轴项</div>}
    </div>
  );
}

/** Skill bar editor preview */
function SkillBarPreview({ node }: { node: CanvasNode }) {
  const skills = (node.content as any)?.skills || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {skills.map((s: any, i: number) => (
        <div key={i}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#2d2a24' }}>{s.name}</span>
            <span style={{ fontSize: 11, color: '#8b8b8b' }}>{s.level}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: '#f0ede5', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${s.level}%`, borderRadius: 4, background: s.color || '#4a90e2' }} />
          </div>
        </div>
      ))}
      {skills.length === 0 && <div className="text-xs text-[#b8b4ae] py-4 text-center">在属性面板中添加技能项</div>}
    </div>
  );
}

/** Stats editor preview */
function StatsPreview({ node }: { node: CanvasNode }) {
  const stats = (node.content as any)?.stats || [];
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-around' }}>
      {stats.map((s: any, i: number) => (
        <div key={i} style={{ textAlign: 'center', flex: '1 1 100px', minWidth: 100 }}>
          <div style={{ fontSize: 24, marginBottom: 2 }}>{s.icon}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2d2a24' }}>{s.value}{s.suffix}</div>
          <div style={{ fontSize: 11, color: '#8b8b8b' }}>{s.label}</div>
        </div>
      ))}
      {stats.length === 0 && <div className="text-xs text-[#b8b4ae] py-4 text-center">在属性面板中添加统计项</div>}
    </div>
  );
}

/** Tags editor preview */
function TagsPreview({ node }: { node: CanvasNode }) {
  const tags = (node.content as any)?.tags || [];
  const color = (node.content as any)?.color || '#4a90e2';
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {tags.map((tag: string, i: number) => (
        <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: `${color}15`, color, border: `1px solid ${color}30` }}>{tag}</span>
      ))}
      {tags.length === 0 && <div className="text-xs text-[#b8b4ae] py-4 text-center">在属性面板中添加标签</div>}
    </div>
  );
}

/** Video editor preview */
function VideoPreview({ node }: { node: CanvasNode }) {
  const c = node.content as any;
  const url = c?.url || '';
  const p = node.props || {};
  if (!url) return <div className="text-xs text-[#b8b4ae] py-8 text-center" style={{ borderRadius: p.borderRadius || 12, background: '#f5f5f0' }}>🎬 在属性面板中设置视频链接</div>;
  let embedUrl = url;
  if (c.platform === 'youtube') { const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/); if (m) embedUrl = `https://www.youtube.com/embed/${m[1]}`; }
  else if (c.platform === 'bilibili') { const m = url.match(/bilibili\.com\/video\/(BV[\w]+)/); if (m) embedUrl = `https://player.bilibili.com/player.html?bvid=${m[1]}`; }
  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: p.borderRadius || 12, overflow: 'hidden' }}>
      <iframe src={embedUrl} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }} allowFullScreen />
    </div>
  );
}

/** Accordion editor preview */
function AccordionPreview({ node }: { node: CanvasNode }) {
  const panels = (node.content as any)?.panels || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {panels.map((panel: any, i: number) => (
        <details key={i} style={{ borderRadius: 8, border: '1px solid #e8e6e0', overflow: 'hidden' }} open={i === 0}>
          <summary style={{ padding: '10px 14px', cursor: 'pointer', fontWeight: 500, fontSize: 13, color: '#2d2a24', background: '#faf9f6', listStyle: 'none' }}>
            {panel.title}
          </summary>
          <div style={{ padding: '10px 14px', fontSize: 12, color: '#5a5349', background: '#fff' }}>
            {panel.content}
          </div>
        </details>
      ))}
      {panels.length === 0 && <div className="text-xs text-[#b8b4ae] py-4 text-center">在属性面板中添加面板项</div>}
    </div>
  );
}

/** Photo wall editor preview */
function PhotoWallPreview({ node, onPickPhotoWall }: { node: CanvasNode; onPickPhotoWall: (id: string) => void }) {
  const c = node.content as any;
  const imgs = c?.images || [];
  const cols = c?.columns || 3;
  const gap = c?.gap ?? 8;
  if (imgs.length === 0) {
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onPickPhotoWall(node.id); }}
        style={{
          border: '2px dashed #d4a574',
          borderRadius: 12,
          padding: '32px 16px',
          textAlign: 'center',
          cursor: 'pointer',
          background: '#faf9f6',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f0e8'; e.currentTarget.style.borderColor = '#4a90e2'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#faf9f6'; e.currentTarget.style.borderColor = '#d4a574'; }}
      >
        <div style={{ fontSize: 32, marginBottom: 8 }}>{'📷'}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#2d2a24', marginBottom: 4 }}>点击上传照片</div>
        <div style={{ fontSize: 12, color: '#8b8b8b' }}>支持多选，瀑布流自动排版</div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ columnCount: cols, columnGap: gap + 'px' }}>
        {imgs.map((img: any, i: number) => (
          <div key={i} style={{ breakInside: 'avoid', marginBottom: gap + 'px', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
            <img src={img.src || img} alt="" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        ))}
      </div>
      <div className="text-[10px] text-[#b8b4ae] text-center mt-2">{imgs.length} 张照片 | 点击属性面板上传更多</div>
    </div>
  );
}

/** Memory card preview - cover image + title, click to open editor */
function MemoryCardPreview({ node, onEditMemoryCard }: { node: CanvasNode; onEditMemoryCard: (id: string) => void }) {
  const c = node.content as any;
  const p = node.props || {};
  const coverImage = c?.coverImage || '';

  return (
    <div
      style={{
        background: p.bgColor || '#f8f5f0',
        borderRadius: p.borderRadius || 12,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        minHeight: 60,
      }}
      onClick={(e) => { e.stopPropagation(); onEditMemoryCard(node.id); }}
    >
      {/* Cover image */}
      {coverImage ? (
        <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{ width: '100%', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0ede5' }}>
          <span style={{ fontSize: 32, opacity: 0.4 }}>{c?.icon || '\u{1F3B4}'}</span>
        </div>
      )}
      {/* Title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px' }}>
        <span style={{ fontSize: 14 }}>{c?.icon || '\u{1F3B4}'}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#2d2a24', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c?.title || '记忆卡片'}</span>
        <span style={{ fontSize: 10, color: '#d4a574', fontWeight: 500, flexShrink: 0 }}>{'\u270F'} 编辑</span>
      </div>
    </div>
  );
}

/** Preview mode: render content as visitors see it (no editing UI) */
function PreviewNode({ node, depth }: { node: CanvasNode; depth: number }) {
  const p = node.props || {};
  // Build typography style for preview mode too
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
    width: p.width || '100%',
    height: p.height === 'auto' ? undefined : p.height,
    marginTop: p.marginTop ?? 0, marginRight: p.marginRight ?? 0, marginBottom: p.marginBottom ?? 12, marginLeft: p.marginLeft ?? 0,
    padding: p.paddingTop != null ? `${p.paddingTop}px ${p.paddingRight ?? 0}px ${p.paddingBottom ?? 0}px ${p.paddingLeft ?? 0}px` : undefined,
    background: p.bgColor || (node.type === 'section' ? '#faf9f6' : node.type === 'card' ? '#ffffff' : 'transparent'),
    borderRadius: p.borderRadius ?? 0,
    boxSizing: 'border-box',
    textAlign: 'left',
    ...typoStyle,
  };

  if (node.type === 'row') {
    return (
      <div style={{ ...style, display: 'flex', flexWrap: 'nowrap', gap: p.gap ?? 16, alignItems: p.alignItems || 'stretch' }}>
        {node.children.map(c => {
          const cb = c.props?.flexBasis || '1';
          const cf = cb === 'auto' ? '0 0 auto' : `${cb} 1 0`;
          return (
            <div key={c.id} style={{ flex: cf, minWidth: 0, maxWidth: '100%' }}>
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
          style={{ ...style, borderLeft: isQuote ? '4px solid #d4a574' : undefined, background: isQuote ? '#f8f5f0' : undefined, lineHeight: 1.7, color: p.color || (isQuote ? undefined : '#5a5349') }}
          className="text-sm"
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
      if (!url) return <div style={{ ...style, minHeight: 200, background: '#f5f5f0', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b8b4ae', fontSize: 14 }}>🎬 在属性面板中设置视频链接</div>;
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
    case 'divider':
      return <hr style={{ ...style, border: 'none', borderTop: `${p.lineWidth ?? 1}px solid ${p.lineColor || '#e8e6e0'}` }} />;
    case 'spacer':
      return <div style={{ ...style, height: p.height || '24px' }} />;
    default:
      return <div style={style} />;
  }
}
