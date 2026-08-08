'use client';

import { useState, useRef } from 'react';
import { CanvasNode, defaultCanvasNode } from '@/types/canvas';
import toast from 'react-hot-toast';

interface Props {
  node: CanvasNode;
  onUpdateContent: (id: string, patch: Record<string, any>) => void;
}

const COMPONENT_OPTIONS = [
  { type: 'text' as const, label: '文字', icon: '📝' },
  { type: 'image' as const, label: '图片', icon: '🖼️' },
  { type: 'quote' as const, label: '引用', icon: '💬' },
  { type: 'divider' as const, label: '分隔线', icon: '➖' },
  { type: 'photo-wall' as const, label: '照片墙', icon: '📷' },
  { type: 'gallery' as const, label: '图片组', icon: '🎨' },
  { type: 'tags' as const, label: '标签', icon: '🏷️' },
];

function moveNode(list: CanvasNode[], id: string, dir: -1 | 1): CanvasNode[] {
  const idx = list.findIndex(n => n.id === id);
  if (idx < 0) return list;
  const to = idx + dir;
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  [next[idx], next[to]] = [next[to], next[idx]];
  return next;
}

export default function MemoryCardInlineEditor({ node, onUpdateContent }: Props) {
  const c = node.content as any;
  const p = node.props || {};
  const canvasData: CanvasNode[] = c?.canvasData || [];

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const updateData = (newData: CanvasNode[]) => {
    onUpdateContent(node.id, { canvasData: newData });
  };

  const addNode = (type: any) => {
    const newNode = defaultCanvasNode(type);
    updateData([...canvasData, newNode]);
    setSelectedId(newNode.id);
    if (type === 'text' || type === 'quote') setEditingId(newNode.id);
    setShowToolbar(false);
  };

  const updateItemContent = (id: string, patch: Record<string, any>) => {
    updateData(canvasData.map(n => n.id === id ? { ...n, content: { ...(n.content || {}), ...patch } } : n));
  };

  const delNode = (id: string) => {
    updateData(canvasData.filter(n => n.id !== id));
    if (selectedId === id) setSelectedId(null);
    if (editingId === id) setEditingId(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !uploadTarget) return;
    const target = uploadTarget;
    const targetNode = canvasData.find(n => n.id === target);
    const targetType = targetNode?.type;
    try {
      if (targetType === 'photo-wall' || targetType === 'gallery') {
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
        const existing = (targetNode?.content as any)?.images || [];
        updateItemContent(target, { images: [...existing, ...uploaded] });
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
        updateItemContent(target, { src: data.url });
        toast.success('图片已上传');
      }
    } catch (err: any) { toast.error(err.message || '上传失败'); }
    finally { setUploadTarget(null); if (fileRef.current) fileRef.current.value = ''; }
  };

  return (
    <div style={{
      background: p.bgColor || '#f8f5f0',
      borderRadius: p.borderRadius || 12,
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Header bar with title and add button */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 10px', background: 'rgba(255,255,255,0.6)',
        borderBottom: '1px solid #e8e6e0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 14 }}>{c?.icon || '🎴'}</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#2d2a24' }}>{c?.title || '记忆卡片'}</span>
        </div>
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowToolbar(!showToolbar); }}
            style={{ fontSize: 11, padding: '2px 8px', background: '#2d2a24', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >+ 添加</button>
          {showToolbar && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, marginTop: 4,
              background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              padding: 6, display: 'flex', flexWrap: 'wrap', gap: 3, zIndex: 10,
              minWidth: 200,
            }}>
              {COMPONENT_OPTIONS.map(opt => (
                <button key={opt.type} onClick={(e) => { e.stopPropagation(); addNode(opt.type); }} style={{
                  fontSize: 11, padding: '4px 8px', background: '#f5f5f0', border: '1px solid #e8e4de',
                  borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  <span>{opt.icon}</span><span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content area */}
      <div style={{ padding: '8px 10px', maxHeight: 400, overflowY: 'auto' }}>
        {canvasData.length === 0 ? (
          <div
            onClick={(e) => { e.stopPropagation(); setShowToolbar(true); }}
            style={{ textAlign: 'center', color: '#b8b4ae', fontSize: 13, padding: '24px 0', cursor: 'pointer' }}
          >
            点击 "+ 添加" 按钮添加内容
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {canvasData.map((item, i) => (
              <div key={item.id} style={{ position: 'relative' }}>
                {/* Item toolbar */}
                <div style={{
                  display: 'flex', gap: 3, marginBottom: 2,
                  opacity: selectedId === item.id ? 1 : 0.4,
                }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedId(selectedId === item.id ? null : item.id); }}
                    style={{ fontSize: 9, padding: '1px 6px', background: selectedId === item.id ? '#2d2a24' : '#e8e4de', color: selectedId === item.id ? '#fff' : '#5a5349', border: 'none', borderRadius: 3, cursor: 'pointer' }}
                  >{selectedId === item.id ? '选中' : '选'}</button>
                  <button onClick={(e) => { e.stopPropagation(); updateData(moveNode(canvasData, item.id, -1)); }} disabled={i === 0} style={{ fontSize: 9, padding: '1px 4px', background: '#e8e4de', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: i === 0 ? 0.3 : 1 }}>↑</button>
                  <button onClick={(e) => { e.stopPropagation(); updateData(moveNode(canvasData, item.id, 1)); }} disabled={i === canvasData.length - 1} style={{ fontSize: 9, padding: '1px 4px', background: '#e8e4de', border: 'none', borderRadius: 3, cursor: 'pointer', opacity: i === canvasData.length - 1 ? 0.3 : 1 }}>↓</button>
                  <button onClick={(e) => { e.stopPropagation(); delNode(item.id); }} style={{ fontSize: 9, padding: '1px 4px', background: '#fee', color: '#c00', border: 'none', borderRadius: 3, cursor: 'pointer' }}>删</button>
                </div>
                {/* Item content */}
                <div
                  onClick={() => setSelectedId(item.id)}
                  style={{
                    background: '#fff', borderRadius: 6, padding: 8,
                    border: selectedId === item.id ? '2px solid #4a90e2' : '1px solid #e8e6e0',
                  }}
                >
                  <ItemRenderer
                    item={item}
                    editing={editingId === item.id}
                    onEdit={(html) => { updateItemContent(item.id, { html }); setEditingId(null); }}
                    onStartEdit={() => setEditingId(item.id)}
                    onUpload={() => { setUploadTarget(item.id); fileRef.current?.click(); }}
                    onUpdateContent={(patch) => updateItemContent(item.id, patch)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
    </div>
  );
}

function ItemRenderer({ item, editing, onEdit, onStartEdit, onUpload, onUpdateContent }: {
  item: CanvasNode;
  editing: boolean;
  onEdit: (html: string) => void;
  onStartEdit: () => void;
  onUpload: () => void;
  onUpdateContent: (patch: Record<string, any>) => void;
}) {
  const ic = item.content as any;
  const ip = item.props || {};

  if (item.type === 'text' || item.type === 'quote') {
    const isQuote = item.type === 'quote';
    if (editing) {
      return (
        <div
          contentEditable
          suppressContentEditableWarning
          autoFocus
          onBlur={(e) => onEdit(e.currentTarget.innerHTML)}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          dangerouslySetInnerHTML={{ __html: ic?.html || '' }}
          style={{
            outline: 'none', minHeight: 24, lineHeight: 1.6, fontSize: 13,
            borderLeft: isQuote ? '3px solid #d4a574' : undefined,
            paddingLeft: isQuote ? 10 : 0, background: isQuote ? '#f8f5f0' : undefined,
            padding: isQuote ? '6px 10px' : undefined, borderRadius: isQuote ? 4 : undefined,
          }}
        />
      );
    }
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onStartEdit(); }}
        style={{
          cursor: 'text', lineHeight: 1.6, fontSize: 13, color: '#5a5349',
          borderLeft: isQuote ? '3px solid #d4a574' : undefined,
          paddingLeft: isQuote ? 10 : 0, background: isQuote ? '#f8f5f0' : undefined,
          padding: isQuote ? '6px 10px' : undefined, borderRadius: isQuote ? 4 : undefined,
        }}
        dangerouslySetInnerHTML={{ __html: ic?.html || '双击编辑文字...' }}
      />
    );
  }

  if (item.type === 'image') {
    if (ic?.src) {
      return (
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <img src={ic.src} alt="" style={{ width: '100%', borderRadius: 6 }} />
          <button
            onClick={(e) => { e.stopPropagation(); onUpload(); }}
            style={{ position: 'absolute', top: 4, right: 4, padding: '2px 8px', fontSize: 10, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
          >更换</button>
        </div>
      );
    }
    return (
      <div onClick={(e) => { e.stopPropagation(); onUpload(); }} style={{ padding: '16px', textAlign: 'center', color: '#b8b4ae', fontSize: 12, background: '#f5f5f0', borderRadius: 6, cursor: 'pointer', border: '2px dashed #d4a574' }}>
        点击上传图片
      </div>
    );
  }

  if (item.type === 'divider') {
    return <hr style={{ border: 'none', borderTop: `${ip.lineWidth || 1}px solid ${ip.lineColor || '#e8e6e0'}` }} />;
  }

  if (item.type === 'photo-wall') {
    const imgs = ic?.images || [];
    if (imgs.length === 0) {
      return (
        <div onClick={(e) => { e.stopPropagation(); onUpload(); }} style={{ padding: '16px', textAlign: 'center', color: '#b8b4ae', fontSize: 12, background: '#f5f5f0', borderRadius: 6, cursor: 'pointer', border: '2px dashed #d4a574' }}>
          📷 点击上传照片（支持多选）
        </div>
      );
    }
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <div style={{ columnCount: ic?.columns || 3, columnGap: (ic?.gap || 8) + 'px' }}>
          {imgs.map((img: any, i: number) => (
            <div key={i} style={{ breakInside: 'avoid', marginBottom: (ic?.gap || 8) + 'px', borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
              <img src={img.src || img} alt="" style={{ width: '100%', display: 'block' }} />
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateContent({ images: imgs.filter((_: any, idx: number) => idx !== i) }); }}
                style={{ position: 'absolute', top: 3, right: 3, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, flexWrap: 'wrap', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 9, color: '#b8b4ae' }}>{imgs.length} 张</span>
            <label style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#8b8b8b' }}>
              列:
              <select value={ic?.columns || 3} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdateContent({ columns: parseInt(e.target.value) })} style={{ fontSize: 9, padding: '0 2px', border: '1px solid #d4a574', borderRadius: 3, background: '#fff' }}>
                <option value={2}>2</option><option value={3}>3</option><option value={4}>4</option><option value={5}>5</option>
              </select>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 9, color: '#8b8b8b' }}>
              距:
              <input type="number" value={ic?.gap ?? 8} onClick={(e) => e.stopPropagation()} onChange={(e) => onUpdateContent({ gap: parseInt(e.target.value) || 8 })} style={{ fontSize: 9, width: 28, padding: '0 2px', border: '1px solid #d4a574', borderRadius: 3 }} />
            </label>
          </div>
          <button onClick={(e) => { e.stopPropagation(); onUpload(); }} style={{ fontSize: 10, padding: '2px 8px', background: '#f0ede5', color: '#5a5349', border: '1px solid #d4a574', borderRadius: 4, cursor: 'pointer' }}>+ 添加</button>
        </div>
      </div>
    );
  }

  if (item.type === 'gallery') {
    const imgs = ic?.images || [];
    const cols = ic?.columns || 3;
    if (imgs.length === 0) {
      return (
        <div onClick={(e) => { e.stopPropagation(); onUpload(); }} style={{ padding: '16px', textAlign: 'center', color: '#b8b4ae', fontSize: 12, background: '#f5f5f0', borderRadius: 6, cursor: 'pointer', border: '2px dashed #d4a574' }}>
          🎨 点击上传图片（支持多选）
        </div>
      );
    }
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: ic?.gap ?? 8 }}>
          {imgs.map((img: any, i: number) => (
            <div key={i} style={{ background: '#f5f5f0', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
              <img src={img.src || img} alt="" style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} />
              <button
                onClick={(e) => { e.stopPropagation(); onUpdateContent({ images: imgs.filter((_: any, idx: number) => idx !== i) }); }}
                style={{ position: 'absolute', top: 3, right: 3, width: 18, height: 18, borderRadius: '50%', background: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none', fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontSize: 9, color: '#b8b4ae' }}>{imgs.length} 张</span>
          <button onClick={(e) => { e.stopPropagation(); onUpload(); }} style={{ fontSize: 10, padding: '2px 8px', background: '#f0ede5', color: '#5a5349', border: '1px solid #d4a574', borderRadius: 4, cursor: 'pointer' }}>+ 添加</button>
        </div>
      </div>
    );
  }

  if (item.type === 'tags') {
    const tags = ic?.tags || [];
    const color = ic?.color || '#4a90e2';
    return (
      <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {tags.map((tag: string, i: number) => (
          <span key={i} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: color + '15', color, border: `1px solid ${color}30` }}>{tag}</span>
        ))}
        {tags.length === 0 && <span style={{ fontSize: 11, color: '#b8b4ae' }}>标签为空</span>}
      </div>
    );
  }

  return <div style={{ padding: 8, color: '#b8b4ae', fontSize: 11 }}>{item.type}</div>;
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
