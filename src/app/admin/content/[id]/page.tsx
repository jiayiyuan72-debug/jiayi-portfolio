'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Section } from '@/types/section';
import { ContentItem, ContentStatus } from '@/types/content';
import DynamicForm from '@/components/admin/DynamicForm';

interface FieldValues {
  [key: string]: any;
}

export default function AdminContentEditPage() {
  const params = useParams();
  const router = useRouter();
  const [content, setContent] = useState<ContentItem | null>(null);
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [fieldValues, setFieldValues] = useState<FieldValues>({});
  const [tags, setTags] = useState('');
  const [status, setStatus] = useState<ContentStatus>('draft');
  const [isVisible, setIsVisible] = useState(true);

  // 如果是新建内容可能会有 section_id 参数
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 加载板块列表用于选择
      const secRes = await fetch('/api/sections?all=true');
      const secData = await secRes.json();
      setSections(secData.data || []);

      // 如果有 id 参数，加载内容
      if (params.id && params.id !== 'new') {
        const contentRes = await fetch(`/api/content/${params.id}`);
        const contentData = await contentRes.json();
        const item: ContentItem = contentData.data;

        setContent(item);
        setTitle(item.title);
        setBody(item.body || '');
        setFieldValues(item.fields || {});
        setTags((item.tags || []).join(', '));
        setStatus(item.status);
        setIsVisible(item.is_visible);
        setSelectedSectionId(item.section_id);

        // 加载对应板块
        const sectionRes = await fetch(`/api/sections/${item.section_id}`);
        const sectionData = await sectionRes.json();
        setSection(sectionData.data);
      }
    } catch {
      toast.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadSection = async (sectionId: string) => {
    try {
      const res = await fetch(`/api/sections/${sectionId}`);
      const { data } = await res.json();
      setSection(data);
    } catch {
      toast.error('加载板块失败');
    }
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    loadSection(sectionId);
  };

  const handleSave = async (publishNow: boolean = false) => {
    if (!selectedSectionId && !content) {
      toast.error('请选择所属板块');
      return;
    }

    setSaving(true);
    try {
      const newStatus = publishNow ? 'published' : status;

      const payload = {
        section_id: selectedSectionId || content?.section_id,
        title,
        content_type: 'article',
        fields: fieldValues,
        body,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_visible: isVisible,
        status: newStatus,
        ...(newStatus === 'published' && { published_at: content?.published_at || new Date().toISOString() }),
      };

      const method = content ? 'PUT' : 'POST';
      const url = content ? `/api/content/${content.id}` : '/api/content';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '保存失败');
      }

      toast.success('保存成功');
      router.push('/admin/content');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="animate-pulse text-[#d4a574]">加载中...</div>;

  const isNew = !content;

  return (
    <div className="max-w-4xl">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/content')}
            className="text-sm text-[#8b8b8b] hover:text-[#2d2a24] mb-2 block"
          >
            ← 返回内容列表
          </button>
          <h1 className="text-xl font-bold text-[#2d2a24]">
            {isNew ? '新建内容' : `编辑：${content?.title || '(无标题)'}`}
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 border border-[#e8e4de] rounded-xl text-sm
                       hover:bg-[#f8f5f0] disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '存为草稿'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-[#2d2a24] text-white rounded-xl text-sm
                       hover:bg-[#4a443c] disabled:opacity-50 transition-colors"
          >
            发布
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* 选择板块（新建时） */}
        {isNew && (
          <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
            <label className="block text-sm font-medium text-[#2d2a24] mb-2">所属板块</label>
            <select
              value={selectedSectionId}
              onChange={e => handleSectionChange(e.target.value)}
              className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
            >
              <option value="">请选择板块</option>
              {sections.filter(s => s.layout_type !== 'mixed').map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* 基本字段 */}
        <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
          <h2 className="text-base font-bold text-[#2d2a24] mb-4">基本内容</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">标题</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="内容标题"
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>

            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">正文（支持 Markdown）</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={8}
                placeholder="在这里写正文内容..."
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30 resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[#2d2a24] mb-1">标签（逗号分隔）</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="如: 旅行, 摄影, 日常"
                  className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
                />
              </div>

              <div className="flex items-center gap-6 pt-6">
                <label className="flex items-center gap-2 text-sm text-[#2d2a24]">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={e => setIsVisible(e.target.checked)}
                    className="rounded border-[#e8e4de]"
                  />
                  前台可见
                </label>

                <label className="flex items-center gap-2 text-sm text-[#2d2a24]">
                  <input
                    type="checkbox"
                    checked={status === 'published'}
                    onChange={e => setStatus(e.target.checked ? 'published' : 'draft')}
                    className="rounded border-[#e8e4de]"
                  />
                  已发布
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 动态字段（按板块配置生成） */}
        {section && section.field_schema && section.field_schema.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
            <h2 className="text-base font-bold text-[#2d2a24] mb-4">
              {section.name} 定制字段
            </h2>
            <DynamicForm
              fieldSchema={section.field_schema}
              values={fieldValues}
              onChange={setFieldValues}
            />
          </div>
        )}
      </div>
    </div>
  );
}
