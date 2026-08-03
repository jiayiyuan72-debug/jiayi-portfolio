'use client';

import { CanvasType, CANVAS_TYPE_LABELS } from '@/types/canvas';

interface Props {
  onDragStart: (type: CanvasType) => (e: React.DragEvent) => void;
}

const LAYOUT: CanvasType[] = ['section', 'row', 'column', 'card'];
const CONTENT: CanvasType[] = ['text', 'image', 'quote', 'divider', 'spacer', 'gallery'];

/** 左侧组件库：布局容器 + 内容容器，支持拖出 */
export default function ComponentPalette({ onDragStart }: Props) {
  return (
    <div className="w-44 bg-white border-r border-[#e8e4de] p-3 overflow-y-auto flex-shrink-0">
      <p className="text-xs text-[#8b8b8b] mb-2">组件库（拖入画板）</p>
      <p className="text-[10px] text-[#b8b4ae] mb-1">布局容器</p>
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        {LAYOUT.map(t => (
          <button key={t} draggable onDragStart={onDragStart(t)}
            className="flex flex-col items-center gap-1 px-1 py-2 rounded-lg border border-[#e8e4de] bg-[#f8f5f0] hover:border-[#d4a574] hover:bg-white transition-colors cursor-grab">
            <span className="text-base">{CANVAS_TYPE_LABELS[t].icon}</span>
            <span className="text-[10px] text-[#2d2a24]">{CANVAS_TYPE_LABELS[t].label}</span>
          </button>
        ))}
      </div>
      <p className="text-[10px] text-[#b8b4ae] mb-1">内容容器</p>
      <div className="grid grid-cols-2 gap-1.5">
        {CONTENT.map(t => (
          <button key={t} draggable onDragStart={onDragStart(t)}
            className="flex flex-col items-center gap-1 px-1 py-2 rounded-lg border border-[#e8e4de] bg-[#f8f5f0] hover:border-[#d4a574] hover:bg-white transition-colors cursor-grab">
            <span className="text-base">{CANVAS_TYPE_LABELS[t].icon}</span>
            <span className="text-[10px] text-[#2d2a24]">{CANVAS_TYPE_LABELS[t].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
