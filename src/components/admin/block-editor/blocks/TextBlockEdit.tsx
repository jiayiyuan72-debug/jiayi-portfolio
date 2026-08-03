'use client';

import { Block } from '@/types/block';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
}

export default function TextBlockEdit({ block, onChange }: Props) {
  const p = block.props || {};

  const setProps = (patch: Record<string, any>) => {
    onChange({ ...block, props: { ...p, ...patch } });
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs text-[#8b8b8b] mb-1">文本内容</label>
        <textarea
          value={p.content || ''}
          onChange={e => setProps({ content: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#d4a574]/30"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-1">对齐</label>
          <select
            value={p.align || 'left'}
            onChange={e => setProps({ align: e.target.value })}
            className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
          >
            <option value="left">左对齐</option>
            <option value="center">居中</option>
            <option value="right">右对齐</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-[#8b8b8b] mb-1">字号</label>
          <select
            value={p.fontSize || 'md'}
            onChange={e => setProps({ fontSize: e.target.value })}
            className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm"
          >
            <option value="sm">小</option>
            <option value="md">中</option>
            <option value="lg">大</option>
          </select>
        </div>
      </div>
    </div>
  );
}
