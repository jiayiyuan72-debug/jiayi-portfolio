'use client';

import { create } from 'zustand';
import { PageContainer } from '@/types/page-layout';

// undo/redo 历史：past / present / future
interface HistoryState {
  past: PageContainer[][];
  present: PageContainer[];
  future: PageContainer[][];
}

export const GRID_SIZE_OPTIONS = [4, 8, 12, 20];
const MAX_HISTORY = 50;

interface BuilderState extends HistoryState {
  selectedIds: string[];
  snapEnabled: boolean;
  gridSize: number;
  // 对齐线（拖拽过程中实时，画布显示用）
  guides: { x?: number; y?: number }[];

  setContainers: (containers: PageContainer[], recordHistory?: boolean) => void;
  select: (id: string, additive?: boolean) => void;
  selectMany: (ids: string[]) => void;
  clearSelection: () => void;
  addContainer: (c: PageContainer) => void;
  updateContainer: (id: string, patch: Partial<PageContainer>) => void;
  removeContainers: (ids: string[]) => void;
  removeChildren: (parentId: string) => void;
  duplicate: (id: string) => void;
  setSnap: (v: boolean) => void;
  setGridSize: (n: number) => void;
  setGuides: (g: { x?: number; y?: number }[]) => void;
  undo: () => void;
  redo: () => void;
  commit: () => void; // 把当前快照压入 past 并清 future
}

function buildTree(containers: PageContainer[], parentId: string | null): PageContainer[] {
  return containers
    .filter(c => c.parentId === parentId)
    .sort((a, b) => a.z - b.z);
}

// 计算某容器在树中的深度（根级为 1）
export function getContainerDepth(containers: PageContainer[], id: string | null): number {
  if (!id) return 0;
  let depth = 0;
  let cur: PageContainer | undefined = containers.find(c => c.id === id);
  while (cur && cur.parentId) {
    depth++;
    cur = containers.find(c => c.id === cur!.parentId);
  }
  return cur ? depth + 1 : 1;
}

export { buildTree };

export const useBuilderStore = create<BuilderState>((set) => ({
  past: [],
  present: [],
  future: [],
  selectedIds: [],
  snapEnabled: true,
  gridSize: 8,
  guides: [],

  setContainers: (containers, recordHistory = true) =>
    set(state => {
      let past = state.past;
      let future: PageContainer[][] = [];
      if (recordHistory) {
        past = [...state.past, state.present].slice(-MAX_HISTORY);
        future = [];
      }
      return { past, present: containers, future };
    }),

  select: (id, additive = false) =>
    set(state => ({
      selectedIds: additive
        ? state.selectedIds.includes(id)
          ? state.selectedIds.filter(s => s !== id)
          : [...state.selectedIds, id]
        : [id],
    })),

  selectMany: ids => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  addContainer: c =>
    set(state => ({
      past: [...state.past, state.present],
      future: [],
      present: [...state.present, c],
      selectedIds: [c.id],
    })),

  updateContainer: (id, patch) =>
    set(state => ({
      present: state.present.map(c => (c.id === id ? { ...c, ...patch } : c)),
    })),

  removeContainers: ids =>
    set(state => {
      const idSet = new Set(ids);
      // 连同子级一起删
      let present = [...state.present];
      let changed = true;
      while (changed) {
        changed = false;
        present = present.filter(c => {
          if (idSet.has(c.id)) { changed = true; return false; }
          if (c.parentId && idSet.has(c.parentId)) { idSet.add(c.id); changed = true; return false; }
          return true;
        });
      }
      return {
        past: [...state.past, state.present],
        future: [],
        present,
        selectedIds: [],
      };
    }),

  removeChildren: parentId =>
    set(state => {
      const ids = new Set([parentId]);
      let present = [...state.present];
      let changed = true;
      while (changed) {
        changed = false;
        present = present.filter(c => {
          if (c.parentId && ids.has(c.parentId)) { ids.add(c.id); changed = true; return false; }
          return true;
        });
      }
      return { ...state, present, selectedIds: [] };
    }),

  duplicate: id =>
    set(state => {
      const src = state.present.find(c => c.id === id);
      if (!src) return state;
      const copy: PageContainer = { ...src, id: crypto.randomUUID(), x: src.x + 16, y: src.y + 16 };
      return {
        past: [...state.past, state.present],
        future: [],
        present: [...state.present, copy],
        selectedIds: [copy.id],
      };
    }),

  setSnap: v => set({ snapEnabled: v }),
  setGridSize: n => set({ gridSize: n }),
  setGuides: g => set({ guides: g }),

  undo: () =>
    set(state => {
      if (state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        past: state.past.slice(0, -1),
        present: previous,
        future: [state.present, ...state.future].slice(0, MAX_HISTORY),
        selectedIds: [],
      };
    }),

  redo: () =>
    set(state => {
      if (state.future.length === 0) return state;
      const next = state.future[0];
      return {
        past: [...state.past, state.present].slice(-MAX_HISTORY),
        present: next,
        future: state.future.slice(1),
        selectedIds: [],
      };
    }),

  commit: () =>
    set(state => ({
      past: [...state.past, state.present].slice(-MAX_HISTORY),
      future: [],
    })),
}));
