'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { Section, ContentItem, Block } from '@/types';
import BlockEditor from '@/components/admin/block-editor/BlockEditor';

interface Props {
  section: Section;
  contentItems: ContentItem[];
  onCreate: (data: Partial<ContentItem>) => Promise<string | null>;
  onSave: (id: string, data: Partial<ContentItem>) => Promise<boolean>;
  onDelete: (id: string) => void;
}

type EditMode = 'classic' | 'block';

interface EditForm {
  title: string;
  body: string;
  tags: string;
  fields: Record<string, any>;
  mode: EditMode;
  blocks: Block[];
}

export default function ArticleSectionEditor({ section, contentItems, onCreate, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    title: '', body: '', tags: '', fields: {}, mode: 'classic', blocks: [],
  });

  const sortedItems = [...contentItems].sort((a, b) => {
    const dateA = a.published_at || a.created_at;
    const dateB = b.published_at || b.created_at;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  const currentBlocks = (editForm.fields?.blocks as Block[]) || editForm.blocks || [];

  const handleEdit = (item: ContentItem) => {
    const fields = item.fields || {};
    // 已有块数据 => 块编辑模式；否则经典模式，进入块模式时再把 body 转文本块
    const hasBlocks = Array.isArray(fields.blocks) && fields.blocks.length > 0;
    setEditingId(item.id);
    setEditForm({
      title: item.title,
      body: item.body || '',
      fields: { ...fields },
      tags: (item.tags || []).join(', '),
      mode: fields.useBlockEditor || hasBlocks ? 'block' : 'classic',
      blocks: hasBlocks ? fields.blocks : [],
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    const fields = { ...editForm.fields };
    // 按当前模式决定保存到 blocks 还是 body
    if (editForm.mode === 'block') {
      const blocks = currentBlocks;
      if (blocks.length > 0) {
        fields.blocks = blocks;
        fields.useBlockEditor = true;
        // 同步把文本摘要（可选）写进 body 供列表/经典回退
      } else {
        delete fields.blocks;
        delete fields.useBlockEditor;
      }
    } else {
      delete fields.blocks;
      delete fields.useBlockEditor;
    }

    const success = await onSave(editingId, {
      title: editForm.title,
      body: editForm.body,
      fields,
      tags: editForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean),
    });
    if (success) {
      setEditingId(null);
      toast.success('已保存');
    }
  };

  // 经典 -> 块编辑：若 blocks 为空且 body 有内容，自动转成一个文本块
  const switchToBlock = () => {
    const hasBlocks = currentBlocks.length > 0;
    if (!hasBlocks && editForm.body.trim()) {
      const textBlock: Block = {
        id: crypto.randomUUID(),
        type: 'text',
        props: { content: editForm.body.trim(), align: 'left', fontSize: 'md' },
      };
      setEditForm(prev => ({
        ...prev,
        mode: 'block',
        blocks: [textBlock],
      }));
    } else {
      setEditForm(prev => ({ ...prev, mode: 'block' }));
    }
  };

  // 块编辑 -> 经典：把文本块合并回 body（提示部分块可能丢失）
  const switchToClassic = () => {
    const textParts = currentBlocks
      .filter(b => b.type === 'text' || b.type === 'heading')
      .map(b => (b.props.content || '').trim())
      .filter(Boolean);
    const mergedBody = textParts.join('\n\n');
    setEditForm(prev => ({
      ...prev,
      mode: 'classic',
      body: mergedBody || prev.body,
    }));
    if (currentBlocks.some(b => b.type !== 'text' && b.type !== 'heading')) {
      toast('部分非文本块已移除（仅保留文本合并到正文）', { duration: 3000 });
    }
  };

  const handleModeToggle = (mode: EditMode) => {
    if (mode === editForm.mode) return;
    if (mode === 'block') switchToBlock();
    else switchToClassic();
  };

  const handleAdd = async () => {
    const id = await onCreate({
      section_id: section.id,
      title: '新文章',
      fields: { excerpt: '', read_time: 5, cover_image: '' },
      body: '在这里写文章内容...',
      tags: [],
      sort_order: 0,
      published_at: new Date().toISOString(),
    });
    if (id) {
      const newItem: ContentItem = {
        id, section_id: section.id, title: '新文章', content_type: 'article',
        fields: { excerpt: '', read_time: 5, cover_image: '' },
        body: '在这里写文章内容...', media_urls: [], file_urls: [], tags: [],
        sort_order: 0, is_visible: true, status: 'draft', published_at: null,
        meta_title: '', meta_description: '', created_at: '', updated_at: '',
      };
      handleEdit(newItem);
    }
  };

  const setBlocks = (blocks: Block[]) => {
    setEditForm(prev => ({ ...prev, blocks }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#8b8b8b]">{contentItems.length} 篇文章</p>
        <button onClick={handleAdd} className="px-4 py-1.5 text-sm bg-[#2d2a24] text-white rounded-lg hover:bg-[#4a443c]">+ 写新文章</button>
      </div>

      <div className="space-y-3">
        {sortedItems.map(item => {
          const fields = item.fields || {};
          const isEditing = editingId === item.id;

          if (isEditing) {
            return (
              <div key={item.id} className="bg-white rounded-xl p-5 border-2 border-[#d4a574] shadow-sm">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">文章标题</label>
                    <input type="text" value={editForm.title}
                      onChange={e => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">摘要</label>
                    <textarea value={editForm.fields?.excerpt || ''}
                      onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, excerpt: e.target.value } }))}
                      rows={2} maxLength={300} className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">阅读时间（分钟）</label>
                      <input type="number" value={editForm.fields?.read_time || 5}
                        onChange={e => setEditForm(prev => ({ ...prev, fields: { ...prev.fields, read_time: parseInt(e.target.value) || 5 } }))}
                        className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">标签（逗号分隔）</label>
                      <input type="text" value={editForm.tags || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, tags: e.target.value }))}
                        placeholder="如: 设计, 思考" className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm" />
                    </div>
                  </div>

                  {/* 模式切换 */}
                  <div>
                    <label className="block text-xs text-[#8b8b8b] mb-1">正文编辑模式</label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleModeToggle('classic')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          editForm.mode === 'classic' ? 'bg-[#2d2a24] text-white' : 'bg-[#f8f5f0] text-[#5a5349]'
                        }`}
                      >
                        经典模式
                      </button>
                      <button
                        onClick={() => handleModeToggle('block')}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          editForm.mode === 'block' ? 'bg-[#d4a574] text-white' : 'bg-[#f8f5f0] text-[#5a5349]'
                        }`}
                      >
                        ✨ 块编辑模式
                      </button>
                      <span className="text-xs text-[#b8b4ae]">块编辑支持图文混排</span>
                    </div>
                  </div>

                  {/* 经典模式：纯文本正文 */}
                  {editForm.mode === 'classic' && (
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">正文</label>
                      <textarea value={editForm.body || ''}
                        onChange={e => setEditForm(prev => ({ ...prev, body: e.target.value }))}
                        rows={10} className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y" />
                    </div>
                  )}

                  {/* 块编辑模式：可视化块编辑器 */}
                  {editForm.mode === 'block' && (
                    <div>
                      <label className="block text-xs text-[#8b8b8b] mb-1">正文（块编辑）</label>
                      <BlockEditor blocks={currentBlocks} onChange={setBlocks} />
                    </div>
                  )}

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
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-[#2d2a24]">{item.title}</h3>
                    {item.fields?.useBlockEditor && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#d4a574]/20 text-[#d4a574] rounded">块编辑</span>
                    )}
                  </div>
                  {fields.excerpt && <p className="text-sm text-[#5a5349] mt-1 line-clamp-2">{fields.excerpt}</p>}
                  <div className="flex items-center gap-3 mt-2 text-xs text-[#8b8b8b]">
                    {item.published_at && <span>{new Date(item.published_at).toLocaleDateString('zh-CN')}</span>}
                    {fields.read_time && <span>{fields.read_time} 分钟阅读</span>}
                    {item.tags && item.tags.length > 0 && <span>🏷️ {item.tags.slice(0, 3).join(', ')}</span>}
                  </div>
                </div>
                <span className="text-xs text-[#b8b4ae]">编辑</span>
              </div>
            </div>
          );
        })}

        {sortedItems.length === 0 && (
          <div className="text-center py-12 text-[#b8b4ae] bg-white rounded-xl border border-[#e8e4de]">
            暂无文章，点击「写新文章」添加
          </div>
        )}
      </div>
    </div>
  );
}
