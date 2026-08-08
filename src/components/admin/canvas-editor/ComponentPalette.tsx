'use client';

import { CanvasType, CANVAS_TYPE_LABELS, TemplateId, TEMPLATE_LABELS } from '@/types/canvas';

interface Props {
  onAddClick: (type: CanvasType) => void;
  onAddTemplate?: (templateId: TemplateId) => void;
}

const LAYOUT: CanvasType[] = ['section', 'row', 'column', 'card'];
const CONTENT: CanvasType[] = ['text', 'image', 'quote', 'divider', 'spacer', 'gallery', 'timeline', 'skill-bar', 'stats', 'tags', 'video', 'accordion', 'photo-wall', 'memory-card'];
const TEMPLATES: TemplateId[] = ['image-text', 'text-image', 'two-cards', 'three-cards', 'hero-banner', 'gallery-grid', 'feature-list', 'quote-section'];

/** 左侧组件库：点击或拖拽添加到画板 */
export default function ComponentPalette({ onAddClick, onAddTemplate }: Props) {
  const render = (t: CanvasType) => (
    <button
      key={t}
      type="button"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('application/x-canvas-type', t); e.dataTransfer.effectAllowed = 'copy'; }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddClick(t); }}
      className="flex flex-col items-center gap-1 px-1 py-2 rounded-lg border border-[#e8e4de] bg-[#f8f5f0] hover:border-[#d4a574] hover:bg-white transition-colors cursor-pointer select-none active:scale-95"
      title={`点击或拖拽添加${CANVAS_TYPE_LABELS[t].label}`}
    >
      <span className="text-base pointer-events-none">{CANVAS_TYPE_LABELS[t].icon}</span>
      <span className="text-[10px] text-[#2d2a24] pointer-events-none">{CANVAS_TYPE_LABELS[t].label}</span>
    </button>
  );

  const renderTemplate = (t: TemplateId) => (
    <button
      key={t}
      type="button"
      draggable
      onDragStart={(e) => { e.dataTransfer.setData('application/x-canvas-template', t); e.dataTransfer.effectAllowed = 'copy'; }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddTemplate?.(t); }}
      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg border border-[#e8e4de] bg-[#f8f5f0] hover:border-[#d4a574] hover:bg-white transition-colors cursor-pointer select-none active:scale-95 text-left"
      title={`点击或拖拽添加${TEMPLATE_LABELS[t].label}`}
    >
      <span className="text-base pointer-events-none flex-shrink-0">{TEMPLATE_LABELS[t].icon}</span>
      <div className="flex flex-col pointer-events-none min-w-0">
        <span className="text-[11px] font-medium text-[#2d2a24] leading-tight">{TEMPLATE_LABELS[t].label}</span>
        <span className="text-[9px] text-[#b8b4ae] leading-tight">{TEMPLATE_LABELS[t].desc}</span>
      </div>
    </button>
  );

  return (
    <div className="w-40 bg-white border-r border-[#e8e4de] p-3 overflow-y-auto flex-shrink-0">
      {/* 布局模板 */}
      <p className="text-xs font-medium text-[#2d2a24] mb-2">布局模板</p>
      <p className="text-[10px] text-[#b8b4ae] mb-1.5">拖拽或点击插入</p>
      <div className="flex flex-col gap-1.5 mb-4">
        {TEMPLATES.map(renderTemplate)}
      </div>

      <div className="border-t border-[#e8e4de] pt-3 mb-3" />

      {/* 布局容器 */}
      <p className="text-xs font-medium text-[#2d2a24] mb-1">布局容器</p>
      <div className="grid grid-cols-2 gap-1.5 mb-3">{LAYOUT.map(render)}</div>

      {/* 内容容器 */}
      <p className="text-xs font-medium text-[#2d2a24] mb-1">内容组件</p>
      <div className="grid grid-cols-2 gap-1.5">{CONTENT.map(render)}</div>
    </div>
  );
}
