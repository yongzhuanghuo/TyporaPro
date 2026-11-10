import oneDarkPrismTheme from '../assets/themes/prismjs/one-dark.theme.css?inline'

/**
 * Local-only Typora themes. `scripts/prepare-typora-themes.ts` writes these
 * files from the Typora installation on this machine; the directory is
 * git-ignored because the themes and fonts are not redistributable.
 *
 * When the files are absent (fresh checkout / CI), the glob is empty and the
 * Typora theme ids simply render no extra CSS.
 */
const TYPORA_THEME_FILES = import.meta.glob('../assets/typora-local/*.css', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>

const typoraThemes = new Map<string, string>()
let typoraIconCss = ''

for (const [file, css] of Object.entries(TYPORA_THEME_FILES)) {
  const name = file.replace(/^.*\//, '').replace(/\.css$/, '')
  if (name === 'typora-icons') {
    typoraIconCss = css
  } else {
    typoraThemes.set(`typora-${name}`, css)
  }
}

export const TYPORA_THEME_STYLE_ID = 'typora-theme-style'

export const isTyporaTheme = (theme: string): boolean => theme.startsWith('typora-')

export const hasTyporaTheme = (theme: string): boolean => typoraThemes.has(theme)

export const getTyporaThemeCss = (theme: string): string | null => {
  const css = typoraThemes.get(theme)
  if (!css) return null
  // Typora's dark code-block styling targets CodeMirror token classes; MarkText
  // renders code blocks with Prism, so give the dark theme a matching Prism
  // palette instead of the default light one.
  const prism = theme === 'typora-night' ? `\n${oneDarkPrismTheme}` : ''
  return `${css}\n${typoraIconCss}${prism}`
}

/**
 * MarkText's chrome reads camelCase variables (`--editorBgColor`, …), while
 * its editor core reads kebab-case aliases (`--editor-color`, …). Typora themes
 * define a different set (`--bg-color`, `--text-color`, …), so expose both
 * MarkText vocabularies from the Typora palette.
 */
export const buildTyporaBridgeCss = (): string => `
body.typora-theme {
  --themeColor: var(--primary-color, #4183c4);
  --themeColor90: color-mix(in srgb, var(--primary-color, #4183c4) 90%, transparent);
  --themeColor80: color-mix(in srgb, var(--primary-color, #4183c4) 80%, transparent);
  --themeColor70: color-mix(in srgb, var(--primary-color, #4183c4) 70%, transparent);
  --themeColor60: color-mix(in srgb, var(--primary-color, #4183c4) 60%, transparent);
  --themeColor50: color-mix(in srgb, var(--primary-color, #4183c4) 50%, transparent);
  --themeColor40: color-mix(in srgb, var(--primary-color, #4183c4) 40%, transparent);
  --themeColor30: color-mix(in srgb, var(--primary-color, #4183c4) 30%, transparent);
  --themeColor20: color-mix(in srgb, var(--primary-color, #4183c4) 20%, transparent);
  --themeColor10: color-mix(in srgb, var(--primary-color, #4183c4) 10%, transparent);

  --highlightColor: var(--search-select-bg-color, color-mix(in srgb, var(--primary-color, #4183c4) 35%, transparent));
  --highlightThemeColor: var(--themeColor);
  --selectionColor: var(--select-text-bg-color, color-mix(in srgb, var(--primary-color, #4183c4) 30%, transparent));
  --editorColor: var(--text-color, #333);
  --editorColor80: var(--text-color, #333);
  --editorColor60: color-mix(in srgb, var(--text-color, #333) 60%, transparent);
  --editorColor50: color-mix(in srgb, var(--text-color, #333) 50%, transparent);
  --editorColor40: color-mix(in srgb, var(--text-color, #333) 40%, transparent);
  --editorColor30: color-mix(in srgb, var(--text-color, #333) 30%, transparent);
  --editorColor10: color-mix(in srgb, var(--text-color, #333) 10%, transparent);
  --editorColor04: color-mix(in srgb, var(--text-color, #333) 4%, transparent);
  --editorBgColor: var(--bg-color, #fff);
  --deleteColor: #d44;
  --iconColor: var(--control-text-color, #777);
  --codeBgColor: var(--code-bg-color, color-mix(in srgb, var(--text-color, #333) 6%, transparent));
  --codeBlockBgColor: var(--code-bg-color, color-mix(in srgb, var(--text-color, #333) 6%, transparent));
  --codeBlockColor: var(--text-color, #333);
  --footnoteBgColor: color-mix(in srgb, var(--text-color, #333) 4%, transparent);
  --inputBgColor: var(--item-hover-bg-color, color-mix(in srgb, var(--text-color, #333) 6%, transparent));
  --focusColor: var(--themeColor);

  --buttonFontColor: var(--text-color, #333);
  --buttonBgColor: var(--bg-color, #fff);
  --buttonBorder: 1px solid color-mix(in srgb, var(--text-color, #333) 18%, transparent);
  --buttonBgColorHover: var(--item-hover-bg-color, color-mix(in srgb, var(--text-color, #333) 5%, transparent));
  --buttonBgColorActive: var(--active-file-bg-color, color-mix(in srgb, var(--text-color, #333) 8%, transparent));
  --buttonPrimaryBgColor: var(--primary-color, #4183c4);
  --buttonPrimaryFontColor: #fff;
  --buttonPrimaryBgColorHover: var(--primary-color, #4183c4);
  --buttonPrimaryBgColorActive: var(--primary-color, #4183c4);

  --tableBorderColor: var(--table-border-color, color-mix(in srgb, var(--text-color, #333) 15%, transparent));
  --headingColor: var(--text-color, #333);
  --h1Color: var(--text-color, #333);
  --h2Color: var(--text-color, #333);
  --h3Color: var(--text-color, #333);
  --h4Color: var(--text-color, #333);
  --h5Color: var(--text-color, #333);
  --h6Color: var(--text-color, #333);
  --blockquoteTextColor: var(--control-text-color, #777);
  --blockquoteBorderColor: var(--primary-color, #4183c4);
  --hrColor: var(--hr-color, color-mix(in srgb, var(--text-color, #333) 12%, transparent));
  --linkColor: var(--primary-color, #4183c4);
  --strongColor: var(--text-color, #333);
  --emColor: var(--text-color, #333);
  --listMarkerColor: var(--text-color, #333);

  --sideBarColor: var(--control-text-color, #777);
  --sideBarIconColor: var(--control-text-color, #777);
  --sideBarTitleColor: var(--control-text-color, #777);
  --sideBarTextColor: var(--control-text-color, #777);
  --sideBarBgColor: var(--side-bar-bg-color, #fafafa);
  --sideBarItemHoverBgColor: var(--item-hover-bg-color, color-mix(in srgb, var(--text-color, #333) 5%, transparent));
  --itemBgColor: var(--active-file-bg-color, var(--item-hover-bg-color, #f0f0f0));

  --floatFontColor: var(--text-color, #333);
  --floatBgColor: var(--bg-color, #fff);
  --floatHoverColor: var(--item-hover-bg-color, color-mix(in srgb, var(--text-color, #333) 4%, transparent));
  --floatBorderColor: color-mix(in srgb, var(--text-color, #333) 12%, transparent);
  --floatShadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --maskColor: rgba(0, 0, 0, 0.5);
  --notificationPrimaryBg: var(--primary-color, #4183c4);

  --theme-color: var(--themeColor);
  --highlight-color: var(--highlightColor);
  --selection-color: var(--selectionColor);
  --editor-color: var(--editorColor);
  --editor-color-80: var(--editorColor80);
  --editor-color-50: var(--editorColor50);
  --editor-color-30: var(--editorColor30);
  --editor-color-10: var(--editorColor10);
  --editor-color-04: var(--editorColor04);
  --editor-bg-color: var(--editorBgColor);
  --delete-color: var(--deleteColor);
  --icon-color: var(--iconColor);
  --code-block-bg-color: var(--codeBlockBgColor);
  --code-block-color: var(--codeBlockColor);
  --table-border-color: var(--tableBorderColor);
  --input-bg-color: var(--inputBgColor);
  --button-font-color: var(--buttonFontColor);
  --button-bg-color: var(--buttonBgColor);
  --button-border: var(--buttonBorder);
  --button-bg-color-hover: var(--buttonBgColorHover);
  --button-bg-color-active: var(--buttonBgColorActive);
  --float-bg-color: var(--floatBgColor);
  --float-hover-color: var(--floatHoverColor);
  --float-border-color: var(--floatBorderColor);
  --float-shadow: var(--floatShadow);
  --link-color: var(--linkColor);
  --h1-color: var(--h1Color);
  --h2-color: var(--h2Color);
  --h3-color: var(--h3Color);
  --h4-color: var(--h4Color);
  --h5-color: var(--h5Color);
  --h6-color: var(--h6Color);
  --blockquote-text-color: var(--blockquoteTextColor);
  --blockquote-border-color: var(--blockquoteBorderColor);
  --strong-color: var(--strongColor);
  --em-color: var(--emColor);
  --list-marker-color: var(--listMarkerColor);
  --hr-color: var(--hrColor);
}

body.typora-theme .mu-editor {
  --mu-font-family: inherit;
  --mu-font-size: inherit;
  --mu-line-height: inherit;
  background-color: var(--bg-color, #fff);
  color: var(--text-color, #333);
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
}

body.typora-theme .mu-container {
  color: var(--text-color, #333);
}

body.typora-theme ::selection {
  background: var(--select-text-bg-color, color-mix(in srgb, var(--primary-color, #4183c4) 30%, transparent));
}

/* Typora shows the document name in the title bar and statistics in its own
   status bar; avoid duplicating them in MarkText's title bar. */
body.typora-theme .title-bar .path > bdi > span:not(.filename) {
  display: none;
}

body.typora-theme .title-bar .document-statistics-trigger {
  display: none;
}

/* Typora uses a native-looking square checkbox. MarkText draws a circular
   SVG-ish marker with pseudo-elements, so restore the native control while a
   Typora theme is active. */
body.typora-theme li.mu-task-list-item > input[type='checkbox'],
body.typora-theme li.mu-task-list-item > span.mu-task-list-checkbox {
  width: 13px !important;
  height: 13px !important;
  margin: 0 !important;
  padding: 0 !important;
  appearance: auto !important;
  accent-color: var(--primary-color, #4183c4);
}

body.typora-theme li.mu-task-list-item > input[type='checkbox']::before,
body.typora-theme li.mu-task-list-item > input[type='checkbox']::after,
body.typora-theme li.mu-task-list-item > span.mu-task-list-checkbox::before,
body.typora-theme li.mu-task-list-item > span.mu-task-list-checkbox::after {
  content: none !important;
}

body.typora-theme.dark {
  color-scheme: dark;
}

/* The inline format toolbar ships PNG glyphs. Map the formats that exist in
   Typora's icon font so the toolbar matches the rest of the theme; formats
   without a Typora glyph keep their bundled PNG. */
body.typora-theme .mu-format-picker li.item.strong .icon-wrapper i.icon > i.icon-inner,
body.typora-theme .mu-format-picker li.item.em .icon-wrapper i.icon > i.icon-inner,
body.typora-theme .mu-format-picker li.item.inline_code .icon-wrapper i.icon > i.icon-inner,
body.typora-theme .mu-format-picker li.item.link .icon-wrapper i.icon > i.icon-inner,
body.typora-theme .mu-format-picker li.item.image .icon-wrapper i.icon > i.icon-inner {
  position: static !important;
  left: 0 !important;
  display: flex !important;
  align-items: center;
  justify-content: center;
  width: 16px !important;
  height: 16px !important;
  background-image: none !important;
  filter: none !important;
  color: inherit;
  font-family: 'typora-icon' !important;
  font-size: 16px;
  font-style: normal;
  line-height: 16px;
}

body.typora-theme .mu-format-picker li.item.strong .icon-inner::before {
  content: '\\e925';
}

body.typora-theme .mu-format-picker li.item.em .icon-inner::before {
  content: '\\e92c';
}

body.typora-theme .mu-format-picker li.item.inline_code .icon-inner::before {
  content: '\\e924';
}

body.typora-theme .mu-format-picker li.item.link .icon-inner::before {
  content: '\\e926';
}

body.typora-theme .mu-format-picker li.item.image .icon-inner::before {
  content: '\\e060';
}
`
