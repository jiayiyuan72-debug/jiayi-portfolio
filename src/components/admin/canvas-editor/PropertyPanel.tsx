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
    <div className="w-56 bg-white border-l border-[#e8e4de] flex flex-col overflow-hidden flex-shrink-0">
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
          <div className="flex gap-1 mt-1">
            <button type="button" onClick={() => set({ width: '100%' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">100%</button>
            <button type="button" onClick={() => set({ width: '50%' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">50%</button>
            <button type="button" onClick={() => set({ width: '33.33%' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">1/3</button>
            <button type="button" onClick={() => set({ width: '25%' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">1/4</button>
            <button type="button" onClick={() => set({ width: '200px' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">200px</button>
            <button type="button" onClick={() => set({ width: '300px' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">300px</button>
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

        {/* Typography */}
        <Section title="排版">
          {/* Quick presets */}
          <Field label="快速样式">
            <div className="flex flex-wrap gap-1">
              <button type="button" onClick={() => set({ fontSize: '32px', fontWeight: '700', lineHeight: '1.3', color: '#2d2a24' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors" style={{ fontWeight: 700 }}>大标题</button>
              <button type="button" onClick={() => set({ fontSize: '24px', fontWeight: '600', lineHeight: '1.4', color: '#2d2a24' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors" style={{ fontWeight: 600 }}>中标题</button>
              <button type="button" onClick={() => set({ fontSize: '18px', fontWeight: '600', lineHeight: '1.5', color: '#2d2a24' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors" style={{ fontWeight: 600 }}>小标题</button>
              <button type="button" onClick={() => set({ fontSize: '16px', fontWeight: '400', lineHeight: '1.7', color: '#5a5349' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">正文</button>
              <button type="button" onClick={() => set({ fontSize: '13px', fontWeight: '400', lineHeight: '1.5', color: '#8b8b8b' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">说明</button>
              <button type="button" onClick={() => set({ fontSize: '14px', fontWeight: '500', lineHeight: '1.6', color: '#d4a574' })} className="px-1.5 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors" style={{ color: '#d4a574' }}>强调</button>
            </div>
          </Field>

          {/* Font family */}
          <Field label="字体">
            <select value={p.fontFamily || ''} onChange={(e) => set({ fontFamily: e.target.value })} className={inputCls}>
              <option value="">系统默认</option>
              <option value="system-ui, -apple-system, 'Segoe UI', sans-serif">无衬线 (系统)</option>
              <option value="'Helvetica Neue', Helvetica, Arial, sans-serif">Helvetica</option>
              <option value="'Arial', sans-serif">Arial</option>
              <option value="'Georgia', 'Times New Roman', serif">Georgia 衬线</option>
              <option value="'Noto Serif SC', 'Songti SC', 'STSong', serif">宋体衬线</option>
              <option value="'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif">思源黑体</option>
              <option value="'Inter', system-ui, sans-serif">Inter</option>
              <option value="'Poppins', system-ui, sans-serif">Poppins</option>
              <option value="'Playfair Display', Georgia, serif">Playfair Display</option>
              <option value="'Lora', Georgia, serif">Lora</option>
              <option value="'JetBrains Mono', 'Courier New', monospace">等宽 Monospace</option>
            </select>
          </Field>

          {/* Font size */}
          <Field label="字号">
            <div className="flex gap-1">
              <input value={p.fontSize || ''} onChange={(e) => set({ fontSize: e.target.value })} className={inputCls} placeholder="如 16px" style={{ flex: 1 }} />
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {['12px','13px','14px','16px','18px','20px','24px','28px','32px','40px','48px'].map(s => (
              <button key={s} type="button" onClick={() => set({ fontSize: s })} className="px-1 py-0.5 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">{s}</button>
              ))}
            </div>
          </Field>

          {/* Font weight */}
          <Field label="字重">
            <select value={p.fontWeight || ''} onChange={(e) => set({ fontWeight: e.target.value })} className={inputCls}>
              <option value="">默认 (400)</option>
              <option value="300">细体 Light (300)</option>
              <option value="400">常规 Regular (400)</option>
              <option value="500">中等 Medium (500)</option>
              <option value="600">半粗 SemiBold (600)</option>
              <option value="700">粗体 Bold (700)</option>
              <option value="900">特粗 Black (900)</option>
            </select>
          </Field>

          {/* Text color */}
          <Field label="文字颜色">
            <div className="flex items-center gap-2">
              <input type="color" value={p.color || '#2d2a24'} onChange={(e) => set({ color: e.target.value })} className="w-8 h-8 rounded border border-[#e8e4de] cursor-pointer flex-shrink-0" />
              <input value={p.color || ''} onChange={(e) => set({ color: e.target.value })} className={inputCls} placeholder="#2d2a24" />
            </div>
            <div className="flex flex-wrap gap-1 mt-1">
              {['#2d2a24','#5a5349','#8b8b8b','#d4a574','#4a90e2','#e85d5d','#52c41a','#722ed1','#fa8c16','#ffffff'].map(c => (
              <button key={c} type="button" onClick={() => set({ color: c })} className="w-5 h-5 rounded border border-[#e8e4de] hover:scale-110 transition-transform" style={{ background: c }} title={c} />
              ))}
            </div>
          </Field>

          {/* Text alignment */}
          <Field label="对齐方式">
            <div className="flex gap-1">
              <button type="button" onClick={() => set({ textAlign: 'left' })} className={`flex-1 px-1 py-1 text-[10px] border rounded transition-colors ${p.textAlign === 'left' || !p.textAlign ? 'bg-[#d4a574] text-white border-[#d4a574]' : 'bg-[#f8f5f0] hover:bg-[#e8e4de] border-[#e8e4de]'}`}>左</button>
              <button type="button" onClick={() => set({ textAlign: 'center' })} className={`flex-1 px-1 py-1 text-[10px] border rounded transition-colors ${p.textAlign === 'center' ? 'bg-[#d4a574] text-white border-[#d4a574]' : 'bg-[#f8f5f0] hover:bg-[#e8e4de] border-[#e8e4de]'}`}>居中</button>
              <button type="button" onClick={() => set({ textAlign: 'right' })} className={`flex-1 px-1 py-1 text-[10px] border rounded transition-colors ${p.textAlign === 'right' ? 'bg-[#d4a574] text-white border-[#d4a574]' : 'bg-[#f8f5f0] hover:bg-[#e8e4de] border-[#e8e4de]'}`}>右</button>
              <button type="button" onClick={() => set({ textAlign: 'justify' })} className={`flex-1 px-1 py-1 text-[10px] border rounded transition-colors ${p.textAlign === 'justify' ? 'bg-[#d4a574] text-white border-[#d4a574]' : 'bg-[#f8f5f0] hover:bg-[#e8e4de] border-[#e8e4de]'}`}>两端</button>
            </div>
          </Field>

          {/* Line height */}
          <Field label="行高">
            <select value={p.lineHeight || ''} onChange={(e) => set({ lineHeight: e.target.value })} className={inputCls}>
              <option value="">默认 (1.7)</option>
              <option value="1.2">紧凑 (1.2)</option>
              <option value="1.4">较紧 (1.4)</option>
              <option value="1.5">适中 (1.5)</option>
              <option value="1.7">舒适 (1.7)</option>
              <option value="2.0">宽松 (2.0)</option>
              <option value="2.5">很宽 (2.5)</option>
            </select>
          </Field>

          {/* Letter spacing */}
          <Field label="字间距">
            <select value={p.letterSpacing || ''} onChange={(e) => set({ letterSpacing: e.target.value })} className={inputCls}>
              <option value="">默认</option>
              <option value="-0.02em">紧凑 (-0.02em)</option>
              <option value="0.02em">稍紧 (0.02em)</option>
              <option value="0.05em">稍松 (0.05em)</option>
              <option value="0.1em">宽松 (0.1em)</option>
              <option value="0.15em">很宽 (0.15em)</option>
              <option value="0.2em">超宽 (0.2em)</option>
            </select>
          </Field>

          {/* Text transform */}
          <Field label="大小写转换">
            <select value={p.textTransform || ''} onChange={(e) => set({ textTransform: e.target.value })} className={inputCls}>
              <option value="">默认</option>
              <option value="uppercase">全大写</option>
              <option value="lowercase">全小写</option>
              <option value="capitalize">首字母大写</option>
            </select>
          </Field>

          {/* Style toggles */}
          <Field label="文字样式">
            <div className="flex gap-1">
              <button type="button" onClick={() => set({ fontStyle: p.fontStyle === 'italic' ? '' : 'italic' })} className={`flex-1 px-1 py-1 text-[10px] italic border rounded transition-colors ${p.fontStyle === 'italic' ? 'bg-[#d4a574] text-white border-[#d4a574]' : 'bg-[#f8f5f0] hover:bg-[#e8e4de] border-[#e8e4de]'}`}>斜体 I</button>
              <button type="button" onClick={() => set({ textDecoration: p.textDecoration === 'underline' ? '' : 'underline' })} className={`flex-1 px-1 py-1 text-[10px] underline border rounded transition-colors ${p.textDecoration === 'underline' ? 'bg-[#d4a574] text-white border-[#d4a574]' : 'bg-[#f8f5f0] hover:bg-[#e8e4de] border-[#e8e4de]'}`}>下划线 U</button>
              <button type="button" onClick={() => set({ textDecoration: p.textDecoration === 'line-through' ? '' : 'line-through' })} className={`flex-1 px-1 py-1 text-[10px] line-through border rounded transition-colors ${p.textDecoration === 'line-through' ? 'bg-[#d4a574] text-white border-[#d4a574]' : 'bg-[#f8f5f0] hover:bg-[#e8e4de] border-[#e8e4de]'}`}>删除线 S</button>
            </div>
          </Field>

          {/* Clear typography */}
          <button type="button" onClick={() => set({ fontFamily: '', fontSize: '', fontWeight: '', fontStyle: '', textDecoration: '', color: '', textAlign: '', lineHeight: '', letterSpacing: '', textTransform: '' })} className="w-full py-1 text-[10px] text-[#b8b4ae] hover:text-red-500 border border-[#e8e4de] rounded transition-colors">清除所有排版样式</button>
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
              <input type="number" value={p.gap ?? 16} onChange={(e) => set({ gap: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="垂直对齐">
              <select value={p.alignItems || 'stretch'} onChange={(e) => set({ alignItems: e.target.value })} className={inputCls}>
                <option value="stretch">等高拉伸</option>
                <option value="start">顶部对齐</option>
                <option value="center">垂直居中</option>
                <option value="end">底部对齐</option>
              </select>
            </Field>
            <Field label="移动端堆叠">
              <Toggle value={p.responsiveStack !== false} onChange={(v) => set({ responsiveStack: v })} />
            </Field>
          </Section>
        )}

        {node.type === 'column' && (
          <Section title="列设置">
            <Field label="宽度比例">
              <select value={p.flexBasis || '1'} onChange={(e) => set({ flexBasis: e.target.value })} className={inputCls}>
                <option value="1">标准 (1:1)</option>
                <option value="2">加宽 (2:1)</option>
                <option value="3">更宽 (3:1)</option>
                <option value="0.5">窄列 (1:2)</option>
                <option value="0.333">最窄 (1:3)</option>
                <option value="auto">自适应</option>
              </select>
            </Field>
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

        {node.type === 'photo-wall' && (
          <Section title="照片墙设置">
            <Field label="列数">
              <input type="number" value={(node.content as any)?.columns || 3} onChange={(e) => onContentChange({ ...(node.content || {}), columns: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="间距">
              <input type="number" value={(node.content as any)?.gap ?? 8} onChange={(e) => onContentChange({ ...(node.content || {}), gap: Number(e.target.value) })} className={numCls} />
            </Field>
            <Field label="照片管理">
              <div className="space-y-1.5">
                <p className="text-[10px] text-[#b8b4ae]">在画布上点击照片墙可批量上传</p>
                {((node.content as any)?.images || []).map((img: any, i: number) => (
                  <div key={i} className="flex items-center gap-1.5 border border-[#e8e4de] rounded p-1">
                    <img src={img.src || img} alt="" style={{ width: 32, height: 32, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
                    <input
                      value={img.caption || ''}
                      onChange={(e) => { const images = [...(node.content as any).images]; images[i] = { ...img, caption: e.target.value }; onContentChange({ ...(node.content || {}), images }); }}
                      className={inputCls}
                      placeholder="说明文字"
                    />
                    <button
                      type="button"
                      onClick={() => { const images = [...(node.content as any).images]; images.splice(i, 1); onContentChange({ ...(node.content || {}), images }); }}
                      className="text-[10px] text-red-500 hover:text-red-700 flex-shrink-0"
                    >
                      删除
                    </button>
                  </div>
                ))}
                {((node.content as any)?.images || []).length > 0 && (
                  <button
                    type="button"
                    onClick={() => onContentChange({ ...(node.content || {}), images: [] })}
                    className="w-full py-1 text-[10px] text-red-500 hover:text-red-700 border border-red-200 rounded"
                  >
                    清空所有照片
                  </button>
                )}
              </div>
            </Field>
          </Section>
        )}

        {node.type === 'timeline' && (
          <Section title="时间轴设置">
            <Field label="时间轴项">
              <div className="space-y-2">
                {((node.content as any)?.items || []).map((item: any, i: number) => (
                  <div key={i} className="border border-[#e8e4de] rounded p-2 space-y-1.5">
                    <div className="flex gap-1">
                      <input value={item.date} onChange={(e) => { const items = [...(node.content as any).items]; items[i] = { ...item, date: e.target.value }; onContentChange({ ...(node.content || {}), items }); }} className={inputCls} placeholder="日期" style={{ width: '40%' }} />
                      <input value={item.icon} onChange={(e) => { const items = [...(node.content as any).items]; items[i] = { ...item, icon: e.target.value }; onContentChange({ ...(node.content || {}), items }); }} className={inputCls} placeholder="图标" style={{ width: '20%' }} />
                      <input value={item.title} onChange={(e) => { const items = [...(node.content as any).items]; items[i] = { ...item, title: e.target.value }; onContentChange({ ...(node.content || {}), items }); }} className={inputCls} placeholder="标题" style={{ width: '40%' }} />
                    </div>
                    <input value={item.description} onChange={(e) => { const items = [...(node.content as any).items]; items[i] = { ...item, description: e.target.value }; onContentChange({ ...(node.content || {}), items }); }} className={inputCls} placeholder="描述" />
                    <input value={item.image || ''} onChange={(e) => { const items = [...(node.content as any).items]; items[i] = { ...item, image: e.target.value }; onContentChange({ ...(node.content || {}), items }); }} className={inputCls} placeholder="图片链接（可选，留空则不显示）" />
                    <button type="button" onClick={() => { const items = [...(node.content as any).items]; items.splice(i, 1); onContentChange({ ...(node.content || {}), items }); }} className="text-[10px] text-red-500 hover:text-red-700">删除此项</button>
                  </div>
                ))}
                <button type="button" onClick={() => { const items = [...((node.content as any)?.items || []), { date: '', title: '', description: '', icon: '📌' }]; onContentChange({ ...(node.content || {}), items }); }} className="w-full py-1 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">+ 添加时间轴项</button>
              </div>
            </Field>
          </Section>
        )}

        {node.type === 'skill-bar' && (
          <Section title="技能条设置">
            <Field label="技能项">
              <div className="space-y-2">
                {((node.content as any)?.skills || []).map((s: any, i: number) => (
                  <div key={i} className="border border-[#e8e4de] rounded p-2 space-y-1.5">
                    <div className="flex gap-1">
                      <input value={s.name} onChange={(e) => { const skills = [...(node.content as any).skills]; skills[i] = { ...s, name: e.target.value }; onContentChange({ ...(node.content || {}), skills }); }} className={inputCls} placeholder="技能名" style={{ width: '50%' }} />
                      <input type="number" value={s.level} min={0} max={100} onChange={(e) => { const skills = [...(node.content as any).skills]; skills[i] = { ...s, level: Number(e.target.value) }; onContentChange({ ...(node.content || {}), skills }); }} className={numCls} placeholder="%" style={{ width: '30%' }} />
                      <input type="color" value={s.color || '#4a90e2'} onChange={(e) => { const skills = [...(node.content as any).skills]; skills[i] = { ...s, color: e.target.value }; onContentChange({ ...(node.content || {}), skills }); }} className="w-8 h-8 rounded border border-[#e8e4de] cursor-pointer" style={{ width: '20%' }} />
                    </div>
                    <button type="button" onClick={() => { const skills = [...(node.content as any).skills]; skills.splice(i, 1); onContentChange({ ...(node.content || {}), skills }); }} className="text-[10px] text-red-500 hover:text-red-700">删除此项</button>
                  </div>
                ))}
                <button type="button" onClick={() => { const skills = [...((node.content as any)?.skills || []), { name: '', level: 50, color: '#4a90e2' }]; onContentChange({ ...(node.content || {}), skills }); }} className="w-full py-1 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">+ 添加技能项</button>
              </div>
            </Field>
          </Section>
        )}

        {node.type === 'stats' && (
          <Section title="统计数字设置">
            <Field label="统计项">
              <div className="space-y-2">
                {((node.content as any)?.stats || []).map((s: any, i: number) => (
                  <div key={i} className="border border-[#e8e4de] rounded p-2 space-y-1.5">
                    <div className="flex gap-1">
                      <input value={s.icon} onChange={(e) => { const stats = [...(node.content as any).stats]; stats[i] = { ...s, icon: e.target.value }; onContentChange({ ...(node.content || {}), stats }); }} className={inputCls} placeholder="图标" style={{ width: '20%' }} />
                      <input type="number" value={s.value} onChange={(e) => { const stats = [...(node.content as any).stats]; stats[i] = { ...s, value: Number(e.target.value) }; onContentChange({ ...(node.content || {}), stats }); }} className={numCls} placeholder="数值" style={{ width: '30%' }} />
                      <input value={s.suffix} onChange={(e) => { const stats = [...(node.content as any).stats]; stats[i] = { ...s, suffix: e.target.value }; onContentChange({ ...(node.content || {}), stats }); }} className={inputCls} placeholder="后缀" style={{ width: '20%' }} />
                      <input value={s.label} onChange={(e) => { const stats = [...(node.content as any).stats]; stats[i] = { ...s, label: e.target.value }; onContentChange({ ...(node.content || {}), stats }); }} className={inputCls} placeholder="标签" style={{ width: '30%' }} />
                    </div>
                    <button type="button" onClick={() => { const stats = [...(node.content as any).stats]; stats.splice(i, 1); onContentChange({ ...(node.content || {}), stats }); }} className="text-[10px] text-red-500 hover:text-red-700">删除此项</button>
                  </div>
                ))}
                <button type="button" onClick={() => { const stats = [...((node.content as any)?.stats || []), { value: 0, suffix: '', label: '', icon: '📊' }]; onContentChange({ ...(node.content || {}), stats }); }} className="w-full py-1 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">+ 添加统计项</button>
              </div>
            </Field>
          </Section>
        )}

        {node.type === 'tags' && (
          <Section title="标签设置">
            <Field label="标签（逗号分隔）">
              <textarea value={((node.content as any)?.tags || []).join('，')} onChange={(e) => onContentChange({ ...(node.content || {}), tags: e.target.value.split(/[，,]/).map((t: string) => t.trim()).filter(Boolean) })} className={inputCls} rows={3} placeholder="React，TypeScript，Python" />
            </Field>
            <Field label="主题色">
              <div className="flex items-center gap-2">
                <input type="color" value={(node.content as any)?.color || '#4a90e2'} onChange={(e) => onContentChange({ ...(node.content || {}), color: e.target.value })} className="w-8 h-8 rounded border border-[#e8e4de] cursor-pointer" />
                <input value={(node.content as any)?.color || '#4a90e2'} onChange={(e) => onContentChange({ ...(node.content || {}), color: e.target.value })} className={inputCls} placeholder="#4a90e2" />
              </div>
            </Field>
          </Section>
        )}

        {node.type === 'video' && (
          <Section title="视频设置">
            <Field label="视频链接">
              <input value={(node.content as any)?.url || ''} onChange={(e) => onContentChange({ ...(node.content || {}), url: e.target.value })} className={inputCls} placeholder="https://www.youtube.com/watch?v=..." />
            </Field>
            <Field label="平台">
              <select value={(node.content as any)?.platform || 'youtube'} onChange={(e) => onContentChange({ ...(node.content || {}), platform: e.target.value })} className={inputCls}>
                <option value="youtube">YouTube</option>
                <option value="bilibili">Bilibili</option>
                <option value="custom">自定义</option>
              </select>
            </Field>
            <Field label="标题">
              <input value={(node.content as any)?.title || ''} onChange={(e) => onContentChange({ ...(node.content || {}), title: e.target.value })} className={inputCls} />
            </Field>
          </Section>
        )}

        {node.type === 'accordion' && (
          <Section title="折叠面板设置">
            <Field label="面板项">
              <div className="space-y-2">
                {((node.content as any)?.panels || []).map((panel: any, i: number) => (
                  <div key={i} className="border border-[#e8e4de] rounded p-2 space-y-1.5">
                    <input value={panel.title} onChange={(e) => { const panels = [...(node.content as any).panels]; panels[i] = { ...panel, title: e.target.value }; onContentChange({ ...(node.content || {}), panels }); }} className={inputCls} placeholder="标题" />
                    <textarea value={panel.content} onChange={(e) => { const panels = [...(node.content as any).panels]; panels[i] = { ...panel, content: e.target.value }; onContentChange({ ...(node.content || {}), panels }); }} className={inputCls} rows={2} placeholder="内容" />
                    <button type="button" onClick={() => { const panels = [...(node.content as any).panels]; panels.splice(i, 1); onContentChange({ ...(node.content || {}), panels }); }} className="text-[10px] text-red-500 hover:text-red-700">删除此项</button>
                  </div>
                ))}
                <button type="button" onClick={() => { const panels = [...((node.content as any)?.panels || []), { title: '', content: '' }]; onContentChange({ ...(node.content || {}), panels }); }} className="w-full py-1 text-[10px] bg-[#f8f5f0] hover:bg-[#d4a574] hover:text-white border border-[#e8e4de] rounded transition-colors">+ 添加面板项</button>
              </div>
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
    <div className="w-56 bg-white border-l border-[#e8e4de] flex flex-col overflow-hidden flex-shrink-0">
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
