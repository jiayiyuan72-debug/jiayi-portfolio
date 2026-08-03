'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { PageContainer, PageContainerType, defaultContainer, CONTAINER_TYPE_LABELS } from '@/types/page-layout';
import ContainerContentView from '@/components/visitor/PageLayoutContainer/ContainerContentView';
import { useBuilderStore, buildTree, getContainerDepth } from './store';
import ContainerToolbox from './ContainerToolbox';
import PropertyPanel from './PropertyPanel';
import ResizableBox from './ResizableBox';

interface Props {
  layout: PageContainer[];
  onSave: (containers: PageContainer[]) => void;
  onExit: () => void;
}

const PAGE_W = 800;
const PAGE_H = 400;
const MOBILE_W = 375;
const SNAP_THRESHOLD = 6;

/** 容器化自由画布：自研拖拽/缩放（兼容 React19）+ 对齐吸附 + 容器内直接编辑 + 预览/移动视口 */
export default function PageBuilder({ layout, onSave, onExit }: Props) {
  const { present, selectedIds, select, clearSelection, updateContainer, setContainers, snapEnabled, gridSize, guides, setGuides, undo, redo, commit, addContainer, duplicate } = useBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [preview, setPreview] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  // 仅在布局内容真正变化时载入 store（避免 layout 数组引用每渲染都变 → set 反复 → 无限循环）
  const layoutKey = JSON.stringify(layout || []);
  useEffect(() => {
    try { setContainers(JSON.parse(layoutKey), false); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  const childrenOf = useCallback((parentId: string | null) => buildTree(present, parentId), [present]);

  // ---- 对齐计算 ----
  const snap = (id: string, x: number, y: number, w: number, h: number) => {
    const c = present.find(cc => cc.id === id);
    const siblings = present.filter(cc => cc.id !== id && cc.parentId === (c?.parentId ?? null));
    const gx: number[] = [0, PAGE_W, PAGE_W / 2]; // page-left, page-right-center, page-center
    const gy: number[] = [0, PAGE_H, PAGE_H / 2];
    siblings.forEach(s => {
      gx.push(s.x, s.x + s.w - w, s.x + s.w / 2 - w / 2);
      gy.push(s.y, s.y + s.h - h, s.y + s.h / 2 - h / 2);
    });

    let nx = x, ny = y, agx: number | null = null, agy: number | null = null;
    for (const t of gx) {
      if (Math.abs(x - t) < SNAP_THRESHOLD) { nx = t; agx = t; }
      if (Math.abs(x + w - t) < SNAP_THRESHOLD) { nx = t - w; agx = t; }
      if (Math.abs(x + w / 2 - t) < SNAP_THRESHOLD) { nx = t - w / 2; agx = t; }
    }
    for (const t of gy) {
      if (Math.abs(y - t) < SNAP_THRESHOLD) { ny = t; agy = t; }
      if (Math.abs(y + h - t) < SNAP_THRESHOLD) { ny = t - h; agy = t; }
    }

    // 网格吸附（未命中对齐线时）
    if (snapEnabled && agx === null) nx = Math.round(nx / gridSize) * gridSize;
    if (snapEnabled && agy === null) ny = Math.round(ny / gridSize) * gridSize;

    setGuides([...(agx !== null ? [{ x: agx }] : []), ...(agy !== null ? [{ y: agy }] : [])]);
    return { x: nx, y: ny };
  };

  const handleMove = (id: string, x: number, y: number) => {
    updateContainer(id, { x, y });
  };
  const handleMoveEnd = (id: string, x: number, y: number) => {
    const res = snap(id, x, y, present.find(c => c.id === id)?.w || 0, present.find(c => c.id === id)?.h || 0);
    updateContainer(id, { x: res.x, y: res.y });
    setGuides([]);
    commit();
  };
  const handleResize = (id: string, w: number, h: number, x: number, y: number) => {
    let nw = w, nh = h, nx = x, ny = y;
    if (snapEnabled) { nw = Math.round(nw / gridSize) * gridSize; nh = Math.round(nh / gridSize) * gridSize; }
    updateContainer(id, { w: nw, h: nh, x: nx, y: ny });
  };
  const handleResizeEnd = () => { setGuides([]); commit(); };

  // ---- 框选多选 ----
  const onCanvasPointerDown = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) { clearSelection(); return; }
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const move = (ev: MouseEvent) => setDragBox({ x: Math.min(sx, ev.clientX - rect.left), y: Math.min(sy, ev.clientY - rect.top), w: Math.abs(ev.clientX - rect.left - sx), h: Math.abs(ev.clientY - rect.top - sy) });
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      const box = dragBox;
      setDragBox(null);
      if (box && box.w > 4 && box.h > 4) {
        const hits = present.filter(cc => cc.parentId === null &&
          cc.x < box.x + box.w && cc.x + cc.w > box.x && cc.y < box.y + box.h && cc.y + cc.h > box.y);
        if (hits.length) useBuilderStore.setState({ selectedIds: hits.map(h => h.id) });
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  // ---- 从左侧工具箱拖入画布 ----
  const onCanvasDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-container-type')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  };
  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/x-container-type') as PageContainerType;
    if (!type || !CONTAINER_TYPE_LABELS[type]) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const c = defaultContainer(type);
    c.x = Math.max(0, e.clientX - rect.left - c.w / 2);
    c.y = Math.max(0, e.clientY - rect.top - c.h / 2);
    // 若落在某个布局容器内，则作为其子容器嵌套（深度≤3）
    const dropX = c.x + c.w / 2, dropY = c.y + c.h / 2;
    const target = [...present].filter(cc => cc.type === 'section' || cc.type === 'row' || cc.type === 'column' || cc.type === 'card' || cc.type === 'group')
      .filter(cc => cc.x <= dropX && dropX <= cc.x + cc.w && cc.y <= dropY && dropY <= cc.y + cc.h)
      .sort((a, b) => b.z - a.z)[0];
    if (target) {
      const depth = getContainerDepth(present, target.id);
      if (depth >= 3) { toast.error('嵌套深度已达上限（3层）'); return; }
      c.parentId = target.id;
      c.x = c.x - target.x;
      c.y = c.y - target.y;
    }
    addContainer(c);
  };

  // ---- 图片上传（双击图片容器）----
  const pickImage = (containerId: string) => {
    setUploadTarget(containerId);
    fileRef.current?.click();
  };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTarget) return;
    try {
      // 简单压缩（复用轻量 canvas）
      let blob: Blob = file;
      if (file.type.startsWith('image/') && file.size > 1.5 * 1024 * 1024) {
        const b = await compressFile(file);
        if (b && b.size > 0 && b.size < file.size) blob = b;
      }
      const fd = new FormData();
      fd.append('file', blob, blob === file ? file.name : 'image.jpg');
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上传失败');
      const c = present.find(cc => cc.id === uploadTarget);
      if (c) updateContainer(c.id, { content: { ...c.content, url: data.url } });
      toast.success('图片已更新');
    } catch (err: any) {
      toast.error(err.message || '上传失败');
    } finally {
      setUploadTarget(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  // ---- 编辑态 ----
  const startEdit = (id: string) => setEditingId(id);
  const stopEdit = () => setEditingId(null);

  const handleContainerContent = (id: string, patch: Record<string, any>) => {
    const c = present.find(cc => cc.id === id);
    if (c) updateContainer(id, { content: { ...c.content, ...patch } });
  };

  // ---- 选中工具条操作 ----
  const moveOrder = (id: string, dir: -1 | 1) => {
    const parentId = present.find(cc => cc.id === id)?.parentId ?? null;
    const sibs = childrenOf(parentId).map(s => s.id);
    const idx = sibs.indexOf(id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= sibs.length) return;
    const a = present.find(cc => cc.id === sibs[idx])!;
    const b = present.find(cc => cc.id === sibs[to])!;
    const za = a.z, zb = b.z;
    updateContainer(a.id, { z: zb });
    updateContainer(b.id, { z: za });
  };

  const rootNodes = childrenOf(null);

  return (
    <div className="flex flex-col h-full">
      {/* 工具条 */}
      <div className="flex items-center gap-2 bg-white border border-[#e8e4de] rounded-xl px-3 py-2 mb-2">
        <button onClick={undo} disabled={!useBuilderStore.getState().past.length} className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de] disabled:opacity-40">撤销</button>
        <button onClick={redo} disabled={!useBuilderStore.getState().future.length} className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de] disabled:opacity-40">重做</button>
        <span className="mx-1 w-px h-5 bg-[#e8e4de]" />
        <button onClick={() => { if (preview) setMobile(false); setPreview(!preview); }}
          className={`px-2.5 py-1 text-sm rounded-lg border transition-colors ${preview ? 'bg-[#2d2a24] text-white border-[#2d2a24]' : 'bg-[#f8f5f0] border-[#e8e4de] hover:bg-[#e8e4de]'}`}>预览</button>
        <button onClick={() => { setMobile(!mobile); }}
          className={`px-2.5 py-1 text-sm rounded-lg border transition-colors ${mobile ? 'bg-[#2d2a24] text-white border-[#2d2a24]' : 'bg-[#f8f5f0] border-[#e8e4de] hover:bg-[#e8e4de]'}`}>移动端 375px</button>
        <div className="flex-1" />
        <span className="text-xs text-[#b8b4ae]">双击容器内文字/图片直接编辑</span>
        <button onClick={() => { if (selectedIds.length) { useBuilderStore.getState().removeContainers(selectedIds); useBuilderStore.setState({ selectedIds: [] }); } }}
          className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de]">删除选中 (Del)</button>
        <button onClick={() => { commit(); onSave(present); }} className="px-3 py-1 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">保存布局</button>
        <button onClick={() => { commit(); onSave(present); onExit(); }} className="px-3 py-1 text-sm bg-[#d4a574] text-white rounded-lg hover:bg-[#c8976a]">保存并退出</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ContainerToolbox />

        {/* 画布 */}
        <div className="relative flex-1 mx-2 overflow-auto bg-[#f0eee9] border border-[#e8e4de] rounded-xl">
          <div
            ref={canvasRef}
            onMouseDown={preview ? undefined : onCanvasPointerDown}
            onDragOver={onCanvasDragOver}
            onDrop={onCanvasDrop}
            className="relative bg-white border border-[#e8e4de] rounded-xl overflow-hidden"
            style={{ width: mobile ? MOBILE_W : '100%', minHeight: mobile ? (PAGE_H * MOBILE_W / PAGE_W) : PAGE_H, aspectRatio: preview ? undefined : `${(mobile ? MOBILE_W : PAGE_W)}/${PAGE_H}`, maxWidth: mobile ? MOBILE_W : undefined, margin: mobile ? '0 auto' : 'auto' }}
          >
            {preview ? (
              // 预览模式：无编辑 UI，直接渲染前台效果
              rootNodes.map(c => <PreviewNode key={c.id} container={c} present={present} />)
            ) : (
              rootNodes.map(c => (
                <BuilderNode
                  key={c.id}
                  container={c}
                  present={present}
                  selected={isSelected(c.id)}
                  editing={editingId === c.id}
                  onSelect={(e) => { e.stopPropagation(); select(c.id); }}
                  onMove={(x, y) => handleMove(c.id, x, y)}
                  onMoveEnd={(x, y) => handleMoveEnd(c.id, x, y)}
                  onResize={(w, h, x, y) => handleResize(c.id, w, h, x, y)}
                  onResizeEnd={handleResizeEnd}
                  onDuplicate={() => duplicate(c.id)}
                  onDelete={() => { useBuilderStore.getState().removeContainers([c.id]); useBuilderStore.setState({ selectedIds: [] }); }}
                  onMoveOrder={(dir) => moveOrder(c.id, dir)}
                  onStartEdit={() => startEdit(c.id)}
                  onStopEdit={stopEdit}
                  onPickImage={() => pickImage(c.id)}
                  onContentChange={(patch) => handleContainerContent(c.id, patch)}
                  canvasW={mobile ? MOBILE_W : PAGE_W}
                  canvasH={PAGE_H}
                />
              ))
            )}

          {/* 对齐辅助线 */}
          {guides.map((g, i) => (
            <div key={i} className="absolute bg-[#d4a574] z-50 pointer-events-none"
              style={{
                ...(g.x !== undefined ? { left: g.x, top: 0, bottom: 0, width: 1 } : {}),
                ...(g.y !== undefined ? { top: g.y, left: 0, right: 0, height: 1 } : {}),
              }} />
          ))}

          {dragBox && (
            <div className="absolute z-40 border border-[#d4a574] bg-[#d4a574]/20 pointer-events-none"
              style={{ left: dragBox.x, top: dragBox.y, width: dragBox.w, height: dragBox.h }} />
          )}

          {rootNodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-[#b8b4ae] text-sm">
              {preview ? '空画板' : '从左侧拖入或点击添加容器开始搭建'}
            </div>
          )}
          <KeyDeleteHandler ids={selectedIds} />
          </div>
        </div>

        {/* 图片上传隐藏输入 */}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

        {!preview && <PropertyPanel />}
      </div>
    </div>
  );
}

function BuilderNode({
  container, present, selected, editing, canvasW, canvasH,
  onSelect, onMove, onMoveEnd, onResize, onResizeEnd,
  onDuplicate, onDelete, onMoveOrder, onStartEdit, onStopEdit, onPickImage, onContentChange,
}: {
  container: PageContainer;
  present: PageContainer[];
  selected: boolean;
  editing?: boolean;
  canvasW: number;
  canvasH: number;
  onSelect: (e: React.MouseEvent) => void;
  onMove: (x: number, y: number) => void;
  onMoveEnd: (x: number, y: number) => void;
  onResize: (w: number, h: number, x: number, y: number) => void;
  onResizeEnd: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMoveOrder: (dir: -1 | 1) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onPickImage: () => void;
  onContentChange: (patch: Record<string, any>) => void;
}) {
  const children = present.filter(cc => cc.parentId === container.id);
  const isRoot = !container.parentId;
  const parentW = isRoot ? canvasW : container.w;
  const parentH = isRoot ? canvasH : container.h;
  const display = container.fill || isRoot;
  // contentEditable 容器的编辑态禁用拖拽
  const isTextEdit = editing && container.type === 'text';

  return (
    <ResizableBox
      x={container.x}
      y={container.y}
      w={display ? parentW : container.w}
      h={display ? parentH : container.h}
      selected={selected}
      editing={isTextEdit}
      bounds={{ w: parentW, h: parentH }}
      onSelect={isRoot ? onSelect : () => {}}
      onDrag={(x, y) => onMove(x, y)}
      onResize={onResize}
      onDragEnd={() => onMoveEnd(container.x, container.y)}
      onResizeEnd={onResizeEnd}
      onDoubleClick={() => {
        if (container.type === 'text') onStartEdit();
        else if (container.type === 'image') onPickImage();
      }}
    >
      <div className={`w-full h-full ${selected ? 'ring-2 ring-[#d4a574] border-2 border-[#d4a574]' : 'border border-[#e8e4de] hover:border-[#d4a574]/50'} rounded overflow-hidden bg-white`}
        style={{ backgroundColor: container.style.bg !== undefined ? container.style.bg : '#ffffff' }}
        onMouseDown={(e) => { if (editing) e.stopPropagation(); }}
        onBlur={() => { if (editing) onStopEdit(); }}
      >
        <ContainerContentView
          container={container}
          editing={editing}
          onEditContent={(patch) => onContentChange(patch)}
          onPickImage={onPickImage}
        />
        {/* 选中工具条 */}
        {selected && !editing && (
          <div className="absolute -top-7 left-0 z-20 flex items-center gap-0.5 bg-[#2d2a24] text-white text-[10px] rounded-lg px-1 py-0.5 shadow">
            <button onClick={onDuplicate} className="px-1 hover:opacity-70" title="复制">⧉</button>
            <button onClick={() => onMoveOrder(-1)} className="px-1 hover:opacity-70" title="上移">↑</button>
            <button onClick={() => onMoveOrder(1)} className="px-1 hover:opacity-70" title="下移">↓</button>
            <button onClick={onDelete} className="px-1 hover:opacity-70 text-red-300" title="删除">✕</button>
          </div>
        )}
        {/* 嵌套子容器 */}
        {children.length > 0 && (
          <div className="absolute inset-0">
            {children.map(child => (
              <BuilderNode
                key={child.id}
                container={child}
                present={present}
                selected={selected}
                editing={editing}
                canvasW={container.w}
                canvasH={container.h}
                onSelect={onSelect}
                onMove={onMove}
                onMoveEnd={onMoveEnd}
                onResize={onResize}
                onResizeEnd={onResizeEnd}
                onDuplicate={onDuplicate}
                onDelete={onDelete}
                onMoveOrder={onMoveOrder}
                onStartEdit={onStartEdit}
                onStopEdit={onStopEdit}
                onPickImage={onPickImage}
                onContentChange={onContentChange}
              />
            ))}
          </div>
        )}
      </div>
    </ResizableBox>
  );
}

/** 预览模式：无任何编辑 UI，纯前台渲染 */
function PreviewNode({ container, present }: { container: PageContainer; present: PageContainer[] }) {
  const children = present.filter(cc => cc.parentId === container.id);
  const isRoot = !container.parentId;
  const w = container.fill || isRoot ? '100%' : container.w;
  const h = container.fill || isRoot ? '100%' : container.h;
  return (
    <div className="absolute" style={{ left: container.x, top: container.y, width: w, height: h, zIndex: container.z, overflow: 'hidden' }}>
      <ContainerContentView container={container} />
      {children.length > 0 && (
        <div className="absolute inset-0">
          {children.map(c => <PreviewNode key={c.id} container={c} present={present} />)}
        </div>
      )}
    </div>
  );
}

/** 轻量图片压缩（canvas） */
async function compressFile(file: File): Promise<Blob | null> {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
    const MAX = 1920;
    let { width, height } = img;
    if (width > MAX || height > MAX) { const s = MAX / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s); }
    const cv = document.createElement('canvas'); cv.width = width; cv.height = height;
    const ctx = cv.getContext('2d'); if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>(res => cv.toBlob(res, 'image/jpeg', 0.82));
    URL.revokeObjectURL(url);
    return blob;
  } catch { return null; }
}

/** 键盘删除 */
function KeyDeleteHandler({ ids }: { ids: string[] }) {
  const remove = useBuilderStore(s => s.removeContainers);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length && !(e.target as HTMLElement)?.closest('input,textarea')) {
        remove(ids);
        useBuilderStore.setState({ selectedIds: [] });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ids, remove]);
  return null;
}
