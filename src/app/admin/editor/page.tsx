'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Section } from '@/types/section';
import { ContentItem } from '@/types/content';
import SectionList from './SectionList';
import StylePanel from './StylePanel';
import CreateSectionModal from './CreateSectionModal';
import ProfileSectionEditor from './editors/ProfileSectionEditor';
import TimelineSectionEditor from './editors/TimelineSectionEditor';
import TravelogueSectionEditor from './editors/TravelogueSectionEditor';
import DiarySectionEditor from './editors/DiarySectionEditor';
import ArticleSectionEditor from './editors/ArticleSectionEditor';
import CardSectionEditor from './editors/CardSectionEditor';
import GallerySectionEditor from './editors/GallerySectionEditor';
import CanvasEditor from './canvas/CanvasEditor';
import PageBuilder from '@/components/admin/builder/PageBuilder';
import { GridLayout } from '@/types/content';

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="text-[#d4a574] p-4">加载中...</div>}>
      <EditorPageInner />
    </Suspense>
  );
}

function EditorPageInner() {
  const searchParams = useSearchParams();
  const sectionParam = searchParams?.get('section'); // slug
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [editorMode, setEditorMode] = useState<'form' | 'canvas' | 'free'>('form');

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

      // 支持 ?section=slug 参数：从 URL 选中对应板块
      if (sectionParam && sectionsData?.length > 0) {
        const target = sectionsData.find((s: Section) => s.slug === sectionParam);
        if (target) {
          setSelectedSectionId(target.id);
        } else if (!selectedSectionId) {
          setSelectedSectionId(sectionsData[0].id);
        }
      } else if (sectionsData?.length > 0 && !selectedSectionId) {
        // 默认选中第一个板块
        setSelectedSectionId(sectionsData[0].id);
      }
    } catch {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const promptSaveSection = (updated: Partial<Section>) => {
    if (!selectedSectionId) return;

    // 更新本地状态
    setSections(prev => prev.map(s =>
      s.id === selectedSectionId ? { ...s, ...updated } : s
    ));

    // 自动保存（防抖）
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => saveSection(updated), 2000);
    setAutoSaveTimer(timer);
  };

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

  const deleteContentItem = async (itemId: string) => {
    try {
      await fetch(`/api/content/${itemId}`, { method: 'DELETE' });
      setContentItems(prev => prev.filter(c => c.id !== itemId));
      toast.success('已删除');
    } catch {
      toast.error('删除失败');
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

  // 画布模式：拖拽换位（更新 sort_order）
  const handleCanvasReorder = (reordered: ContentItem[]) => {
    setContentItems(prev => {
      const map = new Map(reordered.map(i => [i.id, i]));
      return prev.map(i => map.get(i.id) || i);
    });
    // 持久化每个块的 sort_order
    reordered.forEach(item => {
      if (item.sort_order !== undefined) {
        fetch(`/api/content/${item.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sort_order: item.sort_order }),
        });
      }
    });
  };

  // 画布模式：块的布局（col_span）变化 —— 防抖保存
  const handleCanvasLayoutChange = (id: string, layout: GridLayout) => {
    setContentItems(prev =>
      prev.map(c => (c.id === id ? { ...c, fields: { ...c.fields, layout } } : c))
    );
    if (autoSaveTimer) clearTimeout(autoSaveTimer);
    const timer = setTimeout(() => {
      saveContentItem(id, { fields: { ...contentItems.find(c => c.id === id)?.fields, layout } })
        .then(ok => { if (ok) toast.success('画布布局已保存'); });
    }, 2000);
    setAutoSaveTimer(timer);
  };

  const handleCanvasEdit = () => {
    setEditorMode('form');
  };

  // 自由布局：从某内容项读取/写回 page_layout JSON
  const getFreeLayout = (): any[] => {
    const items = getSectionContent(selectedSectionId || '');
    const holder = items.find(i => i.fields?.page_layout) || items[0];
    return holder?.fields?.page_layout?.containers || [];
  };

  const saveFreeLayout = (containers: any[]) => {
    if (!selectedSectionId) return;
    const items = getSectionContent(selectedSectionId);
    // 找一个持有 page_layout 的内容项；没有则用第一个（或新建）
    const holder = items.find(i => i.fields?.page_layout) || items[0];
    if (!holder) return;
    saveContentItem(holder.id, { fields: { ...holder.fields, page_layout: { containers } } })
      .then(ok => ok && toast.success('布局已保存'));
  };

  const renderSectionEditor = () => {
    if (!selectedSection) {
      return (
        <div className="flex items-center justify-center h-64 text-[#b8b4ae]">
          请从左侧选择一个板块开始编辑
        </div>
      );
    }

    const items = getSectionContent(selectedSection.id);

    // 自由布局模式：容器化页面构建器
    if (editorMode === 'free') {
      return (
        <div className="h-[calc(100vh-12rem)]">
          <PageBuilder
            key={selectedSection.id}
            layout={getFreeLayout()}
            onSave={saveFreeLayout}
            onExit={() => setEditorMode('form')}
          />
        </div>
      );
    }

    // 画布模式：可视化排版（拖拽换位 + 宽度缩放 + 智能排列）
    if (editorMode === 'canvas') {
      return (
        <CanvasEditor
          section={{ id: selectedSection.id, layout_type: selectedSection.layout_type }}
          contentItems={items}
          onReorder={handleCanvasReorder}
          onLayoutChange={handleCanvasLayoutChange}
          onEdit={handleCanvasEdit}
        />
      );
    }

    switch (selectedSection.layout_type) {
      case 'card':
        if (selectedSection.slug === 'about') {
          return (
            <ProfileSectionEditor
              section={selectedSection}
              contentItems={items}
              onCreate={createContentItem}
              onSave={saveContentItem}
              onDelete={deleteContentItem}
            />
          );
        }
        return (
          <CardSectionEditor
            section={selectedSection}
            contentItems={items}
            onCreate={createContentItem}
            onSave={saveContentItem}
            onDelete={deleteContentItem}
          />
        );
      case 'timeline':
        return (
          <TimelineSectionEditor
            section={selectedSection}
            contentItems={items}
            onCreate={createContentItem}
            onSave={saveContentItem}
            onDelete={deleteContentItem}
          />
        );
      case 'travelogue':
        return (
          <TravelogueSectionEditor
            section={selectedSection}
            contentItems={items}
            onCreate={createContentItem}
            onSave={saveContentItem}
            onDelete={deleteContentItem}
          />
        );
      case 'diary':
        return (
          <DiarySectionEditor
            section={selectedSection}
            contentItems={items}
            onCreate={createContentItem}
            onSave={saveContentItem}
            onDelete={deleteContentItem}
          />
        );
      case 'article':
        return (
          <ArticleSectionEditor
            section={selectedSection}
            contentItems={items}
            onCreate={createContentItem}
            onSave={saveContentItem}
            onDelete={deleteContentItem}
          />
        );
      case 'gallery':
        return (
          <GallerySectionEditor
            section={selectedSection}
            contentItems={items}
            onCreate={createContentItem}
            onSave={saveContentItem}
            onDelete={deleteContentItem}
          />
        );
      case 'mixed':
        return (
          <CardSectionEditor
            section={selectedSection}
            contentItems={items}
            onCreate={createContentItem}
            onSave={saveContentItem}
            onDelete={deleteContentItem}
          />
        );
      default:
        return <div className="text-[#b8b4ae]">暂不支持此板块类型</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-[#d4a574]">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] -m-4 sm:-m-6 lg:-m-8 overflow-hidden">
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

      {/* 中间：编辑器区域 */}
      <div className="flex-1 overflow-y-auto bg-[#f5f5f0]">
        <div className="max-w-4xl mx-auto p-6">
          {selectedSection && (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-[#2d2a24]">
                {selectedSection.name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-[#8b8b8b]">
                {/* 编辑模式切换 */}
                <div className="flex items-center gap-1 bg-[#f8f5f0] border border-[#e8e4de] rounded-lg p-0.5">
                  <button
                    onClick={() => setEditorMode('form')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      editorMode === 'form' ? 'bg-[#2d2a24] text-white' : 'text-[#5a5349]'
                    }`}
                  >
                    表单
                  </button>
                  <button
                    onClick={() => setEditorMode('canvas')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      editorMode === 'canvas' ? 'bg-[#d4a574] text-white' : 'text-[#5a5349]'
                    }`}
                  >
                    🖼️ 画布
                  </button>
                  <button
                    onClick={() => setEditorMode('free')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      editorMode === 'free' ? 'bg-[#7c9a7f] text-white' : 'text-[#5a5349]'
                    }`}
                  >
                    🧩 自由布局
                  </button>
                </div>
                {saving && <span>保存中...</span>}
                <span>{getSectionContent(selectedSection.id).length} 条内容</span>
              </div>
            </div>
          )}
          {renderSectionEditor()}
        </div>
      </div>

      {/* 右侧：样式面板 */}
      <StylePanel
        section={selectedSection}
        onChange={promptSaveSection}
      />

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
