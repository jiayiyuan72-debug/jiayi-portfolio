'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Rnd } from 'react-rnd';
import { PageContainer } from '@/types/page-layout';
import ContainerContentView from '@/components/visitor/PageLayoutContainer/ContainerContentView';
import { useBuilderStore, buildTree } from './store';
import ContainerToolbox from './ContainerToolbox';
import PropertyPanel from './PropertyPanel';

interface Props {
  /** 挂载时把布局载入 store */
  layout: PageContainer[];
  onSave: (containers: PageContainer[]) => void;
  onExit: () => void;
}

const PAGE_W = 800; // 画布可视宽度（编辑器内）

/** react-rnd 画布：拖动/缩放 + 对齐吸附 + 多选 + 嵌套 */
export default function PageBuilder({ layout, onSave, onExit }: Props) {
  const { present, selectedIds, select, updateContainer, setContainers, snapEnabled, gridSize, guides, setGuides, undo, redo, commit } = useBuilderStore();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);

  // 首次载入布局
  useEffect(() => {
    setContainers(layout, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  const childrenOf = useCallback((parentId: string | null) => buildTree(present, parentId), [present]);

  // ---- 对齐计算：返回吸附后的 newX/newY 和目标对齐线 ----
  const snapWithGuides = (
    id: string, x: number, y: number, w: number, h: number
  ): { x: number; y: number; guides: { x?: number; y?: number }[] } => {
    const c = present.find(cc => cc.id === id);
    const siblings = present.filter(cc => cc.id !== id && cc.parentId === (c?.parentId ?? null));
    const guides: { x?: number; y?: number }[] = [];
    let nx = x, ny = y;

    // 页面(父容器)边缘：0 和 PAGE_W
    const rightOnPage = x + w;
    const centerOnPage = x + w / 2;
    const targetsX = [
      { pos: 0, label: 'page-left' },
      { pos: PAGE_W - w, label: 'page-right' },
      { pos: PAGE_W / 2 - w / 2, label: 'page-hcenter' },
    ];
    const targetsY = [
      { pos: 0, label: 'page-top' },
      { pos: 400 - h, label: 'page-bottom' },
    ];

    // 与兄弟对齐
    for (const sib of siblings) {
      targetsX.push({ pos: sib.x, label: 'left' });
      targetsX.push({ pos: sib.x + sib.w - w, label: 'right' });
      targetsX.push({ pos: sib.x + sib.w / 2 - w / 2, label: 'hcenter' });
      targetsY.push({ pos: sib.y, label: 'top' });
      targetsY.push({ pos: sib.y + sib.h - h, label: 'bottom' });
    }

    // 找最近的吸附目标（阈值 6px）
    const THRESH = 6;
    let bestX = x, bestY = y;
    let bestGx: number | undefined, bestGy: number | undefined;
    for (const t of targetsX) {
      if (Math.abs(x - t.pos) < THRESH) { bestX = t.pos; bestGx = t.pos; }
      if (Math.abs(rightOnPage - t.pos) < THRESH) { bestX = t.pos - w; bestGx = t.pos; }
      if (Math.abs(centerOnPage - t.pos - w / 2) < THRESH) { bestX = t.pos; bestGx = t.pos + w / 2; }
    }
    for (const t of targetsY) {
      if (Math.abs(y - t.pos) < THRESH) { bestY = t.pos; bestGy = t.pos; }
    }

    nx = bestX; ny = bestY;
    if (bestGx !== undefined) guides.push({ x: bestGx });
    if (bestGy !== undefined) guides.push({ y: bestGy });

    // 网格吸附（若未命中对齐线，且网格启用）
    if (snapEnabled && bestGx === undefined) nx = Math.round(nx / gridSize) * gridSize;
    if (snapEnabled && bestGy === undefined) ny = Math.round(ny / gridSize) * gridSize;

    return { x: nx, y: ny, guides };
  };

  const handleDrag = (id: string, d: { x: number; y: number }) => {
    const c = present.find(cc => cc.id === id);
    if (!c) return;
    const { x, y, guides } = snapWithGuides(id, c.x + d.x, c.y + d.y, c.w, c.h);
    updateContainer(id, { x, y });
    setGuides(guides);
    setDragging(id);
  };

  const handleDragStop = () => {
    setDragging(null);
    setGuides([]);
    commit();
  };

  const handleResize = (id: string, _style: { width: number; height: number }, delta: { width: number; height: number }) => {
    const c = present.find(cc => cc.id === id);
    if (!c) return;
    let w = Math.max(20, c.w + delta.width);
    let h = Math.max(20, c.h + delta.height);
    // 网格吸附宽高
    if (snapEnabled) { w = Math.round(w / gridSize) * gridSize; h = Math.round(h / gridSize) * gridSize; }
    updateContainer(id, { w, h });
    setResizing(id);
  };

  const handleResizeStop = () => { setResizing(null); commit(); };

  // ---- 拖框多选 ----
  const onCanvasMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    const move = (ev: MouseEvent) => {
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      setDragBox({ x: Math.min(startX, cx), y: Math.min(startY, cy), w: Math.abs(cx - startX), h: Math.abs(cy - startY) });
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      if (dragBox && dragBox.w > 4 && dragBox.h > 4) {
        const box = dragBox;
        const hits = present.filter(cc => cc.parentId === null &&
          cc.x < box.x + box.w && cc.x + cc.w > box.x && cc.y < box.y + box.h && cc.y + cc.h > box.y);
        if (hits.length) useBuilderStore.setState({ selectedIds: hits.map(h => h.id) });
      }
      setDragBox(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  const rootContainers = childrenOf(null);

  return (
    <div className="flex flex-col h-full">
      {/* 工具条 */}
      <div className="flex items-center gap-2 bg-white border border-[#e8e4de] rounded-xl px-3 py-2 mb-2">
        <button onClick={undo} disabled={!useBuilderStore.getState().past.length}
          className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de] disabled:opacity-40">撤销</button>
        <button onClick={redo} disabled={!useBuilderStore.getState().future.length}
          className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de] disabled:opacity-40">重做</button>
        <div className="flex-1" />
        <button onClick={() => { undo(); }} className="px-2.5 py-1 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de]">删除选中 (Del)</button>
        <button onClick={() => { commit(); onSave(present); }}
          className="px-3 py-1 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">保存布局</button>
        <button onClick={() => { commit(); onSave(present); onExit(); }}
          className="px-3 py-1 text-sm bg-[#d4a574] text-white rounded-lg hover:bg-[#c8976a]">保存并退出</button>
      </div>

      {/* 三栏：容器库 | 画布 | 属性面板 */}
      <div className="flex flex-1 overflow-hidden">
        <ContainerToolbox />

        <div
          ref={canvasRef}
          onMouseDown={onCanvasMouseDown}
          className="relative flex-1 bg-[#f5f5f0] border border-[#e8e4de] rounded-xl overflow-hidden mx-2"
          style={{ width: '100%', minHeight: 400 }}
        >
        {rootContainers.map(container => (
          <BuilderNode key={container.id} container={container}
            selected={isSelected(container.id)}
            dragging={dragging === container.id}
            resizing={resizing === container.id}
            onSelect={(e, additive) => { e.stopPropagation(); select(container.id, additive); }}
            onDrag={(d) => handleDrag(container.id, d)}
            onDragStop={handleDragStop}
            onResize={(s, d) => handleResize(container.id, s, d)}
            onResizeStop={handleResizeStop}
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

        {/* 多选框 */}
        {dragBox && (
          <div className="absolute z-40 border border-[#d4a574] bg-[#d4a574]/20 pointer-events-none"
            style={{ left: dragBox.x, top: dragBox.y, width: dragBox.w, height: dragBox.h }} />
        )}

        {rootContainers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[#b8b4ae] text-sm">
            从左侧添加容器开始搭建
          </div>
        )}

        {/* 键盘删除 */}
        <KeyDeleteHandler ids={selectedIds} />
        </div>

        <PropertyPanel />
      </div>
    </div>
  );
}

/** 单个可拖拽/缩放容器节点（含嵌套渲染） */
function BuilderNode({
  container, selected, dragging, resizing, onSelect, onDrag, onDragStop, onResize, onResizeStop,
}: {
  container: PageContainer;
  selected: boolean;
  dragging: boolean;
  resizing: boolean;
  onSelect: (e: React.MouseEvent, additive: boolean) => void;
  onDrag: (d: { x: number; y: number }) => void;
  onDragStop: () => void;
  onResize: (style: { width: number; height: number }, delta: { width: number; height: number }) => void;
  onResizeStop: () => void;
}) {
  const children = useBuilderStore(s => buildTree(s.present, container.id));

  return (
    <div onClick={(e) => onSelect(e, false)} style={{ zIndex: container.z }} className="absolute">
      <Rnd
        size={{ width: container.w, height: container.h }}
        position={{ x: container.x, y: container.y }}
        bounds="parent"
        onDrag={(e, d) => onDrag({ x: d.x, y: d.y })}
        onDragStop={onDragStop}
        onResize={(e, dir, ref, delta, pos) => onResize({ width: ref.offsetWidth, height: ref.offsetHeight }, delta)}
        onResizeStop={onResizeStop}
        style={{ opacity: dragging || resizing ? 0.6 : 1 }}
        className={selected ? 'ring-2 ring-[#d4a574] rounded' : 'rounded'}
      >
        <div
          className={`w-full h-full ${
            selected ? 'border-2 border-[#d4a574]' : 'border border-transparent hover:border-[#d4a574]/50'
          } rounded overflow-hidden relative bg-white`}
          style={{ backgroundColor: container.style.bg !== undefined ? container.style.bg : '#ffffff' }}
        >
          <ContainerContentView container={container} />
          {/* 嵌套子容器 */}
          {children.length > 0 && (
            <div className="absolute inset-0 pointer-events-none">
              {children.map(child => (
                <div key={child.id} className="pointer-events-auto absolute"
                  style={{ left: child.x, top: child.y, width: child.w, height: child.h, zIndex: child.z }}>
                  <BuilderNode container={child} selected={selected}
                    dragging={dragging} resizing={resizing} onSelect={onSelect} onDrag={onDrag} onDragStop={onDragStop} onResize={onResize} onResizeStop={onResizeStop} />
                </div>
              ))}
            </div>
          )}
        </div>
      </Rnd>
    </div>
  );
}

/** 键盘删除选中项 */
function KeyDeleteHandler({ ids }: { ids: string[] }) {
  const remove = useBuilderStore(s => s.removeContainers);
  const clear = useBuilderStore(s => s.clearSelection);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && ids.length && !(e.target as HTMLElement)?.closest('input,textarea')) {
        remove(ids); clear();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ids, remove, clear]);
  return null;
}
