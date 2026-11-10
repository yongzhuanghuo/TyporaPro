#!/usr/bin/env node
/**
 * Local-only helper: turn the Typora themes installed on this machine into
 * self-contained CSS files for the personal MarkText build.
 *
 * The generated files are written under the renderer source tree because Vite
 * loads them with `import.meta.glob`. They are git-ignored on purpose: Typora's
 * themes and fonts are not redistributable. Run this only on a machine that has
 * a licensed Typora installation.
 *
 * Usage:
 *   pnpm run prepare-typora-themes
 *   pnpm run prepare-typora-themes -- /Applications/Typora.app
 *   TYPORA_APP=/path/to/Typora.app pnpm run prepare-typora-themes
 *
 * On Windows, pass the directory that contains `resources/TypeMark/style/themes`
 * if the layout differs from the macOS bundle.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const defaultTyporaApp = '/Applications/Typora.app'
const typoraApp = process.argv[2] || process.env.TYPORA_APP || defaultTyporaApp

// macOS ships `Contents/Resources/TypeMark`; the Windows Electron build
// normally exposes the same tree under `resources/TypeMark` (or `resources/app`).
const typeMarkCandidates = [
  path.join(typoraApp, 'Contents/Resources/TypeMark'),
  path.join(typoraApp, 'resources/TypeMark'),
  path.join(typoraApp, 'resources/app/TypeMark'),
  path.join(typoraApp, 'TypeMark')
]
const typeMarkRoot = typeMarkCandidates.find((candidate) =>
  fs.existsSync(path.join(candidate, 'style/themes'))
)
if (!typeMarkRoot) {
  console.error('Typora assets not found. Looked for TypeMark/style/themes under:')
  for (const candidate of typeMarkCandidates) console.error(`  - ${candidate}`)
  console.error('Usage: pnpm run prepare-typora-themes -- /Applications/Typora.app')
  process.exit(1)
}
const sourceRoot = path.join(typeMarkRoot, 'style/themes')
const outputRoot = path.join(
  repoRoot,
  'packages/desktop/src/renderer/src/assets/typora-local'
)

const THEMES = ['github', 'gothic', 'newsprint', 'night', 'pixyll', 'whitey'] as const

const MIME_TYPES: Record<string, string> = {
  '.eot': 'application/vnd.ms-fontobject',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2'
}

const readAsset = (filePath: string): string | null => {
  try {
    return fs.readFileSync(filePath).toString('base64')
  } catch {
    return null
  }
}

const inlineCss = (filePath: string, seen: Set<string>): string => {
  if (seen.has(filePath)) return ''
  seen.add(filePath)

  const baseDir = path.dirname(filePath)
  let css = fs.readFileSync(filePath, 'utf8')

  // Typora-only at-rule used by its export pipeline; not valid in the editor.
  css = css.replace(/^\s*@include-when-export[^;]*;?\s*$/gm, '')

  // Inline relative @import rules so the generated file is standalone.
  css = css.replace(
    /@import\s+(?:url\()?['"]([^'"]+)['"]\)?[^;]*;/g,
    (match, spec: string) => {
      if (/^(data:|https?:|\/\/)/i.test(spec)) return ''
      const importPath = path.resolve(baseDir, spec.split(/[?#]/)[0])
      if (!fs.existsSync(importPath)) return ''
      return inlineCss(importPath, seen)
    }
  )

  // Inline fonts and images as data URLs. Remote URLs stay untouched.
  css = css.replace(
    /url\(\s*(['"]?)([^'")]+)\1\s*\)/g,
    (match, _quote: string, url: string) => {
      if (/^(data:|https?:|file:|\/\/|#)/i.test(url)) return match
      const clean = url.split(/[?#]/)[0]
      let assetPath: string
      try {
        assetPath = path.resolve(baseDir, decodeURIComponent(clean))
      } catch {
        return match
      }
      if (!fs.existsSync(assetPath)) return match
      const data = readAsset(assetPath)
      if (!data) return match
      const ext = path.extname(assetPath).toLowerCase()
      const mime = MIME_TYPES[ext] ?? 'application/octet-stream'
      return `url(data:${mime};base64,${data})`
    }
  )

  return css
}

fs.mkdirSync(outputRoot, { recursive: true })

for (const theme of THEMES) {
  const source = path.join(sourceRoot, `${theme}.css`)
  if (!fs.existsSync(source)) {
    console.warn(`skip ${theme}: ${source} not found`)
    continue
  }
  const css = inlineCss(source, new Set())
  const destination = path.join(outputRoot, `${theme}.css`)
  fs.writeFileSync(destination, css)
  console.log(
    `${theme}: ${(Buffer.byteLength(css) / 1024).toFixed(1)} KiB -> ${path.relative(repoRoot, destination)}`
  )
}

// Typora's own icon fonts. They are loaded together with every Typora theme;
// the file picker maps Markdown files to `ty-fi-markdown` when active.
const iconCssSources = [
  path.join(typeMarkRoot, 'style/typora-file-icon/style.css'),
  path.join(typeMarkRoot, 'style/typora-icon/style.css')
]
let iconCss = ''
for (const source of iconCssSources) {
  if (fs.existsSync(source)) iconCss += `${inlineCss(source, new Set())}\n`
}
iconCss += `
.ty-file-icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  font-size: 16px;
  line-height: 1;
  vertical-align: -0.125em;
}
`
const iconCssPath = path.join(outputRoot, 'typora-icons.css')
fs.writeFileSync(iconCssPath, iconCss)
console.log(`icons: ${(Buffer.byteLength(iconCss) / 1024).toFixed(1)} KiB -> ${path.relative(repoRoot, iconCssPath)}`)

// App icons for the local personal build. Keep them under static/typora so a
// future electron-builder override can point at them without touching the
// tracked MarkText icons.
const iconOutput = path.join(repoRoot, 'packages/desktop/static/typora')
fs.mkdirSync(iconOutput, { recursive: true })
const copyFirstIcon = (candidates: string[], name: string): void => {
  const source = candidates.find((candidate) => fs.existsSync(candidate))
  if (!source) return
  fs.copyFileSync(source, path.join(iconOutput, name))
}
copyFirstIcon(
  [
    path.join(typoraApp, 'Contents/Resources/AppIcon.icns'),
    path.join(typoraApp, 'resources/AppIcon.icns'),
    path.join(typoraApp, 'AppIcon.icns')
  ],
  'icon.icns'
)
copyFirstIcon([path.join(typeMarkRoot, 'assets/app.ico')], 'icon.ico')
copyFirstIcon([path.join(typeMarkRoot, 'assets/icon/icon_512x512.png')], 'icon.png')
copyFirstIcon([path.join(typeMarkRoot, 'style/typora-file-icon.png')], 'file-icon.png')
console.log(`app icons -> ${path.relative(repoRoot, iconOutput)}`)
