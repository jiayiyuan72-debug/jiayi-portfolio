'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Section } from '@/types/section';
import { ContentItem } from '@/types/content';

export default function AdminContentPage() {
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/sections?all=true').then(r => r.json()),
      fetch('/api/content?all=true').then(r => r.json()),
    ]).then(([sectionsRes, contentRes]) => {
      setSections(sectionsRes.data || []);
      setContentItems(contentRes.data || []);
      setLoading(false);
    }).catch(() => {
      toast.error('加载数据失败');
      setLoading(false);
    });
  }, []);

  const filteredItems = selectedSectionId === 'all'
    ? contentItems
    : contentItems.filter(item => item.section_id === selectedSectionId);

  const getSectionName = (sectionId: string) => {
    return sections.find(s => s.id === sectionId)?.name || '未知板块';
  };

  if (loading) return <div className="animate-pulse text-[#d4a574]">加载中...</div>;

  return (
    <div>
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#2d2a24]">内容管理</h1>
          <p className="text-sm text-[#8b8b8b] mt-1">按板块查看和管理内容</p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-3 mb-6">
        <span className="text-sm text-[#8b8b8b]">按板块筛选：</span>
        <select
          value={selectedSectionId}
          onChange={e => setSelectedSectionId(e.target.value)}
          className="px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                     focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
        >
          <option value="all">全部板块</option>
          {sections.map(section => (
            <option key={section.id} value={section.id}>
              {section.name}
            </option>
          ))}
        </select>
      </div>

      {/* 内容列表 */}
      <div className="bg-white rounded-xl border border-[#e8e4de] overflow-hidden">
        <table className="w-full admin-table">
          <thead>
            <tr className="border-b border-[#e8e4de]">
              <th className="text-left px-4 py-3">标题</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">所属板块</th>
              <th className="text-left px-4 py-3 hidden sm:table-cell">状态</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">排序</th>
              <th className="text-right px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} className="border-b border-[#e8e4de] hover:bg-[#f8f5f0] transition-colors">
                <td className="px-4 py-3">
                  <span className="text-sm text-[#2d2a24]">{item.title || '(无标题)'}</span>
                  {!item.is_visible && (
                    <span className="ml-2 text-xs px-1.5 py-0.5 bg-[#f8f5f0] text-[#8b8b8b] rounded">隐藏</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-[#8b8b8b] hidden md:table-cell">
                  {getSectionName(item.section_id)}
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    item.status === 'published'
                      ? 'bg-green-50 text-green-600'
                      : 'bg-[#f8f5f0] text-[#8b8b8b]'
                  }`}>
                    {item.status === 'published' ? '已发布' : '草稿'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[#8b8b8b] hidden md:table-cell">{item.sort_order}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => router.push(`/admin/content/${item.id}`)}
                    className="px-3 py-1.5 text-xs bg-[#2d2a24] text-white rounded-lg
                               hover:bg-[#4a443c] transition-colors"
                  >
                    编辑
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[#b8b4ae]">暂无内容</p>
          </div>
        )}
      </div>
    </div>
  );
}
