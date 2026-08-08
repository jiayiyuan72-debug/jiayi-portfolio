'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CanvasNode, CanvasType, defaultCanvasNode, defaultColumnNode, LAYOUT_TYPES, canNest, TemplateId, createTemplate } from '@/types/canvas';
import { Section } from '@/types/section';
import ComponentPalette from './ComponentPalette';
import CanvasNodeEditor from './CanvasNodeEditor';
import PropertyPanel from './PropertyPanel';
import MemoryCardEditor from './MemoryCardEditor';

interface Props {
  trees: CanvasNode[];
  onSave: (trees: CanvasNode[]) => Promise<boolean>;
  sectionName: string;
  sectionId: string;
  section: Section;
  onSectionUpdate: (updated: Partial<Section>) => void;
  onSectionSave: (updated: Partial<Section>) => void;
  saving: boolean;
}

const MAX_HISTORY = 50;

/** Drop position relative to a target node. */
type DropPosition = 'before' | 'after' | 'inside' | 'left' | 'right';

// ---- Tree utils (immutable) ----
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

/** Add a child node to a parent container (by parent ID). If parentId is null, add to root. */
function addChild(list: CanvasNode[], parentId: string | null, child: CanvasNode): CanvasNode[] {
  if (!parentId) return [...list, child];
  return list.map(n => {
    if (n.id === parentId) return { ...n, children: [...n.children, child] };
    return { ...n, children: addChild(n.children, parentId, child) };
  });
}

/** Insert a node before or after a target node in its parent's children list */
function addSibling(list: CanvasNode[], targetId: string, node: CanvasNode, position: 'before' | 'after'): CanvasNode[] {
  const idx = list.findIndex(n => n.id === targetId);
  if (idx >= 0) {
    const insertAt = position === 'before' ? idx : idx + 1;
    return [...list.slice(0, insertAt), node, ...list.slice(insertAt)];
  }
  return list.map(n => ({ ...n, children: addSibling(n.children, targetId, node, position) }));
}

/** Wrap two sibling nodes into a row with 2 columns. The row replaces the first node, the second node is removed. */
function wrapInRow(list: CanvasNode[], node1Id: string, node2Id: string): CanvasNode[] {
  const replaceInList = (l: CanvasNode[]): CanvasNode[] => {
    const idx1 = l.findIndex(n => n.id === node1Id);
    const idx2 = l.findIndex(n => n.id === node2Id);
    if (idx1 >= 0 && idx2 >= 0) {
      const node1 = l[idx1];
      const node2 = l[idx2];
      const col1 = { ...defaultColumnNode('1'), children: [JSON.parse(JSON.stringify(node1))] };
      const col2 = { ...defaultColumnNode('1'), children: [JSON.parse(JSON.stringify(node2))] };
      const row: CanvasNode = {
        id: 'ctr_' + crypto.randomUUID().slice(0, 10),
        type: 'row',
        props: { width: '100%', height: 'auto', gap: 16, marginBottom: 12, responsiveStack: true, alignItems: 'stretch' },
        content: { gap: 16 },
        children: [col1, col2],
      };
      const minIdx = Math.min(idx1, idx2);
      const maxIdx = Math.max(idx1, idx2);
      const next = [...l];
      next[minIdx] = row;
      next.splice(maxIdx, 1);
      return next;
    }
    return l.map(n => ({ ...n, children: replaceInList(n.children) }));
  };
  return replaceInList(list);
}

/**
 * Smart place-beside: insert a source node to the left/right of a target node.
 *  - If the target lives inside a row's column, a new column is added to that row.
 *  - Otherwise, the target and source are wrapped into a new row with two columns.
 */
function placeBeside(list: CanvasNode[], targetId: string, sourceNode: CanvasNode, side: 'left' | 'right'): CanvasNode[] {
  // 1. Try to add a column to an existing row if the target lives inside a row's column
  const tryAddToRow = (l: CanvasNode[]): { result: CanvasNode[]; found: boolean } => {
    for (let i = 0; i < l.length; i++) {
      const n = l[i];
      if (n.type === 'row') {
        for (let j = 0; j < n.children.length; j++) {
          const col = n.children[j];
          if (col.id === targetId || findNode([col], targetId)) {
            const newCol = { ...defaultColumnNode('1'), children: [JSON.parse(JSON.stringify(sourceNode))] };
            const insertAt = side === 'left' ? j : j + 1;
            const newChildren = [...n.children];
            newChildren.splice(insertAt, 0, newCol);
            const next = [...l];
            next[i] = { ...n, children: newChildren };
            return { result: next, found: true };
          }
        }
      }
      if (n.children.length > 0) {
        const { result, found } = tryAddToRow(n.children);
        if (found) {
          const next = [...l];
          next[i] = { ...n, children: result };
          return { result: next, found: true };
        }
      }
    }
    return { result: l, found: false };
  };

  const { result, found } = tryAddToRow(list);
  if (found) return result;

  // 2. Otherwise create a new row wrapping both nodes
  const wrapInNewRow = (l: CanvasNode[]): CanvasNode[] => {
    const idx = l.findIndex(n => n.id === targetId);
    if (idx >= 0) {
      const target = l[idx];
      const col1 = side === 'left' ? sourceNode : target;
      const col2 = side === 'left' ? target : sourceNode;
      const row: CanvasNode = {
        id: 'ctr_' + crypto.randomUUID().slice(0, 10),
        type: 'row',
        props: { width: '100%', height: 'auto', gap: 16, marginBottom: 12, responsiveStack: true, alignItems: 'stretch' },
        content: { gap: 16 },
        children: [
          { ...defaultColumnNode('1'), children: [JSON.parse(JSON.stringify(col1))] },
          { ...defaultColumnNode('1'), children: [JSON.parse(JSON.stringify(col2))] },
        ],
      };
      const next = [...l];
      next[idx] = row;
      return next;
    }
    return l.map(n => ({ ...n, children: wrapInNewRow(n.children) }));
  };
  return wrapInNewRow(list);
}

export default function CanvasEditor({ trees: initialTrees, onSave, sectionName, section, onSectionUpdate, onSectionSave, saving }: Props) {
  const [trees, setTrees] = useState<CanvasNode[]>(() => JSON.parse(JSON.stringify(initialTrees || [])));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);
  const [mobile, setMobile] = useState(false);
  const pastRef = useRef<CanvasNode[][]>([]);
  const futureRef = useRef<CanvasNode[][]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const multiFileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);
  const [multiUploadTarget, setMultiUploadTarget] = useState<string | null>(null);
  const [multiUploadProgress, setMultiUploadProgress] = useState<string | null>(null);
  const [memoryCardEditing, setMemoryCardEditing] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [canvasSaving, setCanvasSaving] = useState(false);
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

  // ---- Add component: smart placement with auto-row for adjacent images ----
  const addComponent = (type: CanvasType) => {
    const node = defaultCanvasNode(type);
    const sel = selectedId ? findNode(trees, selectedId) : null;

    // If a layout container is selected, add as its child
    if (sel && LAYOUT_TYPES.includes(sel.type) && canNest(sel, type)) {
      setTree(addChild(trees, selectedId!, node));
      setSelectedId(node.id);
      if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
      return;
    }

    // Smart: if adding an image and the selected node is also an image, auto-wrap both in a row
    if (type === 'image' && sel && sel.type === 'image') {
      setTree(wrapInRow(trees, selectedId!, node.id));
      setSelectedId(node.id);
      return;
    }

    // If a leaf is selected, add as sibling after it
    if (sel) {
      setTree(addSibling(trees, selectedId!, node, 'after'));
      setSelectedId(node.id);
      if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
      return;
    }

    // No selection: add to root
    setTree([...trees, node]);
    setSelectedId(node.id);
    if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
  };

  // ---- Add preset template ----
  const addTemplate = (templateId: TemplateId) => {
    const node = createTemplate(templateId);
    const sel = selectedId ? findNode(trees, selectedId) : null;
    if (sel && LAYOUT_TYPES.includes(sel.type)) {
      setTree(addChild(trees, selectedId!, node));
    } else if (sel) {
      // Insert as sibling after the selected leaf node (not just append to root)
      setTree(addSibling(trees, selectedId!, node, 'after'));
    } else {
      setTree([...trees, node]);
    }
    setSelectedId(null);
  };

  // ---- Insert at specific root-level index (for top/between drop zones) ----
  const insertAt = (index: number, type: CanvasType | TemplateId, isTemplate?: boolean) => {
    if (isTemplate) {
      const node = createTemplate(type as TemplateId);
      const next = [...trees];
      next.splice(index, 0, node);
      setTree(next);
      setSelectedId(null);
    } else {
      const node = defaultCanvasNode(type as CanvasType);
      const next = [...trees];
      next.splice(index, 0, node);
      setTree(next);
      setSelectedId(node.id);
      if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
    }
  };

  // ---- Insert a new node before a specific node (for "insert above" button) ----
  const insertBefore = (id: string) => {
    const node = defaultCanvasNode('section');
    const insertSiblingBefore = (list: CanvasNode[]): CanvasNode[] => {
      const i = list.findIndex(n => n.id === id);
      if (i >= 0) {
        const next = [...list];
        next.splice(i, 0, node);
        return next;
      }
      return list.map(n => ({ ...n, children: insertSiblingBefore(n.children) }));
    };
    setTree(insertSiblingBefore(trees));
    setSelectedId(node.id);
  };

  // HTML5 drag-and-drop on canvas (fallback for drops on empty canvas space)
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/x-canvas-type') as CanvasType;
    const templateId = e.dataTransfer.getData('application/x-canvas-template') as TemplateId;
    if (templateId) { addTemplate(templateId); return; }
    if (!type) return;
    addComponent(type);
  };

  // ---- Per-node drop: insert before/after a node, inside a container, or beside (left/right) ----
  const onDropOnNode = (nodeId: string, position: DropPosition, type: CanvasType | TemplateId, isTemplate?: boolean) => {
    if (isTemplate) {
      const node = createTemplate(type as TemplateId);
      if (position === 'inside') {
        const target = findNode(trees, nodeId);
        if (target && LAYOUT_TYPES.includes(target.type)) {
          setTree(addChild(trees, nodeId, node));
        }
      } else if (position === 'left' || position === 'right') {
        setTree(placeBeside(trees, nodeId, node, position));
      } else {
        setTree(addSibling(trees, nodeId, node, position));
      }
      setSelectedId(null);
      return;
    }

    const canvasType = type as CanvasType;
    const node = defaultCanvasNode(canvasType);

    if (position === 'inside') {
      const target = findNode(trees, nodeId);
      if (target && LAYOUT_TYPES.includes(target.type) && canNest(target, canvasType)) {
        setTree(addChild(trees, nodeId, node));
        setSelectedId(node.id);
        if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
      }
    } else if (position === 'left' || position === 'right') {
      setTree(placeBeside(trees, nodeId, node, position));
      setSelectedId(node.id);
      if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
    } else {
      setTree(addSibling(trees, nodeId, node, position));
      setSelectedId(node.id);
      if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
    }
  };

  // ---- Move an existing node to a new position (drag-to-rearrange) ----
  const onMoveNode = (sourceId: string, targetId: string, position: DropPosition) => {
    if (sourceId === targetId) return;
    const sourceNode = findNode(trees, sourceId);
    if (!sourceNode) return;
    // Prevent moving a node into its own descendant
    const isDescendant = (parent: CanvasNode, childId: string): boolean => {
      return parent.children.some(c => c.id === childId || isDescendant(c, childId));
    };
    if (isDescendant(sourceNode, targetId)) return;
    // Remove the source node from the tree first
    let newTree = removeNode(trees, sourceId);
    // Deep copy the source node (it is now detached)
    const sourceCopy: CanvasNode = JSON.parse(JSON.stringify(sourceNode));
    if (position === 'left' || position === 'right') {
      newTree = placeBeside(newTree, targetId, sourceCopy, position);
    } else if (position === 'inside') {
      const target = findNode(newTree, targetId);
      if (target && LAYOUT_TYPES.includes(target.type)) {
        newTree = addChild(newTree, targetId, sourceCopy);
      }
    } else {
      newTree = addSibling(newTree, targetId, sourceCopy, position);
    }
    setTree(newTree);
    setSelectedId(sourceId);
  };

  // Resize node (supports flexBasis for smart flex resize)
  const onResizeNode = (id: string, patch: { width?: string; height?: string; flexBasis?: string }) => {
    setTree(mapTree(trees, n => n.id === id ? { ...n, props: { ...n.props, ...patch } } : n));
  };

  const selected = selectedId ? findNode(trees, selectedId) : null;

  const selectNode = (id: string) => { setSelectedId(id); setEditingId(null); };
  const startEdit = (id: string) => { setEditingId(id); setSelectedId(id); };
  const stopEdit = () => setEditingId(null);

  const updateContent = (id: string, patch: Record<string, any>) => {
    setTree(mapTree(trees, n => n.id === id ? { ...n, content: { ...(n.content || {}), ...patch } } : n));
  };
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

  // ---- Image upload ----
  const pickImage = (id: string) => { setUploadTarget(id); fileRef.current?.click(); };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !uploadTarget) return;
    try {
      let blob: Blob = file;
      if (file.type.startsWith('image/') && file.size > 1.5 * 1024 * 1024) {
        const b = await compressFile(file);
        if (b && b.size > 0 && b.size < file.size) blob = b;
      }
      const fd = new FormData(); fd.append('file', blob, blob === file ? file.name : 'image.jpg');
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

  // ---- Multi-file upload for photo-wall ----
  const pickMultiImage = (id: string) => { setMultiUploadTarget(id); multiFileRef.current?.click(); };
  const handleMultiFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []); if (!files.length || !multiUploadTarget) return;
    const target = multiUploadTarget;
    try {
      const uploaded: { src: string; caption: string }[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setMultiUploadProgress(`上传中 ${i + 1}/${files.length}...`);
        let blob: Blob = file;
        if (file.type.startsWith('image/') && file.size > 1.5 * 1024 * 1024) {
          const b = await compressFile(file);
          if (b && b.size > 0 && b.size < file.size) blob = b;
        }
        const fd = new FormData(); fd.append('file', blob, blob === file ? file.name : 'image.jpg');
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '上传失败');
        uploaded.push({ src: data.url, caption: '' });
      }
      const cur = findNode(trees, target);
      if (cur) {
        const existing = (cur.content as any)?.images || [];
        updateContent(target, { images: [...existing, ...uploaded] });
      }
      toast.success(`成功上传 ${uploaded.length} 张照片`);
    } catch (err: any) { toast.error(err.message || '上传失败'); }
    finally {
      setMultiUploadTarget(null);
      setMultiUploadProgress(null);
      if (multiFileRef.current) multiFileRef.current.value = '';
    }
  };

  // ---- Keyboard shortcuts ----
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

  const save = async () => {
    if (!dirty && !trees.length) return;
    setCanvasSaving(true);
    try {
      const ok = await onSave(trees);
      if (ok) {
        setDirty(false);
        toast.success('已保存');
      } else {
        toast.error('保存失败，请检查网络或重新登录');
      }
    } catch {
      toast.error('保存失败，请重试');
    } finally {
      setCanvasSaving(false);
    }
  };
  useEffect(() => {
    const before = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', before);
    return () => window.removeEventListener('beforeunload', before);
  }, [dirty]);

  const boardW = mobile ? 375 : 1152;

  // Callbacks passed to CanvasNodeEditor
  const nodeCallbacks = {
    onSelectId: selectNode,
    onEditId: startEdit,
    onStopEdit: stopEdit,
    onUpdateContent: updateContent,
    onDuplicate: duplicate,
    onDelete: del,
    onMoveOrder: moveOrder,
    onPickImage: pickImage,
    onPickGallery: pickImage,
    onPickPhotoWall: pickMultiImage,
    onEditMemoryCard: (id: string) => setMemoryCardEditing(id),
    onResize: onResizeNode,
    onDropOnNode: onDropOnNode,
    onMoveNode: onMoveNode,
    onAddChild: (parentId: string, type: CanvasType) => {
      const node = defaultCanvasNode(type);
      setTree(addChild(trees, parentId, node));
      setSelectedId(node.id);
      if (node.type === 'text' || node.type === 'quote') setEditingId(node.id);
    },
    onQuickAddImage: (parentId: string) => {
      const col = defaultColumnNode('1');
      const img = defaultCanvasNode('image');
      col.children = [img];
      setTree(addChild(trees, parentId, col));
      setSelectedId(img.id);
    },
    onInsertBefore: insertBefore,
  };

  return (
    <div className="flex flex-col h-full bg-[#eceae4]">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 bg-white border-b border-[#e8e4de] px-3 py-2 flex-shrink-0">
        <span className="font-semibold text-sm text-[#2d2a24]">{sectionName}</span>
        <span className="mx-1 w-px h-5 bg-[#e8e4de]" />
        <button onClick={() => setMobile(false)} className={`px-2 py-1 text-xs rounded ${!mobile ? 'bg-[#2d2a24] text-white' : 'bg-[#f2f0ec]'}`}>桌面</button>
        <button onClick={() => setMobile(true)} className={`px-2 py-1 text-xs rounded ${mobile ? 'bg-[#2d2a24] text-white' : 'bg-[#f2f0ec]'}`}>手机</button>
        <span className="mx-1 w-px h-5 bg-[#e8e4de]" />
        <button onClick={() => setPreview(!preview)} className={`px-2 py-1 text-xs rounded ${preview ? 'bg-[#2d2a24] text-white' : 'bg-[#f2f0ec]'}`}>{preview ? '预览中' : '编辑'}</button>
        <span className="mx-1 w-px h-5 bg-[#e8e4de]" />
        <button onClick={undo} disabled={!pastRef.current.length} className="px-2 py-1 text-xs bg-[#f2f0ec] rounded disabled:opacity-40">撤销</button>
        <button onClick={redo} disabled={!futureRef.current.length} className="px-2 py-1 text-xs bg-[#f2f0ec] rounded disabled:opacity-40">重做</button>
        <div className="flex-1" />
        {(saving || canvasSaving) && <span className="text-xs text-[#8b8b8b]">保存中...</span>}
        <button onClick={save} disabled={canvasSaving} className="px-3 py-1 text-xs bg-[#2d2a24] text-white rounded disabled:opacity-50">{canvasSaving ? "保存中..." : "保存"}</button>
      </div>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {!preview && (
          <ComponentPalette onAddClick={addComponent} onAddTemplate={addTemplate} />
        )}

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-4 min-w-0">
          <div
            ref={canvasRef}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="bg-white rounded shadow mx-auto"
            style={{ width: boardW, maxWidth: '100%', minHeight: 400, padding: 24, boxSizing: 'border-box' }}
          >
            {trees.length === 0 && !preview && (
              <div className="text-center text-sm text-[#b8b4ae] py-20">
                从左侧拖入组件，或直接拖动画布上的元素进行布局
                <div className="mt-2 text-xs">拖拽元素到另一个元素的左侧/右侧可自动并排显示</div>
              </div>
            )}
            {/* Top drop zone - always visible when there's content */}
            {trees.length > 0 && !preview && (
              <div
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const type = e.dataTransfer.getData('application/x-canvas-type') as CanvasType;
                  const templateId = e.dataTransfer.getData('application/x-canvas-template') as TemplateId;
                  if (templateId) { insertAt(0, templateId, true); return; }
                  if (type) { insertAt(0, type, false); }
                }}
                className="border-2 border-dashed border-[#d8d4cc] hover:border-[#4a90e2] rounded-lg py-1.5 mb-2 text-center text-[10px] text-[#b8b4ae] hover:text-[#4a90e2] hover:bg-[#f0f7ff] transition-all cursor-pointer"
              >
                + 添加到顶部（拖入组件或布局模板）
              </div>
            )}
            {trees.map((n, i) => (
              <div key={n.id}>
                <CanvasNodeEditor
                  node={n}
                  selectedId={selectedId}
                  editingId={editingId}
                  depth={1}
                  preview={preview}
                  {...nodeCallbacks}
                />
                {/* Insert bar between root-level nodes */}
                {!preview && i < trees.length - 1 && (
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const type = e.dataTransfer.getData('application/x-canvas-type') as CanvasType;
                      const templateId = e.dataTransfer.getData('application/x-canvas-template') as TemplateId;
                      if (templateId) { insertAt(i + 1, templateId, true); return; }
                      if (type) { insertAt(i + 1, type, false); }
                    }}
                    className="group/insert h-1 hover:h-7 transition-all duration-150 flex items-center justify-center my-0.5"
                  >
                    <div className="w-full border-2 border-dashed border-transparent group-hover/insert:border-[#4a90e2] rounded-lg py-0.5 text-center text-[10px] text-[#4a90e2] opacity-0 group-hover/insert:opacity-100 bg-[#f0f7ff] transition-all">
                      + 插入到此处
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {!preview && (
          <PropertyPanel
            node={selected}
            section={section}
            onSectionUpdate={onSectionUpdate}
            onSectionSave={onSectionSave}
            onChange={(node) => selectedId && updateNode(selectedId, node as CanvasNode)}
            onContentChange={(patch) => selectedId && updateContent(selectedId, patch)}
            onExit={() => setSelectedId(null)}
          />
        )}
      </div>

{memoryCardEditing && (() => {
        const node = findNode(trees, memoryCardEditing);
        if (!node) { setMemoryCardEditing(null); return null; }
        return (
          <MemoryCardEditor
            title={(node.content as any)?.title || '记忆卡片'}
            icon={(node.content as any)?.icon || '\U0001F3B4'}
            canvasData={(node.content as any)?.canvasData || []}
            onChange={(data) => {
              updateContent(memoryCardEditing, { canvasData: data });
            }}
            onClose={() => setMemoryCardEditing(null)}
          />
        );
      })()}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      <input ref={multiFileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMultiFileChange} />
      {multiUploadProgress && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[#2d2a24] text-white text-xs px-4 py-2 rounded-lg shadow-lg">
          {multiUploadProgress}
        </div>
      )}
    </div>
  );
}

/** Lightweight image compression (canvas) — compress before upload to avoid Vercel body limit */
async function compressFile(file: File): Promise<Blob | null> {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = url; });
    const MAX = 1920;
    let { width, height } = img;
    if (width > MAX || height > MAX) { const s = MAX / Math.max(width, height); width = Math.round(width * s); height = Math.round(height * s); }
    const cv = document.createElement('canvas'); cv.width = width; cv.height = height;
    const ctx = cv.getContext('2d'); if (!ctx) return null;
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob | null>(res => cv.toBlob(res, 'image/jpeg', 0.82));
    URL.revokeObjectURL(url);
    return blob;
  } catch { return null; }
}
