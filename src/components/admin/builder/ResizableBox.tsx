'use client';

import { useRef } from 'react';

// 容器最小尺寸（PRD：80×32 后不再缩小）
const MIN_W = 80;
const MIN_H = 32;

interface Props {
  x: number;
  y: number;
  w: number;
  h: number;
  selected: boolean;
  editing?: boolean;
  bounds: { w: number; h: number };
  onDrag: (x: number, y: number) => void;
  onResize: (w: number, h: number, x: number, y: number) => void;
  onDragEnd: () => void;
  onResizeEnd: () => void;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  children: React.ReactNode;
}

/** 自研可拖拽/缩放容器：原生 Pointer Events，兼容 React 19（react-rnd 依赖 findDOMNode 已移除导致不兼容） */
export default function ResizableBox({ x, y, w, h, selected, editing, bounds, onDrag, onResize, onDragEnd, onResizeEnd, onSelect, onDoubleClick, children }: Props) {
  const rectRef = useRef({ x, y, w, h });
  const startRef = useRef<{ px: number; py: number; x: number; y: number; w: number; h: number; dir?: string; moved: boolean } | null>(null);

  rectRef.current = { x, y, w, h };

  const begin = (e: React.PointerEvent, dir?: string) => {
    if (editing && !dir) return; // 编辑态下的点击不触发拖拽
    e.stopPropagation();
    e.preventDefault();
    const node = e.currentTarget as HTMLElement;
    node.setPointerCapture(e.pointerId);
    startRef.current = { px: e.clientX, py: e.clientY, x, y, w, h, dir, moved: false };
    onSelect(e);
  };

  const move = (e: React.PointerEvent) => {
    const s = startRef.current;
    if (!s) return;
    const dx = e.clientX - s.px;
    const dy = e.clientY - s.py;
    if (!s.dir) {
      // 拖拽移动
      s.moved = true;
      const nx = Math.max(0, Math.min(bounds.w - s.w, s.x + dx));
      const ny = Math.max(0, Math.min(bounds.h - s.h, s.y + dy));
      onDrag(nx, ny);
    } else {
      // 缩放（最小 80×32）
      s.moved = true;
      let nw = s.w, nh = s.h, nx = s.x, ny = s.y;
      if (s.dir.includes('e')) { nw = Math.max(MIN_W, s.w + dx); }
      if (s.dir.includes('s')) { nh = Math.max(MIN_H, s.h + dy); }
      if (s.dir.includes('w')) { nw = Math.max(MIN_W, s.w - dx); nx = s.x + s.w - nw; }
      if (s.dir.includes('n')) { nh = Math.max(MIN_H, s.h - dy); ny = s.y + s.h - nh; }
      onResize(nw, nh, nx, ny);
    }
  };

  const end = (e: React.PointerEvent) => {
    const s = startRef.current;
    const moved = !!s?.moved;
    const wasResize = !!s?.dir;
    startRef.current = null;
    if (moved) { if (wasResize) onResizeEnd(); else onDragEnd(); }
  };

  const handles = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'] as const;
  const cursor: Record<string, string> = {
    n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
    ne: 'nesw-resize', sw: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize',
  };
  const handlePos: Record<string, React.CSSProperties> = {
    n: { top: -3, left: '50%', transform: 'translateX(-50%)', width: 16, height: 6 },
    s: { bottom: -3, left: '50%', transform: 'translateX(-50%)', width: 16, height: 6 },
    e: { right: -3, top: '50%', transform: 'translateY(-50%)', width: 6, height: 16 },
    w: { left: -3, top: '50%', transform: 'translateY(-50%)', width: 6, height: 16 },
    ne: { top: -4, right: -4, width: 10, height: 10 },
    nw: { top: -4, left: -4, width: 10, height: 10 },
    se: { bottom: -4, right: -4, width: 10, height: 10 },
    sw: { bottom: -4, left: -4, width: 10, height: 10 },
  };

  return (
    <div
      onPointerDown={begin}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
      onDoubleClick={onDoubleClick ? (e) => { e.stopPropagation(); onDoubleClick(); } : undefined}
      onClick={(e) => { e.stopPropagation(); if (!editing) onSelect(e); }}
      className={`absolute ${selected ? 'select-none' : ''}`}
      style={{ left: x, top: y, width: w, height: h, zIndex: 1, touchAction: 'none' }}
    >
      {/* 内容 */}
      <div className={`w-full h-full ${selected ? '' : 'pointer-events-none'}`}>
        {children}
      </div>

      {/* 缩放手柄 */}
      {selected && handles.map(h => (
        <div
          key={h}
          onPointerDown={(e) => begin(e, h)}
          className="absolute bg-white border border-[#d4a574] rounded-sm"
          style={{ ...handlePos[h], cursor: cursor[h], zIndex: 5, touchAction: 'none' }}
        />
      ))}
    </div>
  );
}
