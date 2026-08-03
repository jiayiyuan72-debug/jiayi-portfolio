'use client';

import { Block } from '@/types/block';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
}

const HEIGHTS: { value: string; label: string; px: number }[] = [
  { value: 'sm', label: '小', px: 16 },
  { value: 'md', label: '中', px: 32 },
  { value: 'lg', label: '大', px: 64 },
  { value: 'xl', label: '超大', px: 96 },
];

export default function SpacerBlockEdit({ block, onChange }: Props) {
  const p = block.props || {};

  const setProps = (patch: Record<string, any>) => {
    onChange({ ...block, props: { ...p, ...patch } });
  };

  return (
    <div>
      <label className="block text-xs text-[#8b8b8b] mb-2">留白高度</label>
      <div className="grid grid-cols-4 gap-2">
        {HEIGHTS.map(h => (
          <button
            key={h.value}
            onClick={() => setProps({ height: h.value })}
            className={`px-2 py-2 rounded-lg text-sm transition-colors ${
              (p.height || 'md') === h.value
                ? 'bg-[#2d2a24] text-white'
                : 'bg-[#f8f5f0] text-[#5a5349] hover:bg-[#e8e4de]'
            }`}
          >
            {h.label}
            <span className="block text-[10px] opacity-60">{h.px}px</span>
          </button>
        ))}
      </div>
    </div>
  );
}
