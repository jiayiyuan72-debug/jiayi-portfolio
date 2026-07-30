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

export default function TimelineSectionEditor({ section, contentItems, onCreate, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});

  const sortedItems = [...contentItems].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const handleEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      body: item.body || '',
      fields: { ...item.fields },
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    const success = await onSave(editingId, {
      title: editForm.title,
      body: editForm.body,
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
      title: '新经历',
      fields: { school: '', company: '', position: '', start_date: '', end_date: '', content: '', output: '', reflection: '' },
      body: '',
      tags: [],
      sort_order: contentItems.length,
    });
    if (id) {
      const newItem: ContentItem = {
        id, section_id: section.id, title: '新经历', content_type: 'article',
        fields: { school: '', company: '', position: '', start_date: '', end_date: '', content: '', output: '', reflection: '' },
        body: '', media_urls: [], file_urls: [], tags: [], sort_order: contentItems.length,
        is_visible: true, status: 'published', published_at: null,
        meta_title: '', meta_description: '', created_at: '', updated_at: '',
      };
      handleEdit(newItem);
    }
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sortedItems.length) return;
    const items = [...sortedItems];
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    items.forEach((item, i) => onSave(item.id, { sort_order: i }));
    toast('顺序已更新');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8b8b8b]">
          共 {contentItems.length} 条经历，按时间倒序排列
        </p>
        <button
          onClick={handleAdd}
          className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]"
        >
          + 新增经历
        </button>
      </div>

      {/* 时间轴预览 */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-[#e8e4de]" />

        {sortedItems.map((item, index) => {
          const fields = item.fields || {};
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div key={item.id} className="relative pl-14 pb-8">
                <div className="absolute left-5 top-1 w-3 h-3 rounded-full bg-[#d4a574] -translate-x-1/2 z-10" />
                <div className="bg-white rounded-xl p-5 border border-[#d4a574] shadow-sm">
                  <h4 className="text-sm font-bold text-[#2d2a24] mb-3">编辑经历</h4>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-[#8b8b8b] mb-1">
                          {section.slug === 'education' ? '学校名称' : '公司名称'}
                        </label>
                        <input type="text" value={editForm.title}
                          onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#8b8b8b] mb-1">
                          {section.slug === 'education' ? '专业' : '岗位'}
                        </label>
                        <input type="text" value={editForm.fields?.major || editForm.fields?.position || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, position: e.target.value, major: e.target.value } }))}
                          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#8b8b8b] mb-1">开始时间</label>
                        <input type="text" value={editForm.fields?.start_date || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, start_date: e.target.value } }))}
                          placeholder="如 2022.09" className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-[#8b8b8b] mb-1">结束时间</label>
                        <input type="text" value={editForm.fields?.end_date || ''}
                          onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, end_date: e.target.value } }))}
                          placeholder="如 2026.06" className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">
                        {section.slug === 'education' ? '学生工作/活动' : '工作内容'}
                      </label>
                      <textarea value={editForm.fields?.activities || editForm.fields?.content || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, content: e.target.value, activities: e.target.value } }))}
                        rows={3} className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y" />
                    </div>

                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">
                        {section.slug === 'education' ? '获奖情况' : '主要产出'}
                      </label>
                      <textarea value={editForm.fields?.achievements || editForm.fields?.output || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, output: e.target.value, achievements: e.target.value } }))}
                        rows={2} className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y" />
                    </div>

                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">业务思考/心得</label>
                      <textarea value={editForm.fields?.reflection || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, reflection: e.target.value } }))}
                        rows={2} className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y" />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">保存</button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-1.5 text-sm border border-[#e8e4de] rounded-lg hover:bg-[#f8f5f0]">取消</button>
                      <button onClick={() => { if (confirm('确定删除？')) { onDelete(item.id); setEditingId(null); } }} className="px-4 py-1.5 text-sm text-red-400 border border-red-200 rounded-lg hover:bg-red-50 ml-auto">删除</button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <div key={item.id} className="relative pl-14 pb-8 group">
              <div className="absolute left-5 top-1 w-3 h-3 rounded-full bg-[#e8e4de] -translate-x-1/2 z-10 group-hover:bg-[#d4a574] transition-colors" />
              <div className="bg-white rounded-xl p-4 border border-[#e8e4de] card-hover cursor-pointer" onClick={() => handleEdit(item)}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); moveItem(index, 'up'); }} disabled={index === 0}
                        className="text-[#b8b4ae] hover:text-[#2d2a24] disabled:opacity-30 text-xs">↑</button>
                      <button onClick={(e) => { e.stopPropagation(); moveItem(index, 'down'); }} disabled={index === sortedItems.length - 1}
                        className="text-[#b8b4ae] hover:text-[#2d2a24] disabled:opacity-30 text-xs">↓</button>
                    </div>
                    {(fields.start_date || fields.end_date) && (
                      <span className="text-xs text-[#d4a574]">{fields.start_date || ''}{fields.start_date && fields.end_date ? ' - ' : ''}{fields.end_date || ''}</span>
                    )}
                    <h3 className="text-base font-semibold text-[#2d2a24]">{item.title}</h3>
                    {fields.school && <p className="text-sm text-[#8b8b8b]">{fields.school}</p>}
                    {fields.company && <p className="text-sm text-[#8b8b8b]">{fields.company}</p>}
                  </div>
                  <span className="text-xs text-[#b8b4ae]">点击编辑</span>
                </div>
              </div>
            </div>
          );
        })}

        {sortedItems.length === 0 && (
          <div className="text-center py-12 text-[#b8b4ae]">
            暂无经历，点击上方"新增经历"添加
          </div>
        )}
      </div>
    </div>
  );
}
