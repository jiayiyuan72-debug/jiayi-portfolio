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
import BoardEditor from '@/components/admin/canvas-editor/CanvasEditor';
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
  const [editorMode, setEditorMode] = useState<'form' | 'board'>('form');

  const selectedSection = sections.find(s => s.id === selectedSectionId) || null;

  const MODE_KEY = 'editor-mode-by-section';
  // 切换模式并记忆到 localStorage
  const switchMode = (mode: 'form' | 'board') => {
    setEditorMode(mode);
    if (selectedSectionId) {
      try {
        const store = JSON.parse(localStorage.getItem(MODE_KEY) || '{}');
        store[selectedSectionId] = mode;
        localStorage.setItem(MODE_KEY, JSON.stringify(store));
      } catch { /* ignore */ }
    }
  };
  // 选中板块时恢复该板块上次用的模式（P1-7）
  useEffect(() => {
    if (!selectedSectionId) return;
    try {
      const store = JSON.parse(localStorage.getItem(MODE_KEY) || '{}');
      if (store[selectedSectionId]) setEditorMode(store[selectedSectionId]);
    } catch { /* ignore */ }
  }, [selectedSectionId]);

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

  // 画板模式：读/写 canvas_data（树形数组）
  const getCanvasData = (): any[] => {
    const items = getSectionContent(selectedSectionId || '');
    const holder = items.find(i => i.fields?.canvas_data) || items[0];
    return holder?.fields?.canvas_data || [];
  };
  const saveCanvasData = (trees: any[]) => {
    if (!selectedSectionId) return;
    const items = getSectionContent(selectedSectionId);
    const holder = items.find(i => i.fields?.canvas_data) || items[0];
    if (!holder) return;
    saveContentItem(holder.id, { fields: { ...holder.fields, canvas_data: trees } })
      .then(ok => ok && toast.success('画板已保存'));
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

    // 画板模式（可视化编辑）：canvas_data 树形容器编辑器
    if (editorMode === 'board') {
      return (
        <div className="h-[calc(100vh-12rem)]">
          <BoardEditor
            key={selectedSection.id}
            trees={getCanvasData()}
            onSave={saveCanvasData}
            onExit={() => switchMode('form')}
          />
        </div>
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
    // 移除负边距与 overflow-hidden：负边距会把中间内容区( flex-1)挤到板块列表区域并被裁剪，
    // 导致画板编辑器宽度塌陷成 ~32px（见 container-editor v2 需求诊断）。改用内部 padding 控制间距。
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

      {/* 中间：编辑器区域 */}
      <div className="flex-1 min-w-0 overflow-y-auto bg-[#f5f5f0]">
        <div className={`${editorMode === 'board' ? 'p-0 min-w-0' : 'max-w-4xl mx-auto p-6 min-w-0'}`}>
          {selectedSection && (
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold text-[#2d2a24]">
                {selectedSection.name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-[#8b8b8b]">
                {/* 编辑模式切换（2 种：内容管理 / 可视化编辑） */}
                <div className="flex items-center gap-1 bg-[#f8f5f0] border border-[#e8e4de] rounded-lg p-0.5">
                  <button
                    onClick={() => switchMode('form')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      editorMode === 'form' ? 'bg-[#2d2a24] text-white' : 'text-[#5a5349]'
                    }`}
                  >
                    📋 内容管理
                  </button>
                  <button
                    onClick={() => switchMode('board')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      editorMode === 'board' ? 'bg-[#4a90e2] text-white' : 'text-[#5a5349]'
                    }`}
                  >
                    🎨 可视化编辑
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

      {/* 右侧：样式面板（内容管理模式；可视化编辑模式在画板内自带属性面板） */}
      {editorMode === 'form' && (
        <StylePanel
          section={selectedSection}
          onChange={promptSaveSection}
        />
      )}

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
