'use client';

import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContentItem } from '@/types/content';

/** 可拖拽排序的内容卡片：左上角⠿ 手柄拖拽排序，其余区域可点击 */
export function SortableItem({ item, onClick, children }: { item: ContentItem; onClick?: () => void; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} onClick={onClick}
      className="bg-white rounded-xl p-4 border border-[#e8e4de] card-hover cursor-pointer relative h-full">
      <span {...attributes} {...listeners}
        className="absolute top-2 left-2 cursor-grab active:cursor-grabbing text-[#b8b4ae] hover:text-[#2d2a24] p-0.5 z-10" title="拖拽排序">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
        </svg>
      </span>
      <div className="pl-5">{children}</div>
    </div>
  );
}

/** 通用可排序列表：包裹 DndContext + 排序，供各内容编辑器复用。
 * 用法：<SortableList items={sorted} onPersist={(id,patch)=>...} renderItem={(item)=>JSX} className="grid gap-4"> */
export default function SortableList({ items, onPersist, renderItem, className }: {
  items: ContentItem[];
  onPersist: (id: string, patch: Partial<ContentItem>) => void;
  renderItem: (item: ContentItem) => React.ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const sorted = [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = sorted.map(i => i.id);
    const from = ids.indexOf(active.id as string);
    const to = ids.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    // 计算拖拽后每个涉及项的新 sort_order，并持久化
    const next = [...sorted];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    next.forEach((item, i) => {
      if (item.sort_order !== i) onPersist(item.id, { sort_order: i });
    });
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sorted.map(i => i.id)} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {sorted.map(item => (
            <div key={item.id} className="relative">
              {renderItem(item)}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
