'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Section, ContentItem } from '@/types';

interface Props {
  section: Section;
  contentItems: ContentItem[];
  onCreate: (data: Partial<ContentItem>) => Promise<string | null>;
  onSave: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => void;
}

export default function CardSectionEditor({ section, contentItems, onCreate, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      body: item.body || '',
      fields: { ...item.fields },
      tags: (item.tags || []).join(', '),
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const success = await onSave(editingId, {
      title: editForm.title,
      body: editForm.body,
      fields: editForm.fields,
      tags: editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    });
    if (success) {
      setEditingId(null);
      toast.success('已保存');
    }
  };

  const handleAdd = async () => {
    const id = await onCreate({
      section_id: section.id,
      title: '新内容',
      fields: {},
      body: '',
      tags: [],
      sort_order: contentItems.length,
    });
    if (id) {
      const newItem: ContentItem = {
        id, section_id: section.id, title: '新内容', content_type: 'article',
        fields: {}, body: '', media_urls: [], file_urls: [], tags: [],
        sort_order: contentItems.length, is_visible: true, status: 'published', published_at: null,
        meta_title: '', meta_description: '', created_at: '', updated_at: '',
      };
      handleEdit(newItem);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8b8b8b]">{contentItems.length} 条内容</p>
        <button onClick={handleAdd} className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">+ 新增</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contentItems.map(item => {
          const fields = item.fields || {};
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div key={item.id} className="col-span-full bg-white rounded-xl p-5 border-2 border-[#d4a574] shadow-sm">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">标题</label>
                    <input type="text" value={editForm.title}
                      onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                  </div>

                  {Object.keys(editForm.fields || {}).map(key => {
                    if (key === 'subtitle' || key === 'cover_image') return null;
                    return (
                      <div key={key}>
                        <label className="block text-xs text-[#8b8b8b] mb-1">{key}</label>
                        <input type="text" value={editForm.fields?.[key] || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, [key]: e.target.value } }))}
                          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                      </div>
                    );
                  })}

                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">正文</label>
                    <textarea value={editForm.body || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                      rows={4} className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y" />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">标签（逗号分隔）</label>
                    <input type="text" value={editForm.tags || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">保存</button>
                    <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-sm border border-[#e8e4de] rounded-lg hover:bg-[#f8f5f0]">取消</button>
                    <button onClick={() => { if (confirm('确定删除？')) { onDelete(item.id); setEditingId(null); } }} className="px-4 py-1.5 text-sm text-red-400 ml-auto">删除</button>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="bg-white rounded-xl p-4 border border-[#e8e4de] card-hover cursor-pointer" onClick={() => handleEdit(item)}>
              <h3 className="text-base font-semibold text-[#2d2a24] mb-1">{item.title}</h3>
              {fields.subtitle && <p className="text-xs text-[#8b8b8b] mb-2">{fields.subtitle}</p>}
              {item.body && <p className="text-sm text-[#5a5349] line-clamp-2">{item.body}</p>}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {item.tags.map(tag => <span key={tag} className="text-xs px-1.5 py-0.5 bg-[#f8f5f0] text-[#8b8b8b] rounded">{tag}</span>)}
                </div>
              )}
            </div>
          );
        })}

        {contentItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#b8b4ae] bg-white rounded-xl border border-[#e8e4de]">
            暂无内容，点击"新增"添加
          </div>
        )}
      </div>
    </div>
  );
}
