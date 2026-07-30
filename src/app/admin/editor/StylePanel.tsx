'use client';

import { Section } from '@/types/section';

interface Props {
  section: Section | null;
  onChange: (updated: Partial<Section>) => void;
}

const LAYOUT_OPTIONS = [
  { value: 'timeline', label: '时间轴', icon: '📅' },
  { value: 'card', label: '卡片列表', icon: '🃏' },
  { value: 'gallery', label: '图片画廊', icon: '🖼️' },
  { value: 'article', label: '文章列表', icon: '📝' },
  { value: 'travelogue', label: '游记', icon: '✈️' },
  { value: 'diary', label: '日记流', icon: '📓' },
  { value: 'mixed', label: '混合布局', icon: '📦' },
];

export default function StylePanel({ section, onChange }: Props) {
  if (!section) {
    return (
      <div className="w-80 bg-white border-l border-[#e8e4de] flex items-center justify-center text-sm text-[#b8b4ae] p-4 flex-shrink-0">
        选择板块以设置样式
      </div>
    );
  }

  const style = section.style_config || {};

  const updateStyle = (key: string, value: any) => {
    onChange({
      ...section,
      style_config: { ...style, [key]: value },
    });
  };

  return (
    <div className="w-80 bg-white border-l border-[#e8e4de] overflow-y-auto flex-shrink-0">
      <div className="p-4 border-b border-[#e8e4de]">
        <h3 className="text-sm font-bold text-[#2d2a24]">板块设置</h3>
      </div>

      <div className="p-4 space-y-5">
        {/* 板块名称 */}
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-1">板块名称</label>
          <input
            type="text"
            value={section.name}
            onChange={e => onChange({ ...section, name: e.target.value })}
            className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
          />
        </div>

        {/* 显示/隐藏 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#2d2a24]">在前台显示</span>
          <button
            onClick={() => onChange({ ...section, is_visible: !section.is_visible })}
            className={`w-11 h-6 rounded-full transition-colors ${
              section.is_visible ? 'bg-[#2d2a24]' : 'bg-[#e8e4de]'
            } relative`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              section.is_visible ? 'translate-x-5.5' : 'translate-x-0.5'
            }`} />
          </button>
        </div>

        {/* 布局类型 */}
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-2">布局方式</label>
          <div className="grid grid-cols-2 gap-2">
            {LAYOUT_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange({ ...section, layout_type: opt.value as any })}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                  section.layout_type === opt.value
                    ? 'bg-[#2d2a24] text-white'
                    : 'bg-[#f8f5f0] text-[#5a5349] hover:bg-[#e8e4de]'
                }`}
              >
                <span>{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 背景色 */}
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-1">背景颜色</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={style.bg_color || '#ffffff'}
              onChange={e => updateStyle('bg_color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-[#e8e4de] cursor-pointer"
            />
            <span className="text-xs text-[#b8b4ae]">{style.bg_color || '#ffffff'}</span>
          </div>
        </div>

        {/* 文字颜色 */}
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-1">文字颜色</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={style.text_color || '#2d2a24'}
              onChange={e => updateStyle('text_color', e.target.value)}
              className="w-10 h-10 rounded-lg border border-[#e8e4de] cursor-pointer"
            />
            <span className="text-xs text-[#b8b4ae]">{style.text_color || '#2d2a24'}</span>
          </div>
        </div>

        {/* 每行列数 */}
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-1">每行显示</label>
          <select
            value={style.columns || 1}
            onChange={e => updateStyle('columns', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
          >
            <option value={1}>1 列</option>
            <option value={2}>2 列</option>
            <option value={3}>3 列</option>
            <option value={4}>4 列</option>
          </select>
        </div>

        {/* 开关选项 */}
        <div className="space-y-3 pt-2 border-t border-[#e8e4de]">
          <h4 className="text-xs font-medium text-[#8b8b8b]">展示选项</h4>
          {[
            { key: 'show_date', label: '显示时间', defaultVal: true },
            { key: 'show_tags', label: '显示标签', defaultVal: true },
            { key: 'show_mood', label: '显示心情', defaultVal: false },
            { key: 'show_border', label: '显示边框', defaultVal: true },
            { key: 'show_captions', label: '显示说明文字', defaultVal: false },
          ].map(opt => {
            const currentVal = (style as any)[opt.key];
            const val = currentVal !== undefined ? currentVal : opt.defaultVal;
            return (
              <div key={opt.key} className="flex items-center justify-between">
                <span className="text-sm text-[#2d2a24]">{opt.label}</span>
                <button
                  onClick={() => updateStyle(opt.key, !val)}
                  className={`w-9 h-5 rounded-full transition-colors ${val ? 'bg-[#2d2a24]' : 'bg-[#e8e4de]'} relative`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${val ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              );
            })}
          ))}
        </div>
      </div>
    </div>
  );
}
