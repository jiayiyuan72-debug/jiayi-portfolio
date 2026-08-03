'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PageContainer } from '@/types/page-layout';
import ContainerContentView from '@/components/visitor/PageLayoutContainer/ContainerContentView';
import { useBuilderStore, buildTree } from './store';
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
const SNAP_THRESHOLD = 6;

/** 容器化自由画布：自研拖拽/缩放（兼容 React19）+ 对齐吸附 + 多选 + 嵌套 */
export default function PageBuilder({ layout, onSave, onExit }: Props) {
  const { present, selectedIds, select, clearSelection, updateContainer, setContainers, snapEnabled, gridSize, guides, setGuides, undo, redo, commit } = useBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

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
  const rootNodes = childrenOf(null);

  return (
    <div className="flex flex-col h-full">
      {/* 工具条 */}
      <div className="flex items-center gap-2 bg-white border border-[#e8e4de] rounded-xl px-3 py-2 mb-2">
        <button onClick={undo} disabled={!useBuilderStore.getState().past.length} className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de] disabled:opacity-40">撤销</button>
        <button onClick={redo} disabled={!useBuilderStore.getState().future.length} className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de] disabled:opacity-40">重做</button>
        <div className="flex-1" />
        <button onClick={() => { if (selectedIds.length) { useBuilderStore.getState().removeContainers(selectedIds); } }}
          className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de]">删除选中 (Del)</button>
        <button onClick={() => { commit(); onSave(present); }} className="px-3 py-1 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">保存布局</button>
        <button onClick={() => { commit(); onSave(present); onExit(); }} className="px-3 py-1 text-sm bg-[#d4a574] text-white rounded-lg hover:bg-[#c8976a]">保存并退出</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ContainerToolbox />

        {/* 画布 */}
        <div
          ref={canvasRef}
          onMouseDown={onCanvasPointerDown}
          className="relative flex-1 bg-[#f5f5f0] border border-[#e8e4de] rounded-xl overflow-hidden mx-2"
          style={{ width: '100%', minHeight: PAGE_H, aspectRatio: `${PAGE_W}/${PAGE_H}` }}
        >
          {rootNodes.map(c => (
            <BuilderNode
              key={c.id}
              container={c}
              present={present}
              selected={isSelected(c.id)}
              onSelect={(e) => { e.stopPropagation(); select(c.id); }}
              onMove={(x, y) => handleMove(c.id, x, y)}
              onMoveEnd={(x, y) => handleMoveEnd(c.id, x, y)}
              onResize={(w, h, x, y) => handleResize(c.id, w, h, x, y)}
              onResizeEnd={handleResizeEnd}
            />
          ))}

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
            <div className="absolute inset-0 flex items-center justify-center text-[#b8b4ae] text-sm">从左侧添加容器开始搭建</div>
          )}
          <KeyDeleteHandler ids={selectedIds} />
        </div>

        <PropertyPanel />
      </div>
    </div>
  );
}

function BuilderNode({
  container, present, selected, onSelect, onMove, onMoveEnd, onResize, onResizeEnd,
}: {
  container: PageContainer;
  present: PageContainer[];
  selected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onMove: (x: number, y: number) => void;
  onMoveEnd: (x: number, y: number) => void;
  onResize: (w: number, h: number, x: number, y: number) => void;
  onResizeEnd: () => void;
}) {
  const children = present.filter(cc => cc.parentId === container.id);
  const isRoot = !container.parentId;
  const parentW = isRoot ? PAGE_W : container.w;
  const parentH = isRoot ? PAGE_H : container.h;
  const display = container.fill || isRoot;

  return (
    <ResizableBox
      x={container.x}
      y={container.y}
      w={display ? parentW : container.w}
      h={display ? parentH : container.h}
      selected={selected}
      bounds={{ w: parentW, h: parentH }}
      onSelect={isRoot ? onSelect : () => {}}
      onDrag={(x, y) => onMove(x, y)}
      onResize={onResize}
      onDragEnd={() => onMoveEnd(container.x, container.y)}
      onResizeEnd={onResizeEnd}
    >
      <div className={`w-full h-full ${selected ? 'ring-2 ring-[#d4a574] border-2 border-[#d4a574]' : 'border border-[#e8e4de] hover:border-[#d4a574]/50'} rounded overflow-hidden bg-white`}
        style={{ backgroundColor: container.style.bg !== undefined ? container.style.bg : '#ffffff' }}>
        <ContainerContentView container={container} />
        {/* 嵌套子容器 */}
        {children.length > 0 && (
          <div className="absolute inset-0">
            {children.map(child => (
              <BuilderNode
                key={child.id}
                container={child}
                present={present}
                selected={selected}
                onSelect={onSelect}
                onMove={onMove}
                onMoveEnd={onMoveEnd}
                onResize={onResize}
                onResizeEnd={onResizeEnd}
              />
            ))}
          </div>
        )}
      </div>
    </ResizableBox>
  );
}

/** 键盘删除 */
function KeyDeleteHandler({ ids }: { ids: string[] }) {
  const remove = useBuilderStore(s => s.removeContainers);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length && !(e.target as HTMLElement)?.closest('input,textarea')) {
        remove(ids);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ids, remove]);
  return null;
}
