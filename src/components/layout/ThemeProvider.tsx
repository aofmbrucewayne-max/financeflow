'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/lib/stores/themeStore';
import { themes } from '@/lib/themes';

export function ThemeProvider() {
  const themeId = useThemeStore((s) => s.themeId);

  useEffect(() => {
    const colors = themes[themeId];
    const root = document.documentElement;
    root.style.setProperty('--bg-primary', colors.bgPrimary);
    root.style.setProperty('--bg-secondary', colors.bgSecondary);
    root.style.setProperty('--bg-tertiary', colors.bgTertiary);
    root.style.setProperty('--bg-elevated', colors.bgElevated);
    root.style.setProperty('--text-primary', colors.textPrimary);
    root.style.setProperty('--text-secondary', colors.textSecondary);
    root.style.setProperty('--text-tertiary', colors.textTertiary);
    root.style.setProperty('--border-default', colors.borderDefault);
    root.style.setProperty('--border-hover', colors.borderHover);
    root.style.setProperty('--ff-accent', colors.accent);
    root.style.setProperty('--ff-accent-hover', colors.accentHover);
    root.style.setProperty('--ff-accent-subtle', colors.accentSubtle);
    root.style.setProperty('--ff-nav-bg', colors.navBg);
    root.style.setProperty('--ff-nav-border', colors.navBorder);
    root.style.setProperty('--ff-gradient', colors.gradient);
    root.style.setProperty('--ff-gradient-subtle', colors.gradientSubtle);
    document.body.style.backgroundColor = colors.bgPrimary;
    document.body.style.color = colors.textPrimary;
  }, [themeId]);

  return null;
}
