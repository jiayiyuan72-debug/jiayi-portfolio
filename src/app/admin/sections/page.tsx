'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Section, LayoutType } from '@/types/section';
import { LAYOUT_LABELS } from '@/lib/constants';

export default function AdminSectionsPage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newSection, setNewSection] = useState({
    name: '',
    slug: '',
    layout_type: 'card' as LayoutType,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    try {
      const res = await fetch('/api/sections?all=true');
      const { data } = await res.json();
      setSections(data || []);
    } catch (error) {
      toast.error('加载板块失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);

    const reordered = [...sections];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    // 更新 sort_order
    const updated = reordered.map((s, i) => ({ ...s, sort_order: i }));
    setSections(updated);

    // 持久化
    try {
      await fetch('/api/sections/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: updated.map((s, i) => ({ id: s.id, sort_order: i })),
        }),
      });
    } catch {
      toast.error('排序保存失败');
      fetchSections(); // 还原
    }
  };

  const handleToggleVisibility = async (section: Section) => {
    try {
      const res = await fetch(`/api/sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...section, is_visible: !section.is_visible }),
      });

      if (!res.ok) throw new Error();

      toast.success(`板块已${section.is_visible ? '隐藏' : '显示'}`);
      fetchSections();
    } catch {
      toast.error('操作失败');
    }
  };

  const handleDelete = async (section: Section) => {
    if (!window.confirm(`确定删除板块「${section.name}」吗？板块内的所有内容也会被删除。`)) return;

    try {
      const res = await fetch(`/api/sections/${section.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('板块已删除');
      fetchSections();
    } catch {
      toast.error('删除失败');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newSection.name.trim()) {
      toast.error('请输入板块名称');
      return;
    }
    if (!newSection.slug.trim()) {
      toast.error('请输入板块标识');
      return;
    }

    try {
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSection,
          sort_order: sections.length,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '创建失败');
      }

      toast.success('板块已创建');
      setShowCreate(false);
      setNewSection({ name: '', slug: '', layout_type: 'card' });
      fetchSections();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return <div className="animate-pulse text-[#d4a574]">加载中...</div>;
  }

  return (
    <div>
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#2d2a24]">板块管理</h1>
          <p className="text-sm text-[#8b8b8b] mt-1">拖拽排序、新增、隐藏或删除板块</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#2d2a24] text-white rounded-xl text-sm
                     hover:bg-[#4a443c] transition-colors"
        >
          + 新增板块
        </button>
      </div>

      {/* 新增板块表单 */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-[#2d2a24] mb-4">新增板块</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-[#2d2a24] mb-1">板块名称 *</label>
                <input
                  type="text"
                  value={newSection.name}
                  onChange={e => {
                    setNewSection(prev => ({
                      ...prev,
                      name: e.target.value,
                      slug: e.target.value
                        ? e.target.value.replace(/\s+/g, '-').toLowerCase()
                        : '',
                    }));
                  }}
                  placeholder="例如：我的爱好"
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
                />
              </div>

              <div>
                <label className="block text-sm text-[#2d2a24] mb-1">
                  板块标识 (slug) *
                </label>
                <input
                  type="text"
                  value={newSection.slug}
                  onChange={e => setNewSection(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="hobbies"
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
                />
              </div>

              <div>
                <label className="block text-sm text-[#2d2a24] mb-1">布局类型</label>
                <select
                  value={newSection.layout_type}
                  onChange={e => setNewSection(prev => ({ ...prev, layout_type: e.target.value as LayoutType }))}
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
                >
                  {Object.entries(LAYOUT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 px-4 py-2 text-sm border border-[#e8e4de] rounded-xl
                             hover:bg-[#f8f5f0] transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 text-sm bg-[#2d2a24] text-white rounded-xl
                             hover:bg-[#4a443c] transition-colors"
                >
                  创建
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 板块列表 */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section, index) => (
              <SortableSectionCard
                key={section.id}
                section={section}
                index={index}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDelete}
                onEdit={() => router.push(`/admin/sections/${section.id}`)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div className="text-center py-16">
          <p className="text-[#b8b4ae]">暂无板块，点击右上角创建第一个板块</p>
        </div>
      )}
    </div>
  );
}

// 可拖拽的板块卡片
function SortableSectionCard({
  section,
  index,
  onToggleVisibility,
  onDelete,
  onEdit,
}: {
  section: Section;
  index: number;
  onToggleVisibility: (s: Section) => void;
  onDelete: (s: Section) => void;
  onEdit: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl border border-[#e8e4de] p-4 flex items-center gap-4"
    >
      {/* 拖拽手柄 */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-[#b8b4ae] hover:text-[#2d2a24] transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <circle cx="5" cy="3" r="1.5" />
          <circle cx="11" cy="3" r="1.5" />
          <circle cx="5" cy="8" r="1.5" />
          <circle cx="11" cy="8" r="1.5" />
          <circle cx="5" cy="13" r="1.5" />
          <circle cx="11" cy="13" r="1.5" />
        </svg>
      </button>

      {/* 序号 */}
      <span className="text-xs text-[#b8b4ae] w-6">{index + 1}</span>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#2d2a24]">{section.name}</span>
          {!section.is_visible && (
            <span className="text-xs px-1.5 py-0.5 bg-[#f8f5f0] text-[#8b8b8b] rounded">已隐藏</span>
          )}
          <span className="text-xs text-[#b8b4ae]">{LAYOUT_LABELS[section.layout_type] || section.layout_type}</span>
        </div>
        <p className="text-xs text-[#b8b4ae]">/{section.slug}</p>
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onToggleVisibility(section)}
          className="px-3 py-1.5 text-xs border border-[#e8e4de] rounded-lg
                     hover:bg-[#f8f5f0] transition-colors"
        >
          {section.is_visible ? '隐藏' : '显示'}
        </button>
        <button
          onClick={onEdit}
          className="px-3 py-1.5 text-xs bg-[#2d2a24] text-white rounded-lg
                     hover:bg-[#4a443c] transition-colors"
        >
          设计
        </button>
        <button
          onClick={() => onDelete(section)}
          className="px-3 py-1.5 text-xs text-red-400 border border-red-200 rounded-lg
                     hover:bg-red-50 transition-colors"
        >
          删除
        </button>
      </div>
    </div>
  );
}
