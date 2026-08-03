'use client';

import { useState } from 'react';
import { Block } from '@/types/block';
import BlockEditor from './BlockEditor';

interface Props {
  body: string;
  fields: Record<string, any>;
  onBodyChange: (value: string) => void;
  onFieldsChange: (fields: Record<string, any>) => void;
  /** 是否默认开启块编辑（已有 blocks 数据时） */
  defaultBlockMode?: boolean;
}

/**
 * 正文编辑字段：经典模式(textarea) / 块编辑模式(BlockEditor) 二合一。
 * 供各内容编辑器复用，统一模式切换 + body<->blocks 转换逻辑。
 */
export default function BlockModeField({ body, fields, onBodyChange, onFieldsChange, defaultBlockMode }: Props) {
  const hasBlocks = Array.isArray(fields.blocks) && fields.blocks.length > 0;
  const [mode, setMode] = useState<'classic' | 'block'>(defaultBlockMode || fields.useBlockEditor || hasBlocks ? 'block' : 'classic');
  const [blocks, setBlocks] = useState<Block[]>(hasBlocks ? fields.blocks : []);

  const syncBlocks = (list: Block[]) => {
    setBlocks(list);
    onFieldsChange({ ...fields, blocks: list, useBlockEditor: list.length > 0 });
  };

  // 经典 -> 块：body 有内容则转文本块
  const switchToBlock = () => {
    if (blocks.length === 0 && body.trim()) {
      const textBlock: Block = {
        id: crypto.randomUUID(),
        type: 'text',
        props: { content: body.trim(), align: 'left', fontSize: 'md' },
      };
      syncBlocks([textBlock]);
    }
    setMode('block');
  };

  // 块 -> 经典：文本块合并回 body
  const switchToClassic = () => {
    const textParts = blocks
      .filter(b => b.type === 'text' || b.type === 'heading')
      .map(b => (b.props.content || '').trim())
      .filter(Boolean);
    if (textParts.length > 0) onBodyChange(textParts.join('\n\n'));
    setMode('classic');
    onFieldsChange({ ...fields, useBlockEditor: false });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label className="text-xs text-[#8b8b8b]">编辑模式</label>
        <button
          type="button"
          onClick={() => { if (mode !== 'classic') switchToClassic(); }}
          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
            mode === 'classic' ? 'bg-[#2d2a24] text-white' : 'bg-[#f8f5f0] text-[#5a5349]'
          }`}
        >
          经典
        </button>
        <button
          type="button"
          onClick={() => { if (mode !== 'block') switchToBlock(); }}
          className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
            mode === 'block' ? 'bg-[#d4a574] text-white' : 'bg-[#f8f5f0] text-[#5a5349]'
          }`}
        >
          ✨ 块编辑
        </button>
      </div>

      {mode === 'classic' ? (
        <textarea
          value={body || ''}
          onChange={e => onBodyChange(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-[#e8e4de] rounded-lg text-sm resize-y"
        />
      ) : (
        <BlockEditor blocks={blocks} onChange={syncBlocks} />
      )}
    </div>
  );
}
