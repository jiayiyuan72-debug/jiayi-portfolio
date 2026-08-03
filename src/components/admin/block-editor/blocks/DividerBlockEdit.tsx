'use client';

import { Block, DividerStyle } from '@/types/block';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
}

const STYLES: { value: DividerStyle; label: string }[] = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
];

export default function DividerBlockEdit({ block, onChange }: Props) {
  const p = block.props || {};

  const setProps = (patch: Record<string, any>) => {
    onChange({ ...block, props: { ...p, ...patch } });
  };

  return (
    <div>
      <label className="block text-xs text-[#8b8b8b] mb-2">分隔线样式</label>
      <div className="flex gap-2">
        {STYLES.map(s => (
          <button
            key={s.value}
            onClick={() => setProps({ style: s.value })}
            className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
              (p.style || 'solid') === s.value
                ? 'bg-[#2d2a24] text-white border-[#2d2a24]'
                : 'bg-[#f8f5f0] text-[#5a5349] border-[#e8e4de] hover:bg-[#e8e4de]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
