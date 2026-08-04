'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Section } from '@/types/section';
import { ContentItem } from '@/types/content';
import SectionList from './SectionList';
import CreateSectionModal from './CreateSectionModal';
import CanvasEditor from '@/components/admin/canvas-editor/CanvasEditor';

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="text-[#d4a574] p-4">加载中...</div>}>
      <EditorPageInner />
    </Suspense>
  );
}

function EditorPageInner() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams?.get('section');
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [secRes, conRes] = await Promise.all([
        fetch('/api/sections?all=true'),
        fetch('/api/content?all=true'),
      ]);
      const { data: sectionsData } = await secRes.json();
      const { data: contentData } = await conRes.json();

      setSections(sectionsData || []);
      setContentItems(contentData || []);

      if (sectionParam && sectionsData?.length > 0) {
        const target = sectionsData.find((s: Section) => s.slug === sectionParam);
        if (target) {
          setSelectedSectionId(target.id);
        } else if (!selectedSectionId) {
          setSelectedSectionId(sectionsData[0].id);
        }
      } else if (sectionsData?.length > 0 && !selectedSectionId) {
        setSelectedSectionId(sectionsData[0].id);
      }
    } catch {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const saveContentItem = async (itemId: string, data: Partial<ContentItem>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/content/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      setContentItems(prev => prev.map(c => c.id === itemId ? { ...c, ...data } : c));
      return true;
    } catch {
      toast.error('保存内容失败');
      return false;
    }
  };

  const createContentItem = async (data: Partial<ContentItem>): Promise<string | null> => {
    try {
      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'published', is_visible: true }),
      });
      if (!res.ok) throw new Error();
      const { data: newItem } = await res.json();
      setContentItems(prev => [...prev, newItem]);
      return newItem.id;
    } catch {
      toast.error('创建内容失败');
      return null;
    }
  };

  const getSectionContent = (sectionId: string): ContentItem[] => {
    return contentItems.filter(c => c.section_id === sectionId);
  };

  const handleSectionCreated = (section: Section) => {
    setSections(prev => [...prev, section]);
    setSelectedSectionId(section.id);
    setShowCreate(false);
  };

  const handleSectionDeleted = async (sectionId: string) => {
    try {
      await fetch(`/api/sections/${sectionId}`, { method: 'DELETE' });
      setSections(prev => prev.filter(s => s.id !== sectionId));
      setContentItems(prev => prev.filter(c => c.section_id !== sectionId));
      if (selectedSectionId === sectionId) {
        const remaining = sections.filter(s => s.id !== sectionId);
        setSelectedSectionId(remaining.length > 0 ? remaining[0].id : null);
      }
      toast.success('板块已删除');
    } catch {
      toast.error('删除失败');
    }
  };

  const handleSectionsReordered = (reordered: Section[]) => {
    setSections(reordered);
    fetch('/api/sections/reorder', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: reordered.map((s, i) => ({ id: s.id, sort_order: i })) }),
    }).catch(() => loadData());
  };

  // 画板数据读写：canvas_data 存在 ContentItem.fields.canvas_data
  const getCanvasData = (): any[] => {
    const items = getSectionContent(selectedSectionId || '');
    const holder = items.find(i => i.fields?.canvas_data) || items[0];
    return holder?.fields?.canvas_data || [];
  };

  const saveCanvasData = useCallback(async (trees: any[]) => {
    if (!selectedSectionId) return;
    const items = getSectionContent(selectedSectionId);
    let holder = items.find(i => i.fields?.canvas_data) || items[0];

    if (!holder) {
      const newId = await createContentItem({
        section_id: selectedSectionId,
        title: 'canvas_data',
        content_type: 'article',
        fields: { canvas_data: trees },
        body: '',
        sort_order: 0,
      });
      if (!newId) toast.error('保存失败：无法创建内容项');
      return;
    }

    await saveContentItem(holder.id, { fields: { ...holder.fields, canvas_data: trees } });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSectionId, contentItems]);

  const saveSection = async (updated: Partial<Section>) => {
    if (!selectedSectionId) return;
    setSaving(true);
    try {
      await fetch(`/api/sections/${selectedSectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const promptSaveSection = (updated: Partial<Section>) => {
    if (!selectedSectionId) return;
    setSections(prev => prev.map(s =>
      s.id === selectedSectionId ? { ...s, ...updated } : s
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#d4a574]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <Toaster position="top-center" />

      {/* 左侧：板块列表 */}
      <SectionList
        sections={sections}
        selectedId={selectedSectionId}
        onSelect={setSelectedSectionId}
        onReorder={handleSectionsReordered}
        onDelete={handleSectionDeleted}
        onAdd={() => setShowCreate(true)}
        onToggleVisibility={async (id) => {
          const section = sections.find(s => s.id === id);
          if (!section) return;
          await fetch(`/api/sections/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...section, is_visible: !section.is_visible }),
          });
          setSections(prev => prev.map(s =>
            s.id === id ? { ...s, is_visible: !s.is_visible } : s
          ));
        }}
      />

      {/* 中间+右侧：单一可视化编辑器（无模式切换） */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {selectedSection ? (
          <CanvasEditor
            key={selectedSection.id}
            trees={getCanvasData()}
            onSave={saveCanvasData}
            sectionName={selectedSection.name}
            sectionId={selectedSection.id}
            section={selectedSection}
            onSectionUpdate={promptSaveSection}
            onSectionSave={saveSection}
            saving={saving}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-[#b8b4ae]">
            请从左侧选择一个板块开始编辑
          </div>
        )}
      </div>

      {/* 新增板块弹窗 */}
      {showCreate && (
        <CreateSectionModal
          onClose={() => setShowCreate(false)}
          onCreated={handleSectionCreated}
        />
      )}
    </div>
  );
}
