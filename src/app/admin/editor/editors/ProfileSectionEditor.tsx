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

export default function ProfileSectionEditor({ section, contentItems, onCreate, onSave, onDelete }: Props) {
  const mainItem = contentItems.find(c => c.fields?.avatar !== undefined) || contentItems[0];
  const [editing, setEditing] = useState(mainItem?.id || null);
  const [editData, setEditData] = useState<Record<string, any>>(mainItem?.fields || {});

  if (!mainItem) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-[#e8e4de]">
        <p className="text-[#b8b4ae] mb-4">还没有个人信息</p>
        <button onClick={() => onCreate({
          section_id: section.id,
          title: 'Jiayi',
          fields: { avatar: '', birthday: '', location: '', contact: '' },
          body: '介绍一下自己吧...',
          tags: [],
        })} className="px-4 py-2 bg-[#2d2a24] text-white rounded-xl text-sm">添加个人信息</button>
      </div>
    );
  }

  const fields = editing === mainItem.id ? editData : (mainItem.fields || {});
  const body = editing === mainItem.id ? (editData._body || mainItem.body || '') : mainItem.body || '';

  const handleFieldChange = (key: string, value: any) => {
    setEditData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const success = await onSave(mainItem.id, {
      fields: { ...editData },
      body: editData._body || mainItem.body,
    });
    if (success) {
      setEditing(null);
      toast.success('已保存');
    }
  };

  const handleEdit = () => {
    setEditing(mainItem.id);
    setEditData({ ...mainItem.fields, _body: mainItem.body });
  };

  return (
    <div>
      {/* 预览卡片 */}
      <div className="bg-white rounded-xl p-6 border border-[#e8e4de] mb-6">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          {/* 头像 */}
          <div className="w-24 h-24 rounded-full bg-[#f8f5f0] border-2 border-[#e8e4de] flex items-center justify-center mb-4 overflow-hidden">
            {editing === mainItem.id ? (
              <div className="relative">
                <div className="w-full h-24 flex items-center justify-center bg-[#f8f5f0] cursor-pointer hover:bg-[#e8e4de] transition-colors rounded-full">
                  <span className="text-2xl">📷</span>
                </div>
              </div>
            ) : fields.avatar ? (
              <img src={fields.avatar} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">📷</span>
            )}
          </div>

          {/* 姓名 */}
          <h2 className="text-xl font-bold text-[#2d2a24] mb-1">{mainItem.title}</h2>
        </div>
      </div>

      {/* 编辑表单 */}
      <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-[#2d2a24]">编辑个人信息</h3>
          {editing !== mainItem.id ? (
            <button onClick={handleEdit} className="text-sm text-[#d4a574] hover:underline">编辑</button>
          ) : (
            <button onClick={handleSave} className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">保存</button>
          )}
        </div>

        {editing === mainItem.id ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#8b8b8b] mb-1">姓名</label>
                <input
                  type="text" value={mainItem.title}
                  onChange={e => onSave(mainItem.id, { title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8b8b8b] mb-1">所在地</label>
                <input
                  type="text" value={fields.location || ''}
                  onChange={e => handleFieldChange('location', e.target.value)}
                  placeholder="如：上海"
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8b8b8b] mb-1">生日</label>
                <input
                  type="date" value={fields.birthday || ''}
                  onChange={e => handleFieldChange('birthday', e.target.value)}
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-[#8b8b8b] mb-1">联系方式</label>
                <input
                  type="text" value={fields.contact || ''}
                  onChange={e => handleFieldChange('contact', e.target.value)}
                  placeholder="邮箱或社交账号"
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#8b8b8b] mb-1">个人简介</label>
              <textarea
                value={editData._body || ''}
                onChange={e => setEditData(prev => ({ ...prev, _body: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-[#5a5349]">
            {fields.location && <p>📍 {fields.location}</p>}
            {fields.birthday && <p>🎂 {fields.birthday}</p>}
            {fields.contact && <p>📧 {fields.contact}</p>}
            {mainItem.body && <p className="mt-3 whitespace-pre-line">{mainItem.body}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
