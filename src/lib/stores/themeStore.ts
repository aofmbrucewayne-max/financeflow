import { create } from 'zustand';
import { themes, type ThemeId, type ThemeColors } from '../themes';

interface ThemeState {
  themeId: ThemeId;
  colors: ThemeColors;
  setTheme: (id: ThemeId) => void;
}

function loadSavedTheme(): ThemeId {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('ff-theme') as ThemeId) || 'dark';
}

function applyThemeToDOM(colors: ThemeColors) {
  if (typeof document === 'undefined') return;
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
  // Also update body bg
  document.body.style.backgroundColor = colors.bgPrimary;
  document.body.style.color = colors.textPrimary;
}

const initialTheme = loadSavedTheme();

export const useThemeStore = create<ThemeState>((set) => ({
  themeId: initialTheme,
  colors: themes[initialTheme],
  setTheme: (id: ThemeId) => {
    const colors = themes[id];
    localStorage.setItem('ff-theme', id);
    applyThemeToDOM(colors);
    set({ themeId: id, colors });
  },
}));

// Apply on first load
if (typeof window !== 'undefined') {
  applyThemeToDOM(themes[initialTheme]);
}
