'use client';

import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Block, BlockType, DEFAULT_BLOCK_PROPS } from '@/types/block';
import BlockPanel from './BlockPanel';
import BlockItem from './BlockItem';

interface Props {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
}

/** 块编辑器主组件：画布 + 拖拽排序 + 块增删改/复制/上移下移 */
export default function BlockEditor({ blocks, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: crypto.randomUUID(),
      type,
      props: { ...DEFAULT_BLOCK_PROPS[type] },
    };
    onChange([...blocks, newBlock]);
  };

  const updateBlock = (block: Block) => {
    onChange(blocks.map(b => (b.id === block.id ? block : b)));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const duplicateBlock = (id: string) => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const source = blocks[idx];
    const copy: Block = { ...source, id: crypto.randomUUID(), props: { ...source.props } };
    const next = [...blocks];
    next.splice(idx + 1, 0, copy);
    onChange(next);
  };

  const moveBlock = (id: string, dir: -1 | 1) => {
    const idx = blocks.findIndex(b => b.id === id);
    const to = idx + dir;
    if (idx < 0 || to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(idx, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = blocks.findIndex(b => b.id === active.id);
    const newIndex = blocks.findIndex(b => b.id === over.id);
    const reordered = [...blocks];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    onChange(reordered);
  };

  return (
    <div className="space-y-3">
      <BlockPanel onAdd={addBlock} />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
          <div className="min-h-[100px] rounded-xl border-2 border-dashed border-[#e8e4de] p-2 bg-[#fcfaf7]">
            {blocks.map((block, i) => (
              <BlockItem
                key={block.id}
                block={block}
                onChange={updateBlock}
                onDelete={() => removeBlock(block.id)}
                onDuplicate={() => duplicateBlock(block.id)}
                onMoveUp={() => moveBlock(block.id, -1)}
                onMoveDown={() => moveBlock(block.id, 1)}
                canUp={i > 0}
                canDown={i < blocks.length - 1}
              />
            ))}

            {blocks.length === 0 && (
              <p className="text-center text-sm text-[#b8b4ae] py-10">
                点击上方组件或拖拽添加内容块
              </p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
