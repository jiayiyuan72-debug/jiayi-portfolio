'use client';

import { BlockType, BLOCK_TYPE_LABELS } from '@/types/block';

interface Props {
  onAdd: (type: BlockType) => void;
}

/** 顶部组件面板：列出所有可用 Block 类型，点击添加到画布底部 */
export default function BlockPanel({ onAdd }: Props) {
  const types = Object.keys(BLOCK_TYPE_LABELS) as BlockType[];

  return (
    <div className="bg-white border border-[#e8e4de] rounded-xl p-3">
      <p className="text-xs text-[#8b8b8b] mb-2">组件面板 — 点击添加到文末</p>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {types.map(type => (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border border-[#e8e4de] bg-[#f8f5f0] hover:border-[#d4a574] hover:bg-white transition-colors"
          >
            <span className="text-lg">{BLOCK_TYPE_LABELS[type].icon}</span>
            <span className="text-xs text-[#2d2a24]">{BLOCK_TYPE_LABELS[type].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
