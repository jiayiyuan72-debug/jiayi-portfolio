'use client';

import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Section } from '@/types/section';

interface Props {
  sections: Section[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onReorder: (sections: Section[]) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  onToggleVisibility: (id: string) => void;
}

export default function SectionList({ sections, selectedId, onSelect, onReorder, onDelete, onAdd, onToggleVisibility }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    const reordered = [...sections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onReorder(reordered);
  };

  return (
    <div className="w-52 bg-white border-r border-[#e8e4de] flex flex-col overflow-hidden flex-shrink-0">
      <div className="p-4 border-b border-[#e8e4de]">
        <h2 className="text-sm font-bold text-[#2d2a24]">板块列表</h2>
        <p className="text-xs text-[#8b8b8b] mt-0.5">拖拽调整顺序</p>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map(section => (
              <SortableSectionItem
                key={section.id}
                section={section}
                isSelected={section.id === selectedId}
                onSelect={() => onSelect(section.id)}
                onDelete={() => onDelete(section.id)}
                onToggleVisibility={() => onToggleVisibility(section.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {sections.length === 0 && (
          <p className="text-xs text-[#b8b4ae] text-center py-8">暂无板块</p>
        )}
      </div>

      <div className="p-3 border-t border-[#e8e4de]">
        <button
          onClick={onAdd}
          className="w-full py-2 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c] transition-colors"
        >
          + 新增板块
        </button>
      </div>
    </div>
  );
}

function SortableSectionItem({
  section, isSelected, onSelect, onDelete, onToggleVisibility,
}: {
  section: Section; isSelected: boolean; onSelect: () => void; onDelete: () => void; onToggleVisibility: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const [showActions, setShowActions] = useState(false);

  const icons: Record<string, string> = {
    about: '👤', education: '🎓', experience: '💼', life: '🌿', travel: '✈️', diary: '📓', thoughts: '💭',
    card: '🃏', timeline: '📅', gallery: '🖼️', article: '📝', travelogue: '✈️', mixed: '📦',
  };
  const icon = icons[section.slug] || icons[section.layout_type] || '📄';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-lg mb-1 transition-colors ${isSelected ? 'bg-[#2d2a24] text-white' : 'hover:bg-[#f8f5f0]'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer" onClick={onSelect}>
        <span {...attributes} {...listeners} className="cursor-grab text-[#b8b4ae] hover:text-inherit text-xs">
          ⠿
        </span>
        <span className="text-base">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className={`text-sm truncate ${isSelected ? 'text-white' : 'text-[#2d2a24]'}`}>
            {section.name}
          </p>
          <p className={`text-xs truncate ${isSelected ? 'text-white/60' : 'text-[#b8b4ae]'}`}>
            {section.is_visible ? '显示中' : '已隐藏'}
          </p>
        </div>
      </div>

      {showActions && (
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleVisibility(); }}
            className="w-6 h-6 flex items-center justify-center rounded text-xs bg-white/80 hover:bg-white shadow-sm"
            title={section.is_visible ? '隐藏' : '显示'}
          >
            {section.is_visible ? '👁️' : '🚫'}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-6 h-6 flex items-center justify-center rounded text-xs bg-white/80 hover:bg-white shadow-sm text-red-400"
            title="删除"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
