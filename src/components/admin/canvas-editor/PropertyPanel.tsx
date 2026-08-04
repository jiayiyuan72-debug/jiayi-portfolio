'use client';

import { CanvasNode, CANVAS_TYPE_LABELS } from '@/types/canvas';
import type { Section } from '@/types/section';

interface Props {
  node: CanvasNode | null;
  section: Section;
  onSectionUpdate: (updated: Partial<Section>) => void;
  onSectionSave: (updated: Partial<Section>) => void;
  onChange: (patch: Partial<CanvasNode>) => void;
  onContentChange: (patch: Record<string, any>) => void;
  onExit: () => void;
}

const inputCls = 'w-full px-2 py-1 text-xs border border-[#e8e4de] rounded focus:outline-none focus:ring-1 focus:ring-[#4a90e2]';
const numCls = 'w-full px-2 py-1 text-xs border border-[#e8e4de] rounded focus:outline-none focus:ring-1 focus:ring-[#4a90e2]';

/** Right panel: node properties when selected, section settings when not */
export default function PropertyPanel({ node, section, onSectionUpdate, onSectionSave, onChange, onContentChange, onExit }: Props) {
  if (!node) {
    return <SectionSettings section={section} onUpdate={onSectionUpdate} onSave={onSectionSave} />;
  }

  const p = node.props || {};
  const set = (patch: Record<string, any>) => onChange({ ...node, props: { ...p, ...patch } });

  return (
    <div className="w-64 bg-white border-l border-[#e8e4de] flex flex-col overflow-hidden flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#e8e4de] flex-shrink-0">
        <p className="text-sm font-medium text-[#2d2a24]">{CANVAS_TYPE_LABELS[node.type].icon} {CANVAS_TYPE_LABELS[node.type].label}</p>
        <button onClick={onExit} className="text-xs text-[#b8b4ae] hover:text-[#2d2a24]">返回板块设置</button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Dimensions */}
        <Section title="尺寸">
          <div className="grid grid-cols-2 gap-2">
            <Field label="宽度">
              <input value={p.width || '100%'} onChange={(e) => set({ width: e.target.value })} className={inputCls} placeholder="100% / 320px" />
            </Field>
            <Field label="高度">
              <input value={p.height || 'auto'} onChange={(e) => set({ height: e.target.value })} className={inputCls} placeholder="auto / 200px" />
            </Field>
          </div>
        </Section>

        {/* Spacing */}
        <Section title="间距">
          <div className="grid grid-cols-2 gap-2">
            <Field label="上外边距">
              <input type="number" value={p.marginTop ?? 0} onChange={(e) => set({ marginTop: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="下外边距">
              <input type="number" value={p.marginBottom ?? 0} onChange={(e) => set({ marginBottom: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="左外边距">
              <input type="number" value={p.marginLeft ?? 0} onChange={(e) => set({ marginLeft: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="右外边距">
              <input type="number" value={p.marginRight ?? 0} onChange={(e) => set({ marginRight: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="上内边距">
              <input type="number" value={p.paddingTop ?? 0} onChange={(e) => set({ paddingTop: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="下内边距">
              <input type="number" value={p.paddingBottom ?? 0} onChange={(e) => set({ paddingBottom: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="左内边距">
              <input type="number" value={p.paddingLeft ?? 0} onChange={(e) => set({ paddingLeft: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="右内边距">
              <input type="number" value={p.paddingRight ?? 0} onChange={(e) => set({ paddingRight: Number(e.target.value) })} className={numCls} />
            </Field>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="外观">
          <Field label="背景色">
            <div className="flex items-center gap-2">
              <input type="color" value={p.bgColor || '#ffffff'} onChange={(e) => set({ bgColor: e.target.value })} className="w-8 h-8 rounded border border-[#e8e4de] cursor-pointer" />
              <input value={p.bgColor || ''} onChange={(e) => set({ bgColor: e.target.value })} className={inputCls} placeholder="透明留空" />
            </div>
          </Field>
          <Field label="圆角">
            <input type="number" value={p.borderRadius ?? 0} onChange={(e) => set({ borderRadius: Number(e.target.value) })} className={numCls} />
          </Field>
        </Section>

        {/* Type-specific properties */}
        {node.type === 'section' && (
          <Section title="区块设置">
            <Field label="标题">
              <input value={(node.content as any)?.title || ''} onChange={(e) => onContentChange({ ...(node.content || {}), title: e.target.value })} className={inputCls} />
            </Field>
            <Field label="显示标题">
              <Toggle value={(node.content as any)?.showTitle !== false} onChange={(v) => onContentChange({ ...(node.content || {}), showTitle: v })} />
            </Field>
          </Section>
        )}

        {node.type === 'row' && (
          <Section title="行设置">
            <Field label="列间距">
              <input type="number" value={p.gap ?? 12} onChange={(e) => set({ gap: Number(e.target.value) })} className={numCls} />
            </Field>
          </Section>
        )}

        {node.type === 'column' && (
          <Section title="列设置">
            <Field label="垂直对齐">
              <select value={p.valign || 'top'} onChange={(e) => set({ valign: e.target.value })} className={inputCls}>
                <option value="top">顶部对齐</option>
                <option value="center">居中对齐</option>
                <option value="bottom">底部对齐</option>
              </select>
            </Field>
          </Section>
        )}

        {node.type === 'card' && (
          <Section title="卡片设置">
            <Field label="阴影">
              <select value={p.shadow || 'sm'} onChange={(e) => set({ shadow: e.target.value })} className={inputCls}>
                <option value="none">无阴影</option>
                <option value="sm">小阴影</option>
                <option value="md">中阴影</option>
                <option value="lg">大阴影</option>
              </select>
            </Field>
            <Field label="边框色">
              <input type="color" value={(node.content as any)?.borderColor || '#e8e6e0'} onChange={(e) => onContentChange({ ...(node.content || {}), borderColor: e.target.value })} className="w-8 h-8 rounded border border-[#e8e4de] cursor-pointer" />
            </Field>
          </Section>
        )}

        {node.type === 'image' && (
          <Section title="图片设置">
            <Field label="图片地址">
              <input value={(node.content as any)?.src || ''} onChange={(e) => onContentChange({ ...(node.content || {}), src: e.target.value })} className={inputCls} placeholder="https://..." />
            </Field>
            <Field label="适配模式">
              <select value={(node.content as any)?.fitMode || 'fit-width'} onChange={(e) => onContentChange({ ...(node.content || {}), fitMode: e.target.value })} className={inputCls}>
                <option value="fit-width">适应宽度（推荐）</option>
                <option value="original">原始尺寸</option>
                <option value="cover">填充裁切</option>
              </select>
            </Field>
            <Field label="说明文字">
              <input value={(node.content as any)?.caption || ''} onChange={(e) => onContentChange({ ...(node.content || {}), caption: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Alt 文本">
              <input value={(node.content as any)?.alt || ''} onChange={(e) => onContentChange({ ...(node.content || {}), alt: e.target.value })} className={inputCls} />
            </Field>
          </Section>
        )}

        {node.type === 'gallery' && (
          <Section title="图片组设置">
            <Field label="列数">
              <input type="number" value={(node.content as any)?.columns || 3} onChange={(e) => onContentChange({ ...(node.content || {}), columns: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="间距">
              <input type="number" value={(node.content as any)?.gap ?? 8} onChange={(e) => onContentChange({ ...(node.content || {}), gap: Number(e.target.value) })} className={numCls} />
            </Field>
          </Section>
        )}

        {node.type === 'divider' && (
          <Section title="分隔线设置">
            <Field label="线宽">
              <input type="number" value={p.lineWidth ?? 1} onChange={(e) => set({ lineWidth: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="颜色">
              <input type="color" value={p.lineColor || '#e8e6e0'} onChange={(e) => set({ lineColor: e.target.value })} className="w-8 h-8 rounded border border-[#e8e4de] cursor-pointer" />
            </Field>
          </Section>
        )}

        {node.type === 'spacer' && (
          <Section title="留白设置">
            <Field label="高度">
              <input value={p.height || '24px'} onChange={(e) => set({ height: e.target.value })} className={inputCls} placeholder="如 48px" />
            </Field>
          </Section>
        )}
      </div>
    </div>
  );
}

/** Section settings panel (shown when no node is selected) */
function SectionSettings({ section, onUpdate, onSave }: { section: Section; onUpdate: (updated: Partial<Section>) => void; onSave: (updated: Partial<Section>) => void }) {
  const style = section.style_config || {};
  const page = style.page || {};

  const updateStyle = (key: string, value: any) => {
    const updated = { ...section, style_config: { ...style, [key]: value } };
    onUpdate(updated);
    onSave(updated);
  };

  const changePage = (key: string, value: any) => {
    const updated = { ...section, style_config: { ...style, page: { ...page, [key]: value } } };
    onUpdate(updated);
    onSave(updated);
  };

  const updateField = (key: keyof Section, value: any) => {
    const updated = { ...section, [key]: value } as Section;
    onUpdate(updated);
    onSave(updated);
  };

  return (
    <div className="w-64 bg-white border-l border-[#e8e4de] flex flex-col overflow-hidden flex-shrink-0">
      <div className="px-3 py-2 border-b border-[#e8e4de] flex-shrink-0">
        <p className="text-sm font-medium text-[#2d2a24]">板块设置</p>
        <p className="text-[10px] text-[#b8b4ae] mt-0.5">选中画板元素查看元素属性</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Basic */}
        <Section title="基本信息">
          <Field label="板块名称">
            <input type="text" value={section.name} onChange={e => updateField('name', e.target.value)} className={inputCls} />
          </Field>
          <Field label="在前台显示">
            <Toggle value={section.is_visible} onChange={(v) => updateField('is_visible', v)} />
          </Field>
        </Section>

        {/* Page config */}
        <Section title="页面配置">
          <Field label="显示在导航">
            <Toggle value={page.show_in_nav ?? true} onChange={(v) => changePage('show_in_nav', v)} />
          </Field>
          <Field label="页面副标题">
            <input type="text" value={page.subtitle || ''} onChange={e => changePage('subtitle', e.target.value)} placeholder="记录成长的每一刻" className={inputCls} />
          </Field>
          <Field label="封面图 URL">
            <input type="text" value={page.cover_image || ''} onChange={e => changePage('cover_image', e.target.value)} placeholder="https://..." className={inputCls} />
          </Field>
        </Section>

        {/* Colors */}
        <Section title="颜色">
          <Field label="背景颜色">
            <div className="flex items-center gap-2">
              <input type="color" value={style.bg_color || '#ffffff'} onChange={e => updateStyle('bg_color', e.target.value)} className="w-8 h-8 rounded border border-[#e8e4de] cursor-pointer" />
              <span className="text-xs text-[#b8b4ae]">{style.bg_color || '#ffffff'}</span>
            </div>
          </Field>
          <Field label="文字颜色">
            <div className="flex items-center gap-2">
              <input type="color" value={style.text_color || '#2d2a24'} onChange={e => updateStyle('text_color', e.target.value)} className="w-8 h-8 rounded border border-[#e8e4de] cursor-pointer" />
              <span className="text-xs text-[#b8b4ae]">{style.text_color || '#2d2a24'}</span>
            </div>
          </Field>
        </Section>

        {/* Layout */}
        <Section title="布局">
          <Field label="每行显示">
            <select value={style.columns || 1} onChange={e => updateStyle('columns', parseInt(e.target.value))} className={inputCls}>
              <option value={1}>1 列</option>
              <option value={2}>2 列</option>
              <option value={3}>3 列</option>
            </select>
          </Field>
        </Section>

        {/* Display options */}
        <Section title="展示选项">
          {[
            { key: 'show_date', label: '显示时间', defaultVal: true },
            { key: 'show_tags', label: '显示标签', defaultVal: true },
            { key: 'show_border', label: '显示边框', defaultVal: true },
          ].map(opt => {
            const currentVal = (style as any)[opt.key];
            const val = currentVal !== undefined ? currentVal : opt.defaultVal;
            return (
              <Field key={opt.key} label={opt.label}>
                <Toggle value={val} onChange={(v) => updateStyle(opt.key, v)} />
              </Field>
            );
          })}
        </Section>
      </div>
    </div>
  );
}

// ---- UI helpers ----

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[#8b8b8b] mb-1.5 uppercase tracking-wide">{title}</p>
      <div className="space-y-2">{children}</div>
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

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors ${value ? 'bg-[#2d2a24]' : 'bg-[#e8e4de]'} relative`}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}
