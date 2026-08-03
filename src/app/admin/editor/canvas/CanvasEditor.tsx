'use client';

import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, rectSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { ContentItem, GridLayout } from '@/types/content';
import { CONTENT_TYPE_DEFAULT_SPAN, GRID_COLUMNS, getCurrentLayout, setLayout } from './constants';
import CanvasBlock from './CanvasBlock';
import ComponentPalette from './ComponentPalette';

interface Props {
  section: { id: string; layout_type: string };
  contentItems: ContentItem[];
  /** 拖拽换位后（更新 sort_order） */
  onReorder: (items: ContentItem[]) => void;
  /** 布局（col_span）变化后回调，由父层防抖保存 */
  onLayoutChange: (id: string, layout: GridLayout) => void;
  onEdit: () => void;
}

/** 可视化画布编辑器：12 列网格，块可拖拽换位、缩放宽度、智能排列 */
export default function CanvasEditor({ contentItems, onReorder, onLayoutChange, onEdit }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const sorted = [...contentItems].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const selected = selectedId ? sorted.find(i => i.id === selectedId) : null;
  const selectedSpan = selected ? getCurrentLayout(selected).col_span : null;

  const applyWidth = (span: number) => {
    if (!selectedId) return;
    onLayoutChange(selectedId, { col_span: span, row_span: getCurrentLayout(sorted.find(i => i.id === selectedId)!).row_span });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sorted.findIndex(i => i.id === active.id);
    const newIndex = sorted.findIndex(i => i.id === over.id);
    const reordered = [...sorted];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    // 更新 sort_order 并回传
    const withOrder = reordered.map((it, i) => ({ ...it, sort_order: i }));
    onReorder(withOrder);
    setSelectedId(active.id as string);
  };

  // 智能排列：按 content_type 给默认宽度，逐行尽量凑满 12 列
  const handleSmartArrange = () => {
    const items = [...sorted];
    let cursor = 0;
    const updated = items.map(it => {
      const defaultSpan = CONTENT_TYPE_DEFAULT_SPAN[it.content_type] || 6;
      const avail = GRID_COLUMNS - cursor;
      const span = Math.min(defaultSpan, avail);
      cursor = (cursor + span) % GRID_COLUMNS;
      return setLayout(it, { col_span: span, row_span: 1 });
    });
    updated.forEach(it => onLayoutChange(it.id, getCurrentLayout(it)));
    // 保留 sort_order，仅智能调整宽度
  };

  return (
    <div className="space-y-3">
      <ComponentPalette
        selectedSpan={selectedSpan}
        onApplyWidth={applyWidth}
        onSmartArrange={handleSmartArrange}
      />

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-[#b8b4ae] bg-white rounded-xl border border-dashed border-[#e8e4de]">
          暂无内容，请在「表单模式」添加内容后再用画布排版
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map(i => i.id)} strategy={rectSortingStrategy}>
            <div
              id="canvas-grid"
              className="bg-[#f5f5f0] rounded-xl border border-[#e8e4de] p-3 min-h-[150px]"
              style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`, gap: '12px' }}
              onClick={() => setSelectedId(null)}
            >
              {sorted.map(item => (
                <CanvasBlock
                  key={item.id}
                  item={item}
                  selected={item.id === selectedId}
                  onSelect={() => setSelectedId(item.id)}
                  onLayoutChange={onLayoutChange}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
