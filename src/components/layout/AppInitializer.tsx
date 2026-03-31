'use client';

import { useEffect } from 'react';
import { seedDefaultData } from '@/lib/utils/seed';
import { useSettingsStore } from '@/lib/stores/settingsStore';

export function AppInitializer() {
  const load = useSettingsStore((s) => s.load);

  useEffect(() => {
    seedDefaultData().catch(console.error);
    load().catch(console.error);
  }, [load]);

  return null;
}
