import { hasTyporaTheme } from '@/util/typoraTheme'

export interface ThemeDescriptor {
  name: string
}

const BUILT_IN_THEMES: ReadonlyArray<ThemeDescriptor> = [
  // Light Themes (alphabetical)
  { name: 'ayu-light' },
  { name: 'light' },
  { name: 'catppuccin-latte' },
  { name: 'everforest-light' },
  { name: 'graphite' },
  { name: 'gruvbox-light' },
  { name: 'rose-pine-dawn' },
  { name: 'solarized-light' },
  { name: 'tokyo-night-light' },
  { name: 'ulysses' },
  // Dark Themes (alphabetical)
  { name: 'ayu-dark' },
  { name: 'ayu-mirage' },
  { name: 'dark' },
  { name: 'catppuccin-mocha' },
  { name: 'cyberdream' },
  { name: 'dracula' },
  { name: 'everforest-dark' },
  { name: 'gruvbox-dark' },
  { name: 'horizon-dark' },
  { name: 'kanagawa' },
  { name: 'material-dark' },
  { name: 'monokai-pro' },
  { name: 'nightfox' },
  { name: 'nord' },
  { name: 'one-dark' },
  { name: 'oxocarbon-dark' },
  { name: 'palenight' },
  { name: 'rose-pine' },
  { name: 'rose-pine-moon' },
  { name: 'solarized-dark' },
  { name: 'synthwave-84' },
  { name: 'tokyo-night' },
  { name: 'tokyo-night-storm' }
]

// Local Typora themes. The CSS is generated from the user's own Typora
// installation by scripts/prepare-typora-themes.ts and is git-ignored; hide
// them when the assets have not been generated (fresh clone / CI).
const LOCAL_TYPORA_THEMES: ReadonlyArray<ThemeDescriptor> = [
  { name: 'typora-github' },
  { name: 'typora-gothic' },
  { name: 'typora-newsprint' },
  { name: 'typora-night' },
  { name: 'typora-pixyll' },
  { name: 'typora-whitey' }
]

export const themes: ReadonlyArray<ThemeDescriptor> = [
  ...BUILT_IN_THEMES,
  ...LOCAL_TYPORA_THEMES.filter(({ name }) => hasTyporaTheme(name))
]

export const themeLabel = (name: string): string => name.split('-')
  .map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
