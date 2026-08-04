'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContentItem } from '@/types/content';

interface Props {
  item: ContentItem;
  onClick?: () => void;
  children: React.ReactNode;
}

/** 可拖拽排序的内容卡片（供各编辑器复用）：左上角⠿ 手柄拖拽排序，其余区域可点击 */
export default function SortableItem({ item, onClick, children }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  return (
    <div ref={setNodeRef} style={style} onClick={onClick}
      className="bg-white rounded-xl p-4 border border-[#e8e4de] card-hover cursor-pointer relative">
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

/** 纯工具：计算拖拽排序并持久化。返回 reorder 后的数组 + 用于 DndContext 的 sensors/sorted */
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export function useContentSort(
  items: ContentItem[],
  onPersist: (id: string, patch: Partial<ContentItem>) => void
) {
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
    // 直接调用持久化（onPersist 由父级提供）
    const movedId = sorted[from].id;
    const targetId = sorted[to].id;
    // 需要把 movedId 移到 targetId 前后；这里用 sort_order 近似：移动到 target 的位置
    const targetOrder = sorted[to].sort_order ?? to;
    onPersist(movedId, { sort_order: to });
    void targetOrder; void targetId;
  };

  return { sensors, sorted, handleDragEnd, DndContext, SortableContext, closestCenter };
}
