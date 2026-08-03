'use client';

import { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContentItem, GridLayout } from '@/types/content';
import { getCurrentLayout, setLayout, GRID_COLUMNS } from './constants';

interface Props {
  item: ContentItem;
  selected: boolean;
  onSelect: () => void;
  onLayoutChange: (id: string, layout: GridLayout) => void;
  onEdit: () => void;
}

/** 单个内容块：渲染预览 + 选中态；支持拖拽换位（手柄）与右侧宽度缩放 */
export default function CanvasBlock({ item, selected, onSelect, onLayoutChange, onEdit }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const layout = getCurrentLayout(item);
  const resizeRef = useRef<{ startX: number; baseSpan: number } | null>(null);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${layout.col_span}`,
  };

  // 右侧手柄缩放：mousedown 记录起始，mousemove 按列吸附，mouseup 提交
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const canvasEl = document.getElementById('canvas-grid');
    resizeRef.current = { startX: e.clientX, baseSpan: layout.col_span };
    onSelect();

    const onMove = (ev: MouseEvent) => {
      if (!resizeRef.current || !canvasEl) return;
      const dx = ev.clientX - resizeRef.current.startX;
      const delta = Math.round(dx / (canvasEl.clientWidth / GRID_COLUMNS));
      const newSpan = Math.max(1, Math.min(GRID_COLUMNS, resizeRef.current.baseSpan + delta));
      onLayoutChange(item.id, { col_span: newSpan, row_span: layout.row_span });
    };
    const onUp = () => {
      resizeRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      className={`relative bg-white rounded-lg border p-3 min-h-[80px] transition-colors ${
        selected ? 'border-[#d4a574] ring-2 ring-[#d4a574]/30' : 'border-[#e8e4de] hover:border-[#d4a574]/60'
      }`}
    >
      {/* 拖拽手柄（左上角） */}
      <span
        {...attributes}
        {...listeners}
        className="absolute top-1 left-1 cursor-grab active:cursor-grabbing text-[#b8b4ae] hover:text-[#2d2a24] p-0.5"
        title="拖拽换位"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
        </svg>
      </span>

      {/* 选中操作条 */}
      {selected && (
        <div className="absolute -top-3 right-2 z-10 flex items-center gap-1 bg-[#2d2a24] text-white rounded-lg px-2 py-0.5 text-[10px] shadow">
          <button onClick={() => onLayoutChange(item.id, setLayout(item, { col_span: 6, row_span: 1 }).fields.layout)} className="hover:opacity-70">1/2</button>
          <button onClick={() => onLayoutChange(item.id, { col_span: 12, row_span: 1 })} className="hover:opacity-70">整行</button>
          <span className="mx-1 opacity-40">|</span>
          <button onClick={onEdit} className="hover:opacity-70">编辑</button>
        </div>
      )}

      {/* 内容预览 */}
      <CanvasPreview item={item} />

      {/* 宽度徽标 */}
      <span className="absolute bottom-1 right-2 text-[10px] text-[#b8b4ae]">
        {layout.col_span}/{GRID_COLUMNS}
      </span>

      {/* 右侧缩放手柄 */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-[#d4a574]/40"
        title="拖拽调整宽度"
      />
    </div>
  );
}

/** 单块内容预览（按 content_type 简化展示） */
function CanvasPreview({ item }: { item: ContentItem }) {
  const fields = item.fields || {};
  const cover = fields.cover_image || fields.image;
  const body = item.body || '';

  return (
    <div className="pl-5 text-left">
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cover} alt={item.title} className="w-full h-24 object-cover rounded mb-2" />
      ) : null}
      <p className="text-sm font-medium text-[#2d2a24]">{item.title}</p>
      {fields.subtitle && <p className="text-xs text-[#8b8b8b]">{fields.subtitle}</p>}
      {body && <p className="text-xs text-[#5a5349] mt-1 line-clamp-2">{body}</p>}
      {!cover && !body && !fields.subtitle && (
        <p className="text-xs text-[#b8b4ae]">空内容，点击编辑</p>
      )}
    </div>
  );
}
