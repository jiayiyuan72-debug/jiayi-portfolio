'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Toaster, toast } from 'react-hot-toast';
import { Section, LayoutType, FieldDefinition, FieldType, StyleConfig } from '@/types/section';
import { LAYOUT_LABELS } from '@/lib/constants';

const FIELD_TYPE_OPTIONS: { value: FieldType; label: string }[] = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'date', label: '日期' },
  { value: 'image', label: '图片' },
  { value: 'file', label: '文件' },
  { value: 'select', label: '下拉选择' },
  { value: 'rich_text', label: '富文本' },
  { value: 'boolean', label: '开关' },
];

export default function AdminSectionDesignPage() {
  const params = useParams();
  const router = useRouter();
  const [section, setSection] = useState<Section | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 编辑中的字段
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [style, setStyle] = useState<StyleConfig>({});
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [layoutType, setLayoutType] = useState<LayoutType>('card');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');

  useEffect(() => {
    fetchSection();
  }, []);

  const fetchSection = async () => {
    try {
      const res = await fetch(`/api/sections/${params.id}`);
      const { data }: { data: Section } = await res.json();

      setSection(data);
      setName(data.name);
      setSlug(data.slug);
      setLayoutType(data.layout_type);
      setFields(data.field_schema || []);
      setStyle(data.style_config || {});
      setMetaTitle(data.meta_title || '');
      setMetaDesc(data.meta_description || '');
    } catch {
      toast.error('加载板块失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('请输入板块名称'); return; }
    if (!slug.trim()) { toast.error('请输入板块标识'); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/sections/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          layout_type: layoutType,
          field_schema: fields,
          style_config: style,
          meta_title: metaTitle,
          meta_description: metaDesc,
          is_visible: section?.is_visible ?? true,
          sort_order: section?.sort_order ?? 0,
        }),
      });

      if (!res.ok) throw new Error();
      toast.success('保存成功');
    } catch {
      toast.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const addField = () => {
    setFields(prev => [
      ...prev,
      { key: '', label: '', type: 'text', required: false },
    ]);
  };

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    setFields(prev => prev.map((f, i) => i === index ? { ...f, ...updates } : f));
  };

  const removeField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const moveField = (index: number, direction: 'up' | 'down') => {
    const newFields = [...fields];
    const target = index + (direction === 'up' ? -1 : 1);
    if (target < 0 || target >= newFields.length) return;
    [newFields[index], newFields[target]] = [newFields[target], newFields[index]];
    setFields(newFields);
  };

  if (loading) return <div className="animate-pulse text-[#d4a574]">加载中...</div>;
  if (!section) return <div className="text-[#8b8b8b]">板块不存在</div>;

  return (
    <div className="max-w-4xl">
      <Toaster position="top-center" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <button
            onClick={() => router.push('/admin/sections')}
            className="text-sm text-[#8b8b8b] hover:text-[#2d2a24] mb-2 block"
          >
            ← 返回板块列表
          </button>
          <h1 className="text-xl font-bold text-[#2d2a24]">设计板块：{section.name}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-[#2d2a24] text-white rounded-xl text-sm
                     hover:bg-[#4a443c] disabled:opacity-50 transition-colors"
        >
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <div className="space-y-8">
        {/* 基本信息 */}
        <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
          <h2 className="text-base font-bold text-[#2d2a24] mb-4">基本信息</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">板块名称</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">板块标识 (slug)</label>
              <input
                type="text"
                value={slug}
                onChange={e => setSlug(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">布局类型</label>
              <select
                value={layoutType}
                onChange={e => setLayoutType(e.target.value as LayoutType)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              >
                {Object.entries(LAYOUT_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">SEO 标题</label>
              <input
                type="text"
                value={metaTitle}
                onChange={e => setMetaTitle(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-[#2d2a24] mb-1">SEO 描述</label>
              <input
                type="text"
                value={metaDesc}
                onChange={e => setMetaDesc(e.target.value)}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
          </div>
        </div>

        {/* 字段设计 */}
        <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#2d2a24]">字段设计</h2>
            <button
              onClick={addField}
              className="px-3 py-1.5 text-xs border border-[#e8e4de] rounded-lg
                         hover:bg-[#f8f5f0] transition-colors"
            >
              + 添加字段
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-[#f8f5f0] rounded-lg"
              >
                <div className="flex flex-col gap-1 pt-1">
                  <button
                    onClick={() => moveField(index, 'up')}
                    disabled={index === 0}
                    className="text-[#b8b4ae] hover:text-[#2d2a24] disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveField(index, 'down')}
                    disabled={index === fields.length - 1}
                    className="text-[#b8b4ae] hover:text-[#2d2a24] disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={field.key}
                    onChange={e => updateField(index, { key: e.target.value })}
                    placeholder="字段 key"
                    className="px-2 py-1.5 border border-[#e8e4de] rounded text-xs
                               focus:outline-none focus:ring-1 focus:ring-[#d4a574]/30"
                  />
                  <input
                    type="text"
                    value={field.label}
                    onChange={e => updateField(index, { label: e.target.value })}
                    placeholder="显示名称"
                    className="px-2 py-1.5 border border-[#e8e4de] rounded text-xs
                               focus:outline-none focus:ring-1 focus:ring-[#d4a574]/30"
                  />
                  <select
                    value={field.type}
                    onChange={e => updateField(index, { type: e.target.value as FieldType })}
                    className="px-2 py-1.5 border border-[#e8e4de] rounded text-xs
                               focus:outline-none focus:ring-1 focus:ring-[#d4a574]/30"
                  >
                    {FIELD_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs text-[#8b8b8b]">
                      <input
                        type="checkbox"
                        checked={field.required || false}
                        onChange={e => updateField(index, { required: e.target.checked })}
                      />
                      必填
                    </label>
                    <button
                      onClick={() => removeField(index)}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {fields.length === 0 && (
              <p className="text-sm text-[#b8b4ae]">暂未添加字段。点击上方按钮添加。</p>
            )}
          </div>
        </div>

        {/* 样式配置 */}
        <div className="bg-white rounded-xl p-6 border border-[#e8e4de]">
          <h2 className="text-base font-bold text-[#2d2a24] mb-4">样式配置</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">背景颜色</label>
              <input
                type="color"
                value={style.bg_color || '#ffffff'}
                onChange={e => setStyle(prev => ({ ...prev, bg_color: e.target.value }))}
                className="w-full h-10 rounded-lg border border-[#e8e4de] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">文字颜色</label>
              <input
                type="color"
                value={style.text_color || '#2d2a24'}
                onChange={e => setStyle(prev => ({ ...prev, text_color: e.target.value }))}
                className="w-full h-10 rounded-lg border border-[#e8e4de] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">强调色</label>
              <input
                type="color"
                value={style.accent_color || '#d4a574'}
                onChange={e => setStyle(prev => ({ ...prev, accent_color: e.target.value }))}
                className="w-full h-10 rounded-lg border border-[#e8e4de] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">列数</label>
              <input
                type="number"
                value={style.columns || 1}
                onChange={e => setStyle(prev => ({ ...prev, columns: parseInt(e.target.value) || 1 }))}
                min={1}
                max={4}
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">最大宽度</label>
              <input
                type="text"
                value={style.max_width || ''}
                onChange={e => setStyle(prev => ({ ...prev, max_width: e.target.value }))}
                placeholder="如 720px 或 100%"
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">间距</label>
              <input
                type="text"
                value={style.gap || ''}
                onChange={e => setStyle(prev => ({ ...prev, gap: e.target.value }))}
                placeholder="如 24px"
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
            <div>
              <label className="block text-sm text-[#2d2a24] mb-1">内边距</label>
              <input
                type="text"
                value={style.padding || ''}
                onChange={e => setStyle(prev => ({ ...prev, padding: e.target.value }))}
                placeholder="如 48px 24px"
                className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
