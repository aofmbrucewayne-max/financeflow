import { create } from 'zustand';

export interface ActiveFilters {
  dateFrom: string;
  dateTo: string;
  accountId: string;
  categoryId: string;
  type: 'all' | 'income' | 'expense' | 'transfer';
  search: string;
}

interface UIState {
  isTransactionModalOpen: boolean;
  editingTransactionId: string | null;
  openTransactionModal: (id?: string) => void;
  closeTransactionModal: () => void;
  activeFilters: ActiveFilters;
  setFilter: <K extends keyof ActiveFilters>(key: K, value: ActiveFilters[K]) => void;
  resetFilters: () => void;
}

const defaultFilters: ActiveFilters = {
  dateFrom: '',
  dateTo: '',
  accountId: '',
  categoryId: '',
  type: 'all',
  search: '',
};

export const useUIStore = create<UIState>((set) => ({
  isTransactionModalOpen: false,
  editingTransactionId: null,

  openTransactionModal: (id?: string) =>
    set({
      isTransactionModalOpen: true,
      editingTransactionId: id ?? null,
    }),

  closeTransactionModal: () =>
    set({
      isTransactionModalOpen: false,
      editingTransactionId: null,
    }),

  activeFilters: defaultFilters,

  setFilter: (key, value) =>
    set((state) => ({
      activeFilters: { ...state.activeFilters, [key]: value },
    })),

  resetFilters: () => set({ activeFilters: defaultFilters }),
}));
