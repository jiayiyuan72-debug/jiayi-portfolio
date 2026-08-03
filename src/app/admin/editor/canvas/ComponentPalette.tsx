'use client';

import { WIDTH_PRESETS } from './constants';

interface Props {
  selectedSpan: number | null;
  onApplyWidth: (span: number) => void;
  onSmartArrange: () => void;
}

/** 画布顶部工具条：宽度快捷档位 + 智能排列 */
export default function ComponentPalette({ selectedSpan, onApplyWidth, onSmartArrange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border border-[#e8e4de] rounded-xl px-3 py-2">
      <span className="text-xs text-[#8b8b8b]">块宽度</span>
      <div className="flex gap-1">
        {WIDTH_PRESETS.map(p => (
          <button
            key={p.span}
            onClick={() => selectedSpan != null && onApplyWidth(p.span)}
            disabled={selectedSpan == null}
            className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
              selectedSpan === p.span
                ? 'bg-[#2d2a24] text-white'
                : 'bg-[#f8f5f0] text-[#5a5349] hover:bg-[#e8e4de] disabled:opacity-40'
            }`}
            title={`设为 ${p.span}/12 列`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      <button
        onClick={onSmartArrange}
        className="px-3 py-1 text-xs bg-[#d4a574] text-white rounded-lg hover:bg-[#c8976a] transition-colors"
        title="按内容类型自动分配宽度并凑满行"
      >
        ✨ 智能排列
      </button>

      <span className="text-xs text-[#b8b4ae]">提示：拖拽块左上角换位，拖右侧边调整宽度</span>
    </div>
  );
}
