export type ThemeId = 'dark' | 'pink' | 'marine' | 'gold';

export interface ThemeColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgElevated: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  borderDefault: string;
  borderHover: string;
  accent: string;
  accentHover: string;
  accentSubtle: string;
  navBg: string;
  navBorder: string;
  gradient: string;
  gradientSubtle: string;
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  preview: string; // gradient for the preview swatch
}

export const themes: Record<ThemeId, ThemeColors> = {
  dark: {
    bgPrimary: '#0a0a0f',
    bgSecondary: '#12121a',
    bgTertiary: '#1a1a2e',
    bgElevated: '#22223a',
    textPrimary: '#e8e8f0',
    textSecondary: '#8888a0',
    textTertiary: '#555570',
    borderDefault: '#2a2a40',
    borderHover: '#3a3a55',
    accent: '#7c3aed',
    accentHover: '#6d28d9',
    accentSubtle: 'rgba(124, 58, 237, 0.12)',
    navBg: 'rgba(18, 18, 26, 0.92)',
    navBorder: 'rgba(124, 58, 237, 0.2)',
    gradient: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
    gradientSubtle: 'linear-gradient(135deg, #7c3aed20, #3b82f620)',
  },
  pink: {
    bgPrimary: '#10060c',
    bgSecondary: '#1a0e16',
    bgTertiary: '#2a1524',
    bgElevated: '#3a1e32',
    textPrimary: '#f0e8ec',
    textSecondary: '#a08890',
    textTertiary: '#705868',
    borderDefault: '#3d2035',
    borderHover: '#55304a',
    accent: '#ec4899',
    accentHover: '#db2777',
    accentSubtle: 'rgba(236, 72, 153, 0.12)',
    navBg: 'rgba(26, 14, 22, 0.92)',
    navBorder: 'rgba(236, 72, 153, 0.2)',
    gradient: 'linear-gradient(135deg, #ec4899, #f43f5e)',
    gradientSubtle: 'linear-gradient(135deg, #ec489920, #f43f5e20)',
  },
  marine: {
    bgPrimary: '#060c14',
    bgSecondary: '#0c1624',
    bgTertiary: '#122238',
    bgElevated: '#1a3050',
    textPrimary: '#e8f0f8',
    textSecondary: '#7898b8',
    textTertiary: '#506880',
    borderDefault: '#1e3550',
    borderHover: '#2a4868',
    accent: '#0ea5e9',
    accentHover: '#0284c7',
    accentSubtle: 'rgba(14, 165, 233, 0.12)',
    navBg: 'rgba(12, 22, 36, 0.92)',
    navBorder: 'rgba(14, 165, 233, 0.2)',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
    gradientSubtle: 'linear-gradient(135deg, #0ea5e920, #06b6d420)',
  },
  gold: {
    bgPrimary: '#0f0c06',
    bgSecondary: '#1a1608',
    bgTertiary: '#2a2410',
    bgElevated: '#3a3218',
    textPrimary: '#f5f0e0',
    textSecondary: '#b8a878',
    textTertiary: '#807050',
    borderDefault: '#3a3018',
    borderHover: '#504828',
    accent: '#eab308',
    accentHover: '#ca8a04',
    accentSubtle: 'rgba(234, 179, 8, 0.12)',
    navBg: 'rgba(26, 22, 8, 0.92)',
    navBorder: 'rgba(234, 179, 8, 0.2)',
    gradient: 'linear-gradient(135deg, #eab308, #f59e0b)',
    gradientSubtle: 'linear-gradient(135deg, #eab30820, #f59e0b20)',
  },
};

export const themeMetas: ThemeMeta[] = [
  { id: 'dark', name: 'Dark Purple', preview: 'linear-gradient(135deg, #7c3aed, #3b82f6)' },
  { id: 'pink', name: 'Pink Rose', preview: 'linear-gradient(135deg, #ec4899, #f43f5e)' },
  { id: 'marine', name: 'Blue Marine', preview: 'linear-gradient(135deg, #0ea5e9, #06b6d4)' },
  { id: 'gold', name: 'Gold Luxe', preview: 'linear-gradient(135deg, #eab308, #f59e0b)' },
];
