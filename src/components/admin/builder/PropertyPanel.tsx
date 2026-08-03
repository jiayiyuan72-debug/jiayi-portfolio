'use client';

import { PageContainer, CONTAINER_TYPE_LABELS, ImageFocal } from '@/types/page-layout';
import { useBuilderStore } from './store';

/** 右侧属性面板：编辑选中容器的内容 / 样式 / 尺寸 / 图片焦点 */
export default function PropertyPanel() {
  const { present, selectedIds, updateContainer, setContainers } = useBuilderStore();
  const selected = present.filter(c => selectedIds.includes(c.id));

  if (selected.length === 0) {
    return (
      <div className="w-64 bg-white border-l border-[#e8e4de] p-4 text-sm text-[#b8b4ae] flex-shrink-0">
        选择一个容器编辑属性
      </div>
    );
  }

  // 单容器属性编辑
  if (selected.length === 1) {
    const c = selected[0];
    return <SinglePanel key={c.id} container={c} onChange={patch => updateContainer(c.id, patch)} />;
  }

  // 批量对齐（多选）
  const onAlign = (mode: string) => {
    if (selected.length < 2) return;
    setContainers(
      present.map(cc => {
        if (!selectedIds.includes(cc.id)) return cc;
        const target = selected[0];
        switch (mode) {
          case 'left': return { ...cc, x: target.x };
          case 'right': return { ...cc, x: target.x + target.w - cc.w };
          case 'hcenter': return { ...cc, x: target.x + target.w / 2 - cc.w / 2 };
          case 'top': return { ...cc, y: target.y };
          case 'bottom': return { ...cc, y: target.y + target.h - cc.h };
          case 'vcenter': return { ...cc, y: target.y + target.h / 2 - cc.h / 2 };
          case 'ewidth': return { ...cc, w: target.w };
          case 'eheight': return { ...cc, h: target.h };
        }
        return cc;
      })
    );
    useBuilderStore.setState({ guides: [] });
  };

  const alignButtons = [
    { k: 'left', l: '←', t: '左对齐' },
    { k: 'hcenter', l: '⟷', t: '水平居中' },
    { k: 'right', l: '→', t: '右对齐' },
    { k: 'top', l: '↑', t: '顶部对齐' },
    { k: 'vcenter', l: '↕', t: '垂直居中' },
    { k: 'bottom', l: '↓', t: '底部对齐' },
    { k: 'ewidth', l: '⇔', t: '等宽' },
    { k: 'eheight', l: '⇕', t: '等高' },
  ];

  return (
    <div className="w-64 bg-white border-l border-[#e8e4de] p-3 flex-shrink-0 overflow-y-auto">
      <p className="text-sm font-medium text-[#2d2a24] mb-2">批量对齐（{selected.length} 项）</p>
      <div className="grid grid-cols-4 gap-1.5 mb-3">
        {alignButtons.map(b => (
          <button key={b.k} onClick={() => onAlign(b.k)} title={b.t}
            className="px-1 py-2 text-sm bg-[#f8f5f0] border border-[#e8e4de] rounded-lg hover:bg-[#e8e4de]">
            {b.l}
          </button>
        ))}
      </div>
      <p className="text-xs text-[#b8b4ae]">多选：拖拽框选，或 Shift+点选</p>
    </div>
  );
}

function SinglePanel({ container: c, onChange }: { container: PageContainer; onChange: (p: Partial<PageContainer>) => void }) {
  const snapEnabled = useBuilderStore(s => s.snapEnabled);
  const setSnap = useBuilderStore(s => s.setSnap);
  const gridSize = useBuilderStore(s => s.gridSize);
  const setGridSize = useBuilderStore(s => s.setGridSize);
  const undo = useBuilderStore(s => s.undo);
  const redo = useBuilderStore(s => s.redo);

  const set = (patch: Record<string, any>) => onChange(patch);
  const setContent = (patch: Record<string, any>) => onChange({ content: { ...c.content, ...patch } });
  const setStyle = (patch: Record<string, any>) => onChange({ style: { ...c.style, ...patch } });
  const setFocal = (patch: Partial<ImageFocal>) => setContent({ focal: { ...(c.content.focal || { x: 0.5, y: 0.5, scale: 1 }), ...patch } });

  return (
    <div className="w-64 bg-white border-l border-[#e8e4de] p-3 flex-shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#2d2a24]">
          {CONTAINER_TYPE_LABELS[c.type].icon} {CONTAINER_TYPE_LABELS[c.type].label}
        </p>
        <div className="flex gap-1">
          <button onClick={undo} disabled={!useBuilderStore.getState().past.length} className="px-2 py-0.5 text-xs bg-[#f8f5f0] rounded">↩</button>
          <button onClick={redo} disabled={!useBuilderStore.getState().future.length} className="px-2 py-0.5 text-xs bg-[#f8f5f0] rounded">↪</button>
        </div>
      </div>

      <div className="space-y-3">
        {/* 尺寸与位置 */}
        <div className="grid grid-cols-2 gap-2">
          {(['x', 'y', 'w', 'h'] as const).map(k => (
            <div key={k} className="flex items-center gap-1">
              <span className="text-xs text-[#8b8b8b] w-4">{k}</span>
              <input
                type="number"
                value={Math.round((c as any)[k] ?? 0)}
                onChange={e => set({ [k]: Number(e.target.value) })}
                className="w-full px-1.5 py-1 text-xs border border-[#e8e4de] rounded"
              />
            </div>
          ))}
        </div>

        {/* 填充模式 */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#2d2a24]">填充模式（占满父容器）</span>
          <button
            onClick={() => set({ fill: !c.fill })}
            className={`w-9 h-5 rounded-full transition-colors ${c.fill ? 'bg-[#2d2a24]' : 'bg-[#e8e4de]'} relative`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${c.fill ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* 类型相关属性 */}
        {c.type === 'text' && (
          <>
            <textarea value={c.content.text || ''} onChange={e => setContent({ text: e.target.value })} rows={3}
              className="w-full px-2 py-1.5 text-sm border border-[#e8e4de] rounded-lg" placeholder="文本内容" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#2d2a24]">自适应字号</span>
              <button onClick={() => setContent({ autoFont: !c.content.autoFont })}
                className={`w-8 h-4.5 rounded-full ${c.content.autoFont ? 'bg-[#2d2a24]' : 'bg-[#e8e4de]'} relative`}>
                <span className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-transform ${c.content.autoFont ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </>
        )}

        {c.type === 'image' && (
          <>
            <input type="text" value={c.content.url || ''} onChange={e => setContent({ url: e.target.value })}
              placeholder="图片 URL" className="w-full px-2 py-1.5 text-sm border border-[#e8e4de] rounded-lg" />
            <div>
              <label className="text-xs text-[#8b8b8b] block mb-1">填充方式</label>
              <div className="flex gap-1.5">
                {(['contain', 'cover', 'fill'] as const).map(fit => (
                  <button key={fit} onClick={() => setContent({ fit })}
                    className={`flex-1 px-2 py-1 text-xs rounded ${(c.content.fit || 'contain') === fit ? 'bg-[#2d2a24] text-white' : 'bg-[#f8f5f0]'}`}>
                    {fit === 'contain' ? '适应' : fit === 'cover' ? '铺满' : '拉伸'}
                  </button>
                ))}
              </div>
            </div>
            {(c.content.fit || 'contain') === 'cover' && (
              <div>
                <label className="text-xs text-[#8b8b8b] block mb-1">焦点（拖拽选择展示哪部分）</label>
                <div className="flex gap-1.5 items-center">
                  <span className="text-xs text-[#8b8b8b]">水平</span>
                  <input type="range" min={0} max={100} value={(c.content.focal?.x ?? 0.5) * 100}
                    onChange={e => setFocal({ x: Number(e.target.value) / 100 })} className="flex-1" />
                </div>
                <div className="flex gap-1.5 items-center mt-1">
                  <span className="text-xs text-[#8b8b8b]">垂直</span>
                  <input type="range" min={0} max={100} value={(c.content.focal?.y ?? 0.5) * 100}
                    onChange={e => setFocal({ y: Number(e.target.value) / 100 })} className="flex-1" />
                </div>
                <div className="flex gap-1.5 items-center mt-1">
                  <span className="text-xs text-[#8b8b8b]">缩放</span>
                  <input type="range" min={100} max={300} value={(c.content.focal?.scale ?? 1) * 100}
                    onChange={e => setFocal({ scale: Number(e.target.value) / 100 })} className="flex-1" />
                </div>
              </div>
            )}
          </>
        )}

        {c.type === 'button' && (
          <>
            <input type="text" value={c.content.label || ''} onChange={e => setContent({ label: e.target.value })}
              placeholder="按钮文字" className="w-full px-2 py-1.5 text-sm border border-[#e8e4de] rounded-lg" />
            <input type="text" value={c.content.href || ''} onChange={e => setContent({ href: e.target.value })}
              placeholder="链接 (可选)" className="w-full px-2 py-1.5 text-sm border border-[#e8e4de] rounded-lg" />
            <input type="color" value={c.content.color || '#2d2a24'} onChange={e => setContent({ color: e.target.value })}
              className="w-full h-8 rounded border border-[#e8e4de]" />
          </>
        )}

        {c.type === 'card' && (
          <>
            <input type="text" value={c.content.title || ''} onChange={e => setContent({ title: e.target.value })}
              placeholder="卡片标题" className="w-full px-2 py-1.5 text-sm border border-[#e8e4de] rounded-lg" />
            <textarea value={c.content.text || ''} onChange={e => setContent({ text: e.target.value })} rows={3}
              className="w-full px-2 py-1.5 text-sm border border-[#e8e4de] rounded-lg" />
          </>
        )}

        {c.type === 'rich' && (
          <textarea value={c.content.html || ''} onChange={e => setContent({ html: e.target.value })} rows={4}
            className="w-full px-2 py-1.5 text-sm font-mono border border-[#e8e4de] rounded-lg" placeholder="HTML 内容" />
        )}

        {c.type === 'video' && (
          <>
            <input type="text" value={c.content.url || ''} onChange={e => setContent({ url: e.target.value })}
              placeholder="视频 URL / embed" className="w-full px-2 py-1.5 text-sm border border-[#e8e4de] rounded-lg" />
          </>
        )}

        {/* 通用样式 */}
        {c.type !== 'spacer' && c.type !== 'divider' && (
          <div className="border-t pt-2">
            <p className="text-xs text-[#8b8b8b] mb-1.5">样式</p>
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs text-[#8b8b8b]">背景</span>
              <input type="color" value={c.style.bg || '#ffffff'} onChange={e => setStyle({ bg: e.target.value })}
                className="w-6 h-6 rounded border border-[#e8e4de]" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#8b8b8b]">圆角</span>
              <input type="number" value={c.style.radius ?? 0} onChange={e => setStyle({ radius: Number(e.target.value) })}
                className="w-16 px-1.5 py-1 text-xs border border-[#e8e4de] rounded" />
            </div>
          </div>
        )}

        {/* 网格吸附设置 */}
        <div className="border-t pt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#2d2a24]">网格吸附</span>
            <button onClick={() => setSnap(!snapEnabled)}
              className={`w-9 h-5 rounded-full transition-colors ${snapEnabled ? 'bg-[#2d2a24]' : 'bg-[#e8e4de]'} relative`}>
              <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${snapEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>
          {snapEnabled && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#8b8b8b]">网格</span>
              <input type="number" min={1} value={gridSize} onChange={e => setGridSize(Number(e.target.value) || 8)}
                className="w-16 px-1.5 py-1 text-xs border border-[#e8e4de] rounded" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
