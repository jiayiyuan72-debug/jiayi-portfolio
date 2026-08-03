'use client';

import { Block } from '@/types/block';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
}

export default function HeadingBlockEdit({ block, onChange }: Props) {
  const p = block.props || {};

  const setProps = (patch: Record<string, any>) => {
    onChange({ ...block, props: { ...p, ...patch } });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-[#8b8b8b] mb-1">标题文字</label>
        <input
          type="text"
          value={p.content || ''}
          onChange={e => setProps({ content: e.target.value })}
          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
        />
      </div>
      <div>
        <label className="block text-xs text-[#8b8b8b] mb-1">级别</label>
        <div className="flex gap-2">
          {(['h2', 'h3', 'h4'] as const).map(level => (
            <button
              key={level}
              onClick={() => setProps({ level })}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                (p.level || 'h3') === level
                  ? 'bg-[#2d2a24] text-white'
                  : 'bg-[#f8f5f0] text-[#5a5349] hover:bg-[#e8e4de]'
              }`}
            >
              {level.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
