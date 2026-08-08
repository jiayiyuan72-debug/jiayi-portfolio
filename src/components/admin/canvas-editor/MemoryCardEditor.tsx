'use client';

import { useState, useRef } from 'react';
import { CanvasNode, defaultCanvasNode } from '@/types/canvas';
import toast from 'react-hot-toast';

interface Props {
  title: string;
  icon: string;
  canvasData: CanvasNode[];
  onChange: (data: CanvasNode[]) => void;
  onClose: () => void;
}

const COMPONENT_OPTIONS = [
  { type: 'text' as const, label: '文字', icon: '📝' },
  { type: 'image' as const, label: '图片', icon: '🖼️' },
  { type: 'quote' as const, label: '引用', icon: '💬' },
  { type: 'divider' as const, label: '分隔线', icon: '➖' },
  { type: 'timeline' as const, label: '时间轴', icon: '📅' },
  { type: 'photo-wall' as const, label: '照片墙', icon: '🖼️' },
  { type: 'gallery' as const, label: '图片组', icon: '🎨' },
  { type: 'stats' as const, label: '统计数字', icon: '🔢' },
  { type: 'tags' as const, label: '标签', icon: '🏷️' },
];

function removeNode(list: CanvasNode[], id: string): CanvasNode[] {
  return list.filter(n => n.id !== id);
}
function moveNode(list: CanvasNode[], id: string, dir: -1 | 1): CanvasNode[] {
  const idx = list.findIndex(n => n.id === id);
  if (idx < 0) return list;
  const to = idx + dir;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[idx], next[to]] = [next[to], next[idx]];
  return next;
}

export default function MemoryCardEditor({ title, icon, canvasData, onChange, onClose }: Props) {
  const [nodes, setNodes] = useState<CanvasNode[]>(() => JSON.parse(JSON.stringify(canvasData || [])));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const update = (next: CanvasNode[]) => { setNodes(next); onChange(next); };

  const addNode = (type: any) => {
    const node = defaultCanvasNode(type);
    update([...nodes, node]);
    setSelectedId(node.id);
    if (type === 'text' || type === 'quote') setEditingId(node.id);
  };

  const updateContent = (id: string, patch: Record<string, any>) => {
    update(nodes.map(n => n.id === id ? { ...n, content: { ...(n.content || {}), ...patch } } : n));
  };

  const del = (id: string) => {
    update(removeNode(nodes, id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !uploadTarget) return;
    const target = uploadTarget;
    try {
      if (nodes.find(n => n.id === target)?.type === 'photo-wall') {
        const uploaded: { src: string; caption: string }[] = [];
        for (const file of files) {
          let blob: Blob = file;
          if (file.size > 1.5 * 1024 * 1024) {
            const b = await compressFile(file);
            if (b && b.size > 0 && b.size < file.size) blob = b;
          }
          const fd = new FormData(); fd.append('file', blob, blob === file ? file.name : 'image.jpg');
          const res = await fetch('/api/upload', { method: 'POST', body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || '上传失败');
          uploaded.push({ src: data.url, caption: '' });
        }
        const node = nodes.find(n => n.id === target);
        const existing = (node?.content as any)?.images || [];
        updateContent(target, { images: [...existing, ...uploaded] });
        toast.success(`上传了 ${uploaded.length} 张照片`);
      } else {
        const file = files[0];
        let blob: Blob = file;
        if (file.size > 1.5 * 1024 * 1024) {
          const b = await compressFile(file);
          if (b && b.size > 0 && b.size < file.size) blob = b;
        }
        const fd = new FormData(); fd.append('file', blob, blob === file ? file.name : 'image.jpg');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '上传失败');
        updateContent(target, { src: data.url });
        toast.success('图片已上传');
      }
    } catch (err: any) { toast.error(err.message || '上传失败'); }
    finally { setUploadTarget(null); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 900, maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #f0ede5', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 22 }}>{icon}</span>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#2d2a24' }}>{title} - 内容编辑</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={onClose} style={{ padding: '6px 16px', fontSize: 13, background: '#2d2a24', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>完成</button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '10px 20px', borderBottom: '1px solid #f0ede5', background: '#faf9f6', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#8b8b8b', marginRight: 4, lineHeight: '28px' }}>添加组件:</span>
          {COMPONENT_OPTIONS.map(opt => (
            <button key={opt.type} onClick={() => addNode(opt.type)} style={{ padding: '4px 10px', fontSize: 12, background: '#fff', border: '1px solid #e8e4de', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }} className="hover:bg-[#f0ede5]">
              <span>{opt.icon}</span><span>{opt.label}</span>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, background: '#f5f5f0' }}>
          {nodes.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#b8b4ae', padding: '60px 0', fontSize: 14 }}>
              点击上方按钮添加内容组件
            </div>
          ) : (
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {nodes.map((node, i) => (
                <div key={node.id} style={{ position: 'relative', marginBottom: 12 }}>
                  {/* Node toolbar */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4, opacity: selectedId === node.id ? 1 : 0.5 }}>
                    <button onClick={() => setSelectedId(selectedId === node.id ? null : node.id)} style={{ fontSize: 10, padding: '2px 8px', background: selectedId === node.id ? '#2d2a24' : '#e8e4de', color: selectedId === node.id ? '#fff' : '#5a5349', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                      {selectedId === node.id ? '选中' : '选择'}
                    </button>
                    <button onClick={() => update(moveNode(nodes, node.id, -1))} disabled={i === 0} style={{ fontSize: 10, padding: '2px 6px', background: '#e8e4de', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: i === 0 ? 0.3 : 1 }}>{'\u2191'}</button>
                    <button onClick={() => update(moveNode(nodes, node.id, 1))} disabled={i === nodes.length - 1} style={{ fontSize: 10, padding: '2px 6px', background: '#e8e4de', border: 'none', borderRadius: 4, cursor: 'pointer', opacity: i === nodes.length - 1 ? 0.3 : 1 }}>{'\u2193'}</button>
                    <button onClick={() => del(node.id)} style={{ fontSize: 10, padding: '2px 6px', background: '#fee', color: '#c00', border: 'none', borderRadius: 4, cursor: 'pointer' }}>删除</button>
                  </div>

                  {/* Node content */}
                  <div
                    onClick={() => setSelectedId(node.id)}
                    style={{
                      background: '#fff', borderRadius: 8, padding: 12,
                      border: selectedId === node.id ? '2px solid #4a90e2' : '1px solid #e8e6e0',
                      cursor: 'pointer',
                    }}
                  >
                    <NodeEditor node={node} editing={editingId === node.id} onEdit={(html) => { updateContent(node.id, { html }); setEditingId(null); }} onStartEdit={() => setEditingId(node.id)} onUpload={() => { setUploadTarget(node.id); fileRef.current?.click(); }} onUpdateContent={(patch) => updateContent(node.id, patch)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
    </div>
  );
}

function NodeEditor({ node, editing, onEdit, onStartEdit, onUpload, onUpdateContent }: {
  node: CanvasNode;
  editing: boolean;
  onEdit: (html: string) => void;
  onStartEdit: () => void;
  onUpload: () => void;
  onUpdateContent: (patch: Record<string, any>) => void;
}) {
  const p = node.props || {};
  const c = node.content as any;

  if (node.type === 'text' || node.type === 'quote') {
    const isQuote = node.type === 'quote';
    if (editing) {
      return (
        <div
          contentEditable
          suppressContentEditableWarning
          autoFocus
          onBlur={(e) => onEdit(e.currentTarget.innerHTML)}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          dangerouslySetInnerHTML={{ __html: c?.html || '' }}
          style={{
            outline: 'none', minHeight: 30, lineHeight: 1.7, fontSize: 14,
            border: isQuote ? 'none' : 'none', borderLeft: isQuote ? '4px solid #d4a574' : undefined,
            paddingLeft: isQuote ? 12 : 0, background: isQuote ? '#f8f5f0' : undefined,
            padding: isQuote ? '8px 12px' : undefined, borderRadius: isQuote ? 4 : undefined,
          }}
        />
      );
    }
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
        style={{
          cursor: 'text', lineHeight: 1.7, fontSize: 14, color: '#5a5349',
          borderLeft: isQuote ? '4px solid #d4a574' : undefined,
          paddingLeft: isQuote ? 12 : 0, background: isQuote ? '#f8f5f0' : undefined,
          padding: isQuote ? '8px 12px' : undefined, borderRadius: isQuote ? 4 : undefined,
        }}
        dangerouslySetInnerHTML={{ __html: c?.html || '点击编辑文字' }}
      />
    );
  }

  if (node.type === 'image') {
    if (c?.src) {
      return <img src={c.src} alt={c.alt || ''} style={{ width: '100%', borderRadius: 8 }} />;
    }
    return <div onClick={(e) => { e.stopPropagation(); onUpload(); }} style={{ padding: '20px', textAlign: 'center', color: '#b8b4ae', fontSize: 13, background: '#f5f5f0', borderRadius: 8, cursor: 'pointer' }}>点击上传图片</div>;
  }

  if (node.type === 'divider') {
    return <hr style={{ border: 'none', borderTop: `${p.lineWidth || 1}px solid ${p.lineColor || '#e8e6e0'}` }} />;
  }

  if (node.type === 'spacer') {
    return <div style={{ height: p.height || '24px' }} />;
  }

  if (node.type === 'timeline') {
    const items = c?.items || [];
    return (
      <div style={{ position: 'relative', paddingLeft: 24 }}>
        <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: '#d4a574' }} />
        {items.map((item: any, i: number) => (
          <div key={i} style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{ position: 'absolute', left: -20, top: 4, width: 14, height: 14, borderRadius: '50%', background: '#d4a574', border: '2px solid #fff', boxShadow: '0 0 0 2px #d4a574' }} />
            <div style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #f0ede5' }}>
              <div style={{ fontSize: 12, color: '#d4a574', fontWeight: 600, marginBottom: 2 }}>{item.icon} {item.date}</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#2d2a24', marginBottom: 2 }}>{item.title}</div>
              <div style={{ fontSize: 13, color: '#5a5349' }}>{item.description}</div>
            </div>
          </div>
        ))}
        {items.length === 0 && <div style={{ fontSize: 12, color: '#b8b4ae', padding: '12px 0' }}>时间轴为空</div>}
      </div>
    );
  }

  if (node.type === 'photo-wall') {
    const imgs = c?.images || [];
    if (imgs.length === 0) {
      return <div onClick={(e) => { e.stopPropagation(); onUpload(); }} style={{ padding: '20px', textAlign: 'center', color: '#b8b4ae', fontSize: 13, background: '#f5f5f0', borderRadius: 8, cursor: 'pointer', border: '2px dashed #d4a574' }}>点击上传照片（支持多选）</div>;
    }
    return (
      <div>
        <div style={{ columnCount: c?.columns || 3, columnGap: (c?.gap || 8) + 'px' }}>
          {imgs.map((img: any, i: number) => (
            <div key={i} style={{ breakInside: 'avoid', marginBottom: (c?.gap || 8) + 'px', borderRadius: 8, overflow: 'hidden' }}>
              <img src={img.src || img} alt="" style={{ width: '100%', display: 'block' }} />
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#b8b4ae', textAlign: 'center', marginTop: 4 }}>{imgs.length} 张照片</div>
      </div>
    );
  }

  if (node.type === 'gallery') {
    const imgs = c?.images || [];
    const cols = c?.columns || 3;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: c?.gap ?? 8 }}>
        {imgs.map((img: any, i: number) => (
          <div key={i} style={{ background: '#f5f5f0', borderRadius: 4, overflow: 'hidden' }}>
            <img src={img.src || img} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
          </div>
        ))}
        {imgs.length === 0 && <div style={{ gridColumn: `1/${cols+1}`, padding: 20, textAlign: 'center', color: '#b8b4ae', fontSize: 12 }}>图片组为空</div>}
      </div>
    );
  }

  if (node.type === 'stats') {
    const stats = c?.stats || [];
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-around' }}>
        {stats.map((s: any, i: number) => (
          <div key={i} style={{ textAlign: 'center', flex: '1 1 100px', minWidth: 100 }}>
            <div style={{ fontSize: 24, marginBottom: 2 }}>{s.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#2d2a24' }}>{s.value}{s.suffix}</div>
            <div style={{ fontSize: 11, color: '#8b8b8b' }}>{s.label}</div>
          </div>
        ))}
      </div>
    );
  }

  if (node.type === 'tags') {
    const tags = c?.tags || [];
    const color = c?.color || '#4a90e2';
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {tags.map((tag: string, i: number) => (
          <span key={i} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: color + '15', color, border: `1px solid ${color}30` }}>{tag}</span>
        ))}
      </div>
    );
  }

  return <div style={{ padding: 12, color: '#b8b4ae', fontSize: 12 }}>{node.type} 组件</div>;
}

async function compressFile(file: File): Promise<Blob | null> {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
    const MAX = 1920;
    let w = img.width, h = img.height;
    if (w > MAX) { h = h * MAX / w; w = MAX; }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((res) => canvas.toBlob(b => res(b!), 'image/jpeg', 0.82));
  } catch { return null; }
}
