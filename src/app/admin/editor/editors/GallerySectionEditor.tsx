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

export default function GallerySectionEditor({ section, contentItems, onCreate, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      fields: { ...item.fields },
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const success = await onSave(editingId, {
      title: editForm.title,
      fields: editForm.fields,
    });
    if (success) {
      setEditingId(null);
      toast.success('已保存');
    }
  };

  const handleAdd = async () => {
    const id = await onCreate({
      section_id: section.id,
      title: '新图片',
      fields: { caption: '', image: '', location: '' },
      tags: [],
      sort_order: contentItems.length,
    });
    if (id) {
      const newItem: ContentItem = {
        id, section_id: section.id, title: '新图片', content_type: 'image',
        fields: { caption: '', image: '', location: '' },
        body: '', media_urls: [], file_urls: [], tags: [],
        sort_order: contentItems.length, is_visible: true, status: 'published', published_at: null,
        meta_title: '', meta_description: '', created_at: '', updated_at: '',
      };
      handleEdit(newItem);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8b8b8b]">{contentItems.length} 张图片</p>
        <button onClick={handleAdd} className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">+ 新增图片</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {contentItems.map(item => {
          const fields = item.fields || {};
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div key={item.id} className="col-span-full bg-white rounded-xl p-5 border-2 border-[#d4a574] shadow-sm">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">图片标题</label>
                    <input type="text" value={editForm.title}
                      onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">说明文字</label>
                    <input type="text" value={editForm.fields?.caption || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, caption: e.target.value } }))}
                      className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">拍摄地点</label>
                    <input type="text" value={editForm.fields?.location || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, location: e.target.value } }))}
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
            <div key={item.id} className="aspect-square bg-[#f8f5f0] rounded-xl overflow-hidden border border-[#e8e4de] cursor-pointer group relative" onClick={() => handleEdit(item)}>
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl">🖼️</span>
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end p-3">
                <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-sm font-medium">{fields.caption || item.title}</p>
                  {fields.location && <p className="text-xs text-white/70">{fields.location}</p>}
                </div>
              </div>
            </div>
          );
        })}

        {contentItems.length === 0 && (
          <div className="col-span-full text-center py-12 text-[#b8b4ae] bg-white rounded-xl border border-[#e8e4de]">
            暂无图片，点击"新增图片"添加
          </div>
        )}
      </div>
    </div>
  );
}
