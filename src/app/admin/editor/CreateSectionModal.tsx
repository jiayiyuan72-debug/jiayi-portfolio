'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Section } from '@/types/section';

interface Props {
  onClose: () => void;
  onCreated: (section: Section) => void;
}

const BLOCK_TYPES = [
  { type: 'card', label: '文本板块', desc: '展示个人介绍、简介等内容', icon: '📝' },
  { type: 'timeline', label: '时间轴板块', desc: '按时间线展示经历和故事', icon: '📅' },
  { type: 'card', label: '卡片列表板块', desc: '以网格卡片形式展示内容', icon: '🃏' },
  { type: 'gallery', label: '图片画廊板块', desc: '展示图片集和相册', icon: '🖼️' },
  { type: 'article', label: '文章列表板块', desc: '展示文章和所思所想', icon: '📄' },
  { type: 'travelogue', label: '游记板块', desc: '展示旅游目的地和日记', icon: '✈️' },
  { type: 'diary', label: '日记板块', desc: '记录每日生活和心情', icon: '📓' },
  { type: 'mixed', label: '自定义板块', desc: '自由组合文字和图片', icon: '📦' },
];

export default function CreateSectionModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState('card');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('请输入板块名称');
      return;
    }
    setCreating(true);
    try {
      const slug = name.trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w一-鿿-]/g, '')
        .toLowerCase();

      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug,
          layout_type: selectedType,
          is_visible: true,
          sort_order: 999,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '创建失败');
      }

      const { data } = await res.json();
      toast.success('板块已创建');
      onCreated(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 fade-in">
        <h2 className="text-lg font-bold text-[#2d2a24] mb-2">新增板块</h2>
        <p className="text-sm text-[#8b8b8b] mb-5">选择板块类型后创建</p>

        {/* 选择类型 */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {BLOCK_TYPES.map(bt => (
            <button
              key={bt.icon}
              onClick={() => setSelectedType(bt.type)}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selectedType === bt.type
                  ? 'border-[#2d2a24] bg-[#f8f5f0]'
                  : 'border-[#e8e4de] hover:border-[#d4a574]'
              }`}
            >
              <span className="text-xl mt-0.5">{bt.icon}</span>
              <div>
                <p className="text-sm font-medium text-[#2d2a24]">{bt.label}</p>
                <p className="text-xs text-[#8b8b8b] mt-0.5">{bt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* 板块名称 */}
        <div className="mb-5">
          <label className="block text-sm text-[#2d2a24] mb-1">板块名称</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="例如：我的爱好"
            className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
            autoFocus
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-[#e8e4de] rounded-xl hover:bg-[#f8f5f0] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 py-2.5 text-sm bg-[#2d2a24] text-white rounded-xl hover:bg-[#4a443c] disabled:opacity-50 transition-colors"
          >
            {creating ? '创建中...' : '创建板块'}
          </button>
        </div>
      </div>
    </div>
  );
}
