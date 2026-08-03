'use client';

import { Block } from '@/types/block';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
}

export default function QuoteBlockEdit({ block, onChange }: Props) {
  const p = block.props || {};

  const setProps = (patch: Record<string, any>) => {
    onChange({ ...block, props: { ...p, ...patch } });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-[#8b8b8b] mb-1">引用内容</label>
        <textarea
          value={p.content || ''}
          onChange={e => setProps({ content: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y"
        />
      </div>
      <div>
        <label className="block text-xs text-[#8b8b8b] mb-1">来源 / 作者</label>
        <input
          type="text"
          value={p.author || ''}
          onChange={e => setProps({ author: e.target.value })}
          placeholder="出处（可选）"
          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
        />
      </div>
    </div>
  );
}
