import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

interface TodoUiState {
  expandedIds: Set<string>;
  selectedId: string | null;
  isDetailEditing: boolean;
  showCompleted: boolean;
  sortBy: 'position' | 'createdAt' | 'updatedAt' | 'title';
  sortOrder: 'asc' | 'desc';
  searchQuery: string;
  filterTagIds: string[];
  toolbarExpanded: boolean;
}

interface TodoUiActions {
  toggleExpanded: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
  setExpanded: (id: string, expanded: boolean) => void;
  setSelectedId: (id: string | null) => void;
  setDetailEditing: (editing: boolean) => void;
  setShowCompleted: (show: boolean) => void;
  setSortBy: (sortBy: TodoUiState['sortBy']) => void;
  setSortOrder: (order: TodoUiState['sortOrder']) => void;
  setSearchQuery: (query: string) => void;
  setFilterTagIds: (ids: string[]) => void;
  clearFilters: () => void;
  toggleToolbar: () => void;
}

type TodoUiStore = TodoUiState & TodoUiActions;

const initialState: TodoUiState = {
  expandedIds: new Set(),
  selectedId: null,
  isDetailEditing: false,
  showCompleted: true,
  sortBy: 'position',
  sortOrder: 'asc',
  searchQuery: '',
  filterTagIds: [],
  toolbarExpanded: false,
};

export const useTodoUiStore = create<TodoUiStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      toggleExpanded: (id) => {
        const expandedIds = new Set(get().expandedIds);
        if (expandedIds.has(id)) {
          expandedIds.delete(id);
        } else {
          expandedIds.add(id);
        }
        set({ expandedIds });
      },

      expandAll: (ids) => {
        set({ expandedIds: new Set(ids) });
      },

      collapseAll: () => {
        set({ expandedIds: new Set() });
      },

      setExpanded: (id, expanded) => {
        const expandedIds = new Set(get().expandedIds);
        if (expanded) {
          expandedIds.add(id);
        } else {
          expandedIds.delete(id);
        }
        set({ expandedIds });
      },

      setSelectedId: (id) => set({ selectedId: id, isDetailEditing: false }),
      setDetailEditing: (editing) => set({ isDetailEditing: editing }),
      setShowCompleted: (show) => set({ showCompleted: show }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterTagIds: (ids) => set({ filterTagIds: ids }),
      clearFilters: () =>
        set({
          searchQuery: '',
          filterTagIds: [],
        }),
      toggleToolbar: () => set((state) => ({ toolbarExpanded: !state.toolbarExpanded })),
    }),
    {
      name: 'todo-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        expandedIds: Array.from(state.expandedIds),
        showCompleted: state.showCompleted,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
      // Fix M4: try/catch around Set deserialization
      merge: (persisted, current) => {
        try {
          const persistedState = persisted as Partial<TodoUiState & { expandedIds: string[] }>;
          return {
            ...current,
            ...persistedState,
            expandedIds: new Set(
              Array.isArray(persistedState.expandedIds) ? persistedState.expandedIds : [],
            ),
          };
        } catch {
          console.warn('[TodoUiStore] Failed to deserialize persisted state, using defaults');
          return current;
        }
      },
    },
  ),
);

// Selector hooks
export const useExpandedIds = () => useTodoUiStore((state) => state.expandedIds);
export const useSelectedTodoId = () => useTodoUiStore((state) => state.selectedId);
export const useShowCompleted = () => useTodoUiStore((state) => state.showCompleted);
// Fix M3: Use useShallow to prevent re-renders when object ref changes
export const useTodoFilters = () =>
  useTodoUiStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      filterTagIds: state.filterTagIds,
    })),
  );
