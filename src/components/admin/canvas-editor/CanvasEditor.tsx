'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CanvasNode, CanvasType, defaultCanvasNode } from '@/types/canvas';
import ComponentPalette from './ComponentPalette';
import CanvasNodeEditor from './CanvasNodeEditor';
import PropertyPanel from './PropertyPanel';

interface Props {
  trees: CanvasNode[];
  onSave: (trees: CanvasNode[]) => void;
  onExit: () => void;
}

const MAX_HISTORY = 50;

// ---- 纯树工具（不可变更新）----
function mapTree(list: CanvasNode[], fn: (n: CanvasNode) => CanvasNode): CanvasNode[] {
  return list.map(n => ({ ...fn(n), children: mapTree(n.children, fn) }));
}
function findNode(list: CanvasNode[], id: string): CanvasNode | null {
  for (const n of list) { if (n.id === id) return n; const f = findNode(n.children, id); if (f) return f; }
  return null;
}
function findParent(list: CanvasNode[], id: string): CanvasNode[] | null {
  if (list.some(n => n.id === id)) return list;
  for (const n of list) {
    const f = findParent(n.children, id);
    if (f) return f;
  }
  return null;
}
function removeNode(list: CanvasNode[], id: string): CanvasNode[] {
  return list.filter(n => n.id !== id).map(n => ({ ...n, children: removeNode(n.children, id) }));
}

/** 画布编辑器：三栏 + 树状态 + 拖放 + 选中/编辑 + 撤销重做 + 预览/设备 + 保存 */
export default function CanvasEditor({ trees: initialTrees, onSave, onExit }: Props) {
  const [trees, setTrees] = useState<CanvasNode[]>(() => JSON.parse(JSON.stringify(initialTrees || [])));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [mobile, setMobile] = useState(false);
  const pastRef = useRef<CanvasNode[][]>([]);
  const futureRef = useRef<CanvasNode[][]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const setTree = useCallback((next: CanvasNode[], record = true) => {
    if (record) { pastRef.current = [...pastRef.current, trees].slice(-MAX_HISTORY); futureRef.current = []; setDirty(true); }
    setTrees(next);
  }, [trees]);

  const undo = () => {
    if (!pastRef.current.length) return;
    futureRef.current = [trees, ...futureRef.current].slice(0, MAX_HISTORY);
    setTrees(pastRef.current[pastRef.current.length - 1]);
    pastRef.current = pastRef.current.slice(0, -1);
    setSelectedId(null); setEditingId(null);
  };
  const redo = () => {
    if (!futureRef.current.length) return;
    pastRef.current = [...pastRef.current, trees].slice(-MAX_HISTORY);
    setTrees(futureRef.current[0]);
    futureRef.current = futureRef.current.slice(1);
    setSelectedId(null); setEditingId(null);
  };

  // ---- 拖放创建：优先指针式（可靠），HTML5 作兜底 ----
  const dragTypeRef = useRef<CanvasType | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerStart = (type: CanvasType) => (e: React.PointerEvent) => {
    e.preventDefault();
    dragTypeRef.current = type;
    startPointRef.current = { x: e.clientX, y: e.clientY };
    const move = (ev: PointerEvent) => {
      // 跟踪，可加 ghost 指示（此处最小实现：进入画板即高亮）
    };
    window.addEventListener('pointermove', move);
    const up = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      endPointerDrag(ev);
    };
    window.addEventListener('pointerup', up);
  };

  const endPointerDrag = (e: PointerEvent) => {
    const type = dragTypeRef.current;
    dragTypeRef.current = null;
    if (!type || !startPointRef.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    startPointRef.current = null;
    // 松手时鼠标是否在画板内
    if (!rect) return;
    const inside = e.clientX >= rect.left - 8 && e.clientX <= rect.right + 8 && e.clientY >= rect.top - 8 && e.clientY <= rect.bottom + 8;
    if (!inside) return;
    const node = defaultCanvasNode(type);
    setTree([...trees, node]);
    setSelectedId(node.id);
    if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
  };

  // HTML5 兜底
  const onDragStart = (type: CanvasType) => (e: React.DragEvent) => e.dataTransfer.setData('application/x-canvas-type', type);
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/x-canvas-type') as CanvasType;
    if (!type || !['section','row','column','card','text','image','quote','divider','spacer','gallery'].includes(type)) return;
    const node = defaultCanvasNode(type);
    setTree([...trees, node]);
    setSelectedId(node.id);
    if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
  };

  const selected = selectedId ? findNode(trees, selectedId) : null;

  const selectContainer = (id: string) => { setSelectedId(id); setEditingId(null); };
  const startEdit = (id: string) => { setEditingId(id); setSelectedId(id); };
  const stopEdit = () => setEditingId(null);

  // 更新 content（就地编辑/图片上传/面板）
  const updateContent = (id: string, patch: Record<string, any>) => {
    setTree(mapTree(trees, n => n.id === id ? { ...n, content: { ...(n.content || {}), ...patch } } : n));
  };
  // 更新节点整体（属性面板用）
  const updateNode = (id: string, node: CanvasNode) => {
    setTree(mapTree(trees, n => n.id === id ? node : n));
  };

  const duplicate = (id: string) => {
    const src = findNode(trees, id); if (!src) return;
    const copy = JSON.parse(JSON.stringify(src)); copy.id = 'ctr_' + crypto.randomUUID().slice(0, 10);
    const parent = findParent(trees, id);
    const next = parent
      ? mapTree(trees, n => parent.some(p => p.id === n.id) ? { ...n, children: n.children.flatMap(c => c.id === id ? [c, copy] : [c]) } : n)
      : [...trees, copy];
    setTree(next); setSelectedId(copy.id);
  };
  const del = (id: string) => {
    if (!confirm('确定删除此容器及所有子元素？')) return;
    setTree(removeNode(trees, id)); setSelectedId(null);
  };
  const moveOrder = (id: string, dir: -1 | 1) => {
    const parent = findParent(trees, id);
    if (!parent) return;
    const idx = parent.findIndex(n => n.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= parent.length) return;
    const byId = new Map<string, CanvasNode>();
    const walk = (list: CanvasNode[]) => list.forEach(n => { byId.set(n.id, n); walk(n.children); });
    walk(trees);
    const order = parent.map(n => n.id); [order[idx], order[to]] = [order[to], order[idx]];
    const reordered = order.map(i => byId.get(i)!);
    const applyParent = (list: CanvasNode[]): CanvasNode[] => list.map(n =>
      parent.some(p => p.id === n.id) ? reordered.find(r => r.id === n.id)! : { ...n, children: applyParent(n.children) });
    setTree(applyParent(trees));
  };

  // ---- 图片上传 ----
  const pickImage = (id: string) => { setUploadTarget(id); fileRef.current?.click(); };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !uploadTarget) return;
    try {
      const fd = new FormData(); fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上传失败');
      const cur = findNode(trees, uploadTarget);
      if (cur) {
        if (cur.type === 'gallery') {
          const images = [...((cur.content as any)?.images || []), { src: data.url, caption: '' }];
          updateContent(uploadTarget, { images });
        } else updateContent(uploadTarget, { src: data.url });
      }
      toast.success('图片已上传');
    } catch (err: any) { toast.error(err.message || '上传失败'); }
    finally { setUploadTarget(null); if (fileRef.current) fileRef.current.value = ''; }
  };

  // ---- 快捷键 ----
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const c = e.metaKey || e.ctrlKey;
      if (c && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      else if (c && e.key.toLowerCase() === 'd' && selectedId) { e.preventDefault(); duplicate(selectedId); }
      else if (c && e.key === 'ArrowUp' && selectedId) { e.preventDefault(); moveOrder(selectedId, -1); }
      else if (c && e.key === 'ArrowDown' && selectedId) { e.preventDefault(); moveOrder(selectedId, 1); }
      else if (c && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
      else if (e.key === 'Delete' && selectedId && !(e.target as HTMLElement)?.closest('input,textarea,[contenteditable="true"]')) del(selectedId);
      else if (e.key === 'Escape') { stopEdit(); setSelectedId(null); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trees, selectedId, editingId]);

  const save = () => { if (dirty || trees.length) { onSave(trees); setDirty(false); toast.success('已保存'); } };
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty]);

  const boardW = mobile ? 375 : 960;

  return (
    <div className="flex flex-col h-full bg-[#eceae4]">
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-2 bg-white border-b border-[#e8e4de] px-3 py-2">
        <span className="font-semibold text-sm text-[#2d2a24]">🎨 容器编辑器</span>
        <span className="mx-1 w-px h-5 bg-[#e8e4de]" />
        <button onClick={() => setMobile(false)} className={`px-2 py-1 text-xs rounded ${!mobile ? 'bg-[#2d2a24] text-white' : 'bg-[#f2f0ec]'}`}>🖥 桌面</button>
        <button onClick={() => setMobile(true)} className={`px-2 py-1 text-xs rounded ${mobile ? 'bg-[#2d2a24] text-white' : 'bg-[#f2f0ec]'}`}>📱 手机</button>
        <span className="mx-1 w-px h-5 bg-[#e8e4de]" />
        <button onClick={() => setPreview(!preview)} className={`px-2 py-1 text-xs rounded ${preview ? 'bg-[#2d2a24] text-white' : 'bg-[#f2f0ec]'}`}>{preview ? '🔍 预览' : '✏️ 编辑'}</button>
        <span className="mx-1 w-px h-5 bg-[#e8e4de]" />
        <button onClick={undo} disabled={!pastRef.current.length} className="px-2 py-1 text-xs bg-[#f2f0ec] rounded disabled:opacity-40">↩ 撤销 {`${pastRef.current.length}/${MAX_HISTORY}`}</button>
        <button onClick={redo} disabled={!futureRef.current.length} className="px-2 py-1 text-xs bg-[#f2f0ec] rounded disabled:opacity-40">↪ 重做</button>
        <div className="flex-1" />
        <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(trees, null, 2)); toast.success('已复制 JSON'); }} className="px-2 py-1 text-xs bg-[#f2f0ec] rounded">导出 JSON</button>
        <button onClick={save} className="px-3 py-1 text-xs bg-[#2d2a24] text-white rounded">保存</button>
        <button onClick={() => { save(); onExit(); }} className="px-3 py-1 text-xs bg-[#d4a574] text-white rounded">保存并退出</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ComponentPalette onDragStart={onDragStart} onPointerStart={onPointerStart} />

        {/* 画板 */}
        <div className="flex-1 overflow-auto p-4">
          <div
            ref={canvasRef}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="bg-white rounded shadow mx-auto"
            style={{ width: boardW, maxWidth: '100%', minHeight: 400, padding: 24, boxSizing: 'border-box' }}
          >
            {trees.length === 0 && !preview && (
              <div className="text-center text-sm text-[#b8b4ae] py-20">从左侧拖入组件开始编辑</div>
            )}
            {trees.map(n => (
              <CanvasNodeEditor
                key={n.id}
                node={n}
                selected={n.id === selectedId}
                editing={n.id === editingId}
                depth={1}
                onSelect={() => selectContainer(n.id)}
                onEdit={startEdit}
                onStopEdit={stopEdit}
                onUpdateContent={updateContent}
                onDuplicate={() => duplicate(n.id)}
                onDelete={() => del(n.id)}
                onMoveOrder={(d) => moveOrder(n.id, d)}
                onPickImage={pickImage}
                onPickGallery={pickImage}
              />
            ))}
          </div>
        </div>

        {!preview && (
          <PropertyPanel node={selected} onChange={(node) => selectedId && updateNode(selectedId, node as CanvasNode)} onContentChange={(patch) => selectedId && updateContent(selectedId, patch)} onExit={() => setSelectedId(null)} />
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
}
