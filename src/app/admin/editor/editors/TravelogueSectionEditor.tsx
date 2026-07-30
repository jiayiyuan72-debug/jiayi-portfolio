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

export default function TravelogueSectionEditor({ section, contentItems, onCreate, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      body: item.body || '',
      fields: { ...item.fields },
      tags: item.tags || [],
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const success = await onSave(editingId, {
      title: editForm.title,
      body: editForm.body,
      fields: editForm.fields,
      tags: Array.isArray(editForm.tags) ? editForm.tags : editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    });
    if (success) {
      setEditingId(null);
      toast.success('已保存');
    }
  };

  const handleAdd = async () => {
    const id = await onCreate({
      section_id: section.id,
      title: '新目的地',
      fields: { destination: '', cover_image: '', travel_date: '', photos: [], diary: '', tags: '' },
      body: '', tags: [],
      sort_order: contentItems.length,
    });
    if (id) {
      const newItem: ContentItem = {
        id, section_id: section.id, title: '新目的地', content_type: 'travelogue',
        fields: { destination: '', cover_image: '', travel_date: '', photos: [], diary: '' },
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
        <p className="text-sm text-[#8b8b8b]">{contentItems.length} 个目的地</p>
        <button onClick={handleAdd} className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">+ 新增目的地</button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {contentItems.map(item => {
          const fields = item.fields || {};
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div key={item.id} className="bg-white rounded-xl p-5 border-2 border-[#d4a574] shadow-sm">
                <h4 className="text-sm font-bold text-[#2d2a24] mb-3">编辑目的地</h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">目的地名称</label>
                      <input type="text" value={editForm.fields?.destination || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, destination: e.target.value } }))}
                        className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">出行时间</label>
                      <input type="text" value={editForm.fields?.travel_date || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, travel_date: e.target.value } }))}
                        placeholder="如 2025.03.15 - 2025.03.18" className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">封面图</label>
                    <div className="h-32 bg-[#f8f5f0] rounded-lg flex items-center justify-center text-[#b8b4ae] text-sm cursor-pointer hover:bg-[#e8e4de] transition-colors">
                      📷 点击上传封面图
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">旅游日记</label>
                    <textarea value={editForm.body || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                      rows={8} placeholder="Day 1&#10;到达厦门已是下午...&#10;&#10;Day 2&#10;上午去了鼓浪屿..." className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y font-mono" />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">标签（用空格或逗号分隔）</label>
                    <input type="text" value={(editForm.fields?.tags || '')}
                      onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, tags: e.target.value } }))}
                      placeholder="如: 海边 美食 文化" className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
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
            <div key={item.id} className="bg-white rounded-xl overflow-hidden border border-[#e8e4de] card-hover cursor-pointer" onClick={() => handleEdit(item)}>
              <div className="h-36 bg-gradient-to-br from-[#e8c4a0] to-[#d4a574]/30 flex items-center justify-center">
                <span className="text-4xl">📍</span>
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold text-[#2d2a24]">{fields.destination || item.title}</h3>
                {fields.travel_date && <p className="text-xs text-[#8b8b8b] mt-1">{fields.travel_date}</p>}
                <p className="text-xs text-[#b8b4ae] mt-2">点击编辑</p>
              </div>
            </div>
          );
        })}

        {contentItems.length === 0 && (
          <div className="text-center py-12 text-[#b8b4ae] bg-white rounded-xl border border-[#e8e4de]">
            暂无游记，点击"新增目的地"添加
          </div>
        )}
      </div>
    </div>
  );
}
