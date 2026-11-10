import baseStyle from '@/assets/styles/index.css?inline'

const themeStyles = import.meta.glob('../../assets/themes/*.theme.css', {
  query: '?inline', import: 'default', eager: true
}) as Record<string, string>

const typoraThemeStyles = import.meta.glob('../../assets/typora-local/*.css', {
  query: '?raw', import: 'default', eager: true
}) as Record<string, string>

const typoraPreviewStyle = (name: string): Record<string, string> => {
  const key = name.replace(/^typora-/, '')
  const source = typoraThemeStyles[`../../assets/typora-local/${key}.css`] ?? ''
  const variable = (variableName: string, fallback: string): string => {
    const match = new RegExp(`--${variableName}\\s*:\\s*([^;]+);`).exec(source)
    return match?.[1].trim() ?? fallback
  }
  return {
    background: variable('bg-color', '#ffffff'),
    color: variable('text-color', '#333333'),
    '--preview-link': variable('primary-color', '#4183c4'),
    '--preview-code': variable('code-bg-color', '#f5f5f5')
  }
}

export const themePreviewStyle = (name: string): Record<string, string> => {
  if (name.startsWith('typora-')) return typoraPreviewStyle(name)

  const source = baseStyle + (themeStyles[`../../assets/themes/${name}.theme.css`] ?? '')
  const variables = new Map<string, string>()
  for (const match of source.matchAll(/--(editorBgColor|editorColor|themeColor|codeBgColor)\s*:\s*([^;]+);/g)) {
    variables.set(match[1], match[2].trim())
  }
  return {
    background: variables.get('editorBgColor') ?? 'transparent',
    color: variables.get('editorColor') ?? 'inherit',
    '--preview-link': variables.get('themeColor') ?? 'currentColor',
    '--preview-code': variables.get('codeBgColor') ?? 'transparent'
  }
}
