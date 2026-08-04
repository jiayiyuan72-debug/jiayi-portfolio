'use client';

import { CanvasType, CANVAS_TYPE_LABELS } from '@/types/canvas';

interface Props {
  onAddClick: (type: CanvasType) => void;
}

const LAYOUT: CanvasType[] = ['section', 'row', 'column', 'card'];
const CONTENT: CanvasType[] = ['text', 'image', 'quote', 'divider', 'spacer', 'gallery'];

/** 左侧组件库：点击即添加到画板 */
export default function ComponentPalette({ onAddClick }: Props) {
  const render = (t: CanvasType) => (
    <button
      key={t}
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddClick(t); }}
      className="flex flex-col items-center gap-1 px-1 py-2 rounded-lg border border-[#e8e4de] bg-[#f8f5f0] hover:border-[#d4a574] hover:bg-white transition-colors cursor-pointer select-none active:scale-95"
      title={`点击添加${CANVAS_TYPE_LABELS[t].label}`}
    >
      <span className="text-base pointer-events-none">{CANVAS_TYPE_LABELS[t].icon}</span>
      <span className="text-[10px] text-[#2d2a24] pointer-events-none">{CANVAS_TYPE_LABELS[t].label}</span>
    </button>
  );

  return (
    <div className="w-44 bg-white border-r border-[#e8e4de] p-3 overflow-y-auto flex-shrink-0">
      <p className="text-xs text-[#8b8b8b] mb-2">组件库（点击添加到画板）</p>
      <p className="text-[10px] text-[#b8b4ae] mb-1">布局容器</p>
      <div className="grid grid-cols-2 gap-1.5 mb-3">{LAYOUT.map(render)}</div>
      <p className="text-[10px] text-[#b8b4ae] mb-1">内容容器</p>
      <div className="grid grid-cols-2 gap-1.5">{CONTENT.map(render)}</div>
    </div>
  );
}
