'use client';

import { CanvasNode, CANVAS_TYPE_LABELS } from '@/types/canvas';

interface Props {
  node: CanvasNode | null;
  onChange: (patch: Partial<CanvasNode>) => void;
  onContentChange: (patch: Record<string, any>) => void;
  onExit: () => void;
}

const num = { type: 'number', min: 0, step: 1, className: 'w-full px-1.5 py-1 text-xs border border-[#e8e4de] rounded' } as const;

/** 右侧属性面板：选中容器的通用 props（宽/高/边距/内边距/背景/圆角） */
export default function PropertyPanel({ node, onChange, onContentChange, onExit }: Props) {
  if (!node) {
    return (
      <div className="w-60 bg-white border-l border-[#e8e4de] p-4 text-sm text-[#b8b4ae] flex-shrink-0">
        <p className="font-medium text-[#2d2a24] mb-1">画板</p>
        <p>选择一个容器查看/编辑属性</p>
      </div>
    );
  }

  const p = node.props || {};
  const set = (patch: Record<string, any>) => onChange({ ...node, props: { ...p, ...patch } });
  const sc = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => set({ [key]: e.target.value === '' ? undefined : e.target.value });
  const sh = () => {};

  return (
    <div className="w-60 bg-white border-l border-[#e8e4de] p-3 overflow-y-auto flex-shrink-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#2d2a24]">{CANVAS_TYPE_LABELS[node.type].icon} {CANVAS_TYPE_LABELS[node.type].label}</p>
        <button onClick={onExit} className="text-xs text-[#b8b4ae]">退出</button>
      </div>

      <div className="space-y-2">
        <Field label="宽度">
          <input value={p.width || '100%'} onChange={sc('width')} className={num.className} />
        </Field>
        <Field label="高度">
          <input value={p.height || 'auto'} onChange={sc('height')} className={num.className} />
        </Field>
        <div className="grid grid-cols-2 gap-1.5">
          {[['marginTop','上边距'],['marginBottom','下边距']].map(([k, l]) => (
            <Field key={k} label={l as string}>
              <input type="number" value={(p as any)[k] ?? 0} onChange={(e) => set({ [k]: Number(e.target.value) })} className={num.className} />
            </Field>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {[['paddingTop','上内边距'],['paddingBottom','下内边距']].map(([k, l]) => (
            <Field key={k} label={l as string}>
              <input type="number" value={(p as any)[k] ?? 0} onChange={(e) => set({ [k]: Number(e.target.value) })} className={num.className} />
            </Field>
          ))}
        </div>
        <Field label="背景色">
          <input type="color" value={p.bgColor || '#ffffff'} onChange={(e) => set({ bgColor: e.target.value })} className="w-full h-8 rounded border border-[#e8e4de]" />
        </Field>
        <Field label="圆角">
          <input type="number" value={p.borderRadius ?? 0} onChange={(e) => set({ borderRadius: Number(e.target.value) })} className={num.className} />
        </Field>

        {/* 类型特有 */}
        {node.type === 'section' && (
          <>
            <Field label="区块标题"><input value={(node.content as any)?.title || ''} onChange={(e) => onContentChange({ ...node.content, title: e.target.value })} className={num.className} /></Field>
            <Field label="卡片阴影">
              <select value={p.shadow || 'sm'} onChange={(e) => set({ shadow: e.target.value })} className={num.className}>
                {['none','sm','md','lg'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </>
        )}
        {node.type === 'card' && (
          <Field label="阴影深度">
            <select value={p.shadow || 'sm'} onChange={(e) => set({ shadow: e.target.value })} className={num.className}>
              {['none','sm','md','lg'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        )}
        {node.type === 'gallery' && (
          <>
            <Field label="列数">
              <input type="number" value={(node.content as any)?.columns || 3} onChange={(e) => onContentChange({ ...node.content, columns: Number(e.target.value) })} className={num.className} />
            </Field>
          </>
        )}
        {node.type === 'image' && (
          <>
            <Field label="图片URL"><input value={(node.content as any)?.src || ''} onChange={(e) => onContentChange({ ...node.content, src: e.target.value })} className={num.className} /></Field>
            <Field label="适配模式">
              <select value={(node.content as any)?.fitMode || 'fit-width'} onChange={(e) => onContentChange({ ...node.content, fitMode: e.target.value })} className={num.className}>
                <option value="fit-width">适应宽度</option>
                <option value="original">原尺寸</option>
                <option value="cover">填充裁切</option>
              </select>
            </Field>
            <Field label="caption"><input value={(node.content as any)?.caption || ''} onChange={(e) => onContentChange({ ...node.content, caption: e.target.value })} className={num.className} /></Field>
            <Field label="Alt"><input value={(node.content as any)?.alt || ''} onChange={(e) => onContentChange({ ...node.content, alt: e.target.value })} className={num.className} /></Field>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[11px] text-[#8b8b8b] block mb-0.5">{label}</label>
      {children}
    </div>
  );
}
