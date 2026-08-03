'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, BlockType, BLOCK_TYPE_LABELS } from '@/types/block';
import TextBlockEdit from './blocks/TextBlockEdit';
import HeadingBlockEdit from './blocks/HeadingBlockEdit';
import ImageBlockEdit from './blocks/ImageBlockEdit';
import QuoteBlockEdit from './blocks/QuoteBlockEdit';
import DividerBlockEdit from './blocks/DividerBlockEdit';
import SpacerBlockEdit from './blocks/SpacerBlockEdit';

interface Props {
  block: Block;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canUp: boolean;
  canDown: boolean;
}

const EDITORS: Record<BlockType, React.ComponentType<{ block: Block; onChange: (b: Block) => void }>> = {
  text: TextBlockEdit,
  heading: HeadingBlockEdit,
  image: ImageBlockEdit,
  quote: QuoteBlockEdit,
  divider: DividerBlockEdit,
  spacer: SpacerBlockEdit,
};

export default function BlockItem({ block, onChange, onDelete, onDuplicate, onMoveUp, onMoveDown, canUp, canDown }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const Editor = EDITORS[block.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative bg-white border border-[#e8e4de] rounded-xl mb-2 hover:border-[#d4a574] transition-colors"
    >
      {/* 顶栏：拖拽手柄 + 类型 + 操作按钮 */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#e8e4de] bg-[#f8f5f0] rounded-t-xl">
        <span {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-[#b8b4ae] hover:text-[#2d2a24]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
            <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
            <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
          </svg>
        </span>

        <span className="text-xs text-[#8b8b8b] flex items-center gap-1">
          {BLOCK_TYPE_LABELS[block.type].icon} {BLOCK_TYPE_LABELS[block.type].label}
        </span>

        <div className="flex-1" />

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMoveUp}
            disabled={!canUp}
            title="上移"
            className="p-1 text-xs text-[#8b8b8b] hover:text-[#2d2a24] disabled:opacity-30"
          >
            ↑
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canDown}
            title="下移"
            className="p-1 text-xs text-[#8b8b8b] hover:text-[#2d2a24] disabled:opacity-30"
          >
            ↓
          </button>
          <button
            onClick={onDuplicate}
            title="复制"
            className="p-1 text-xs text-[#8b8b8b] hover:text-[#2d2a24]"
          >
            ⧉
          </button>
          <button
            onClick={() => { if (confirm('删除此块？')) onDelete(); }}
            title="删除"
            className="p-1 text-xs text-[#8b8b8b] hover:text-red-400"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 编辑区 */}
      <div className="p-3">
        <Editor block={block} onChange={onChange} />
      </div>
    </div>
  );
}
