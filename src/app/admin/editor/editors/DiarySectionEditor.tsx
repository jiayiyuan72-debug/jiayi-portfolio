'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Section, ContentItem } from '@/types';
import BlockModeField from '@/components/admin/block-editor/BlockModeField';

interface Props {
  section: Section;
  contentItems: ContentItem[];
  onCreate: (data: Partial<ContentItem>) => Promise<string | null>;
  onSave: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => void;
}

const WEATHERS = ['☀️ 晴', '⛅ 多云', '☁️ 阴', '🌧️ 雨', '🌨️ 雪', '🌫️ 雾'];

export default function DiarySectionEditor({ section, contentItems, onCreate, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const sortedItems = [...contentItems].sort((a, b) => {
    const dateA = a.published_at || a.created_at;
    const dateB = b.published_at || b.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      body: item.body || '',
      fields: { ...item.fields },
      published_at: item.published_at || '',
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const success = await onSave(editingId, {
      title: editForm.title || formatDate(editForm.published_at),
      body: editForm.body,
      fields: editForm.fields,
    });
    if (success) {
      setEditingId(null);
      toast.success('已保存');
    }
  };

  const handleAdd = async () => {
    const today = new Date().toISOString().split('T')[0];
    const id = await onCreate({
      section_id: section.id,
      title: formatDate(today),
      fields: { weather: '', mood: '', images: [] },
      body: '今天...',
      tags: [],
      sort_order: 0,
      published_at: new Date().toISOString(),
    });
    if (id) {
      const newItem: ContentItem = {
        id, section_id: section.id, title: formatDate(today), content_type: 'diary',
        fields: { weather: '', mood: '', images: [] },
        body: '今天...', media_urls: [], file_urls: [], tags: [],
        sort_order: 0, is_visible: true, status: 'published', published_at: new Date().toISOString(),
        meta_title: '', meta_description: '', created_at: '', updated_at: '',
      };
      handleEdit(newItem);
    }
  };

  function formatDate(dateStr: string) {
    if (!dateStr) return '新日记';
    try {
      return new Date(dateStr).toLocaleDateString('zh-CN', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
      });
    } catch { return dateStr; }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8b8b8b]">共 {contentItems.length} 篇日记</p>
        <button onClick={handleAdd} className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">+ 写新日记</button>
      </div>

      <div className="space-y-3">
        {sortedItems.map(item => {
          const fields = item.fields || {};
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div key={item.id} className="bg-white rounded-xl p-5 border-2 border-[#d4a574] shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <label className="block text-xs text-[#8b8b8b] mb-1">日期</label>
                      <input type="date" value={editForm.published_at?.split('T')[0] || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, published_at: e.target.value }))}
                        className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">天气</label>
                      <select value={editForm.fields?.weather || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, weather: e.target.value } }))}
                        className="px-3 py-2 border border-[#e8e4de] rounded-lg text-sm">
                        <option value="">选择天气</option>
                        {WEATHERS.map(w => <option key={w} value={w.replace(/^[^\s]+\s/, '')}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">心情</label>
                      <input type="text" value={editForm.fields?.mood || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, mood: e.target.value } }))}
                        placeholder="开心、平静..." className="px-3 py-2 border border-[#e8e4de] rounded-lg text-sm w-28" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">日记内容</label>
                    <BlockModeField
                      body={editForm.body || ''}
                      fields={editForm.fields || {}}
                      onBodyChange={value => setEditForm(prev => ({ ...prev, body: value }))}
                      onFieldsChange={fields => setEditForm(prev => ({ ...prev, fields }))}
                      defaultBlockMode={!!(item.fields?.useBlockEditor)}
                    />
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
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-[#2d2a24]">
                      {item.published_at ? formatDate(item.published_at) : item.title}
                    </span>
                    {fields.weather && <span className="text-xs">{fields.weather}</span>}
                    {fields.mood && (
                      <span className="text-xs px-1.5 py-0.5 bg-[#f8f5f0] text-[#8b8b8b] rounded-full">{fields.mood}</span>
                    )}
                  </div>
                  <p className="text-sm text-[#5a5349] line-clamp-2">{item.body}</p>
                </div>
                <span className="text-xs text-[#b8b4ae] ml-2">编辑</span>
              </div>
            </div>
          );
        })}

        {sortedItems.length === 0 && (
          <div className="text-center py-12 text-[#b8b4ae] bg-white rounded-xl border border-[#e8e4de]">
            还没有日记，点击"写新日记"开始记录
          </div>
        )}
      </div>
    </div>
  );
}
