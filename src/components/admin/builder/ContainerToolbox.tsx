'use client';

import { PageContainerType, CONTAINER_TYPE_LABELS, defaultContainer } from '@/types/page-layout';
import { useBuilderStore } from './store';

/** 左侧容器库：点击添加，或拖拽把手拖到画布 */
export default function ContainerToolbox() {
  const addContainer = useBuilderStore(s => s.addContainer);

  const types = Object.keys(CONTAINER_TYPE_LABELS) as PageContainerType[];

  const add = (type: PageContainerType) => {
    addContainer(defaultContainer(type));
  };

  const onDragStart = (type: PageContainerType) => (e: React.DragEvent) => {
    e.dataTransfer.setData('application/x-container-type', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="w-40 bg-white border-r border-[#e8e4de] p-3 flex-shrink-0 overflow-y-auto">
      <p className="text-xs text-[#8b8b8b] mb-2">容器库（点击或拖拽添加）</p>
      <div className="grid grid-cols-2 gap-1.5">
        {types.map(type => (
          <button
            key={type}
            draggable
            onDragStart={onDragStart(type)}
            onClick={() => add(type)}
            className="flex flex-col items-center gap-1 px-1 py-2 rounded-lg border border-[#e8e4de] bg-[#f8f5f0] hover:border-[#d4a574] hover:bg-white transition-colors cursor-grab active:cursor-grabbing"
            title={`添加${CONTAINER_TYPE_LABELS[type].label}容器`}
          >
            <span className="text-base">{CONTAINER_TYPE_LABELS[type].icon}</span>
            <span className="text-[10px] text-[#2d2a24]">{CONTAINER_TYPE_LABELS[type].label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
