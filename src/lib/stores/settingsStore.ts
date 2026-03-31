import { create } from 'zustand';
import { db } from '../db';
import type { UserSettings } from '../types';

interface SettingsState extends UserSettings {
  isLoaded: boolean;
  load: () => Promise<void>;
  update: (settings: Partial<UserSettings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  baseCurrency: 'USD',
  dateFormat: 'MM/DD/YYYY',
  weekStartsOn: 'monday',
  budgetResetDay: 1,
  showCents: true,
  isLoaded: false,

  load: async () => {
    const settings = await db.settings.toArray();
    if (settings.length > 0) {
      const s = settings[0];
      set({
        ...s,
        isLoaded: true,
      });
    } else {
      set({ isLoaded: true });
    }
  },

  update: async (partial: Partial<UserSettings>) => {
    const settings = await db.settings.toArray();
    const current = get();
    const updated: UserSettings = {
      baseCurrency: current.baseCurrency,
      dateFormat: current.dateFormat,
      weekStartsOn: current.weekStartsOn,
      budgetResetDay: current.budgetResetDay,
      showCents: current.showCents,
      defaultAccountId: current.defaultAccountId,
      ...partial,
    };

    if (settings.length > 0 && settings[0].id !== undefined) {
      await db.settings.update(settings[0].id!, updated);
    } else {
      await db.settings.add(updated);
    }

    set({ ...updated });
  },
}));
