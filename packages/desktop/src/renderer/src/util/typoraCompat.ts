/**
 * Typora themes target a different DOM vocabulary than Muya (`#write`,
 * `.md-fences`, `.md-table`, …). Instead of rewriting every theme selector,
 * mirror the handful of Typora class names onto the matching Muya nodes while
 * a Typora theme is active. The observer is intentionally scoped to the
 * lifetime of the active theme so normal MarkText themes keep their DOM.
 */

const CLASS_ALIASES: ReadonlyArray<readonly [string, readonly string[]]> = [
  ['mu-container', ['md-focus-container']],
  ['mu-code-block', ['md-fences']],
  ['mu-fenced-code', ['md-fences']],
  ['mu-line-numbers', ['md-fences-with-lineno']],
  ['mu-table', ['md-table']],
  ['mu-table-inner', ['md-table']],
  ['mu-math-block', ['md-math-block', 'mathjax-block']],
  ['mu-math', ['md-inline-math']],
  ['mu-diagram-block', ['md-diagram']],
  ['mu-diagram-container', ['md-diagram-panel']],
  ['mu-diagram-preview', ['md-diagram-panel-preview']],
  ['mu-task-list-item', ['md-task-list-item']],
  ['mu-frontmatter', ['md-meta-block']],
  ['mu-footnote', ['md-footnote']],
  ['mu-inline-image', ['md-image']],
  ['mu-html-block', ['md-html-block']],
  ['mu-active', ['md-focus']],
  ['mu-focus-mode', ['on-focus-mode']],
  ['mu-language-input', ['md-lang']],
  ['side-bar-file', ['file-node-content']],
  ['file-icon', ['file-node-icon']]
]

let observer: MutationObserver | null = null
let enabled = false
let scheduled = false

const applyAliases = (): void => {
  scheduled = false
  if (!enabled) return

  document.body.classList.add('typora-theme')
  if (window.electron?.process?.platform === 'darwin') {
    document.body.classList.add('mac-os')
  }

  const container = document.querySelector<HTMLElement>('.mu-container')
  if (container && container.id !== 'write') container.id = 'write'

  const sideBar = document.querySelector<HTMLElement>('.side-bar')
  if (sideBar && sideBar.id !== 'typora-sidebar') sideBar.id = 'typora-sidebar'

  for (const [muClass, typoraClasses] of CLASS_ALIASES) {
    for (const element of document.querySelectorAll<HTMLElement>(`.${muClass}`)) {
      for (const typoraClass of typoraClasses) {
        if (!element.classList.contains(typoraClass)) element.classList.add(typoraClass)
      }
    }
  }
}

const scheduleApply = (): void => {
  if (scheduled || !enabled) return
  scheduled = true
  requestAnimationFrame(applyAliases)
}

export const setTyporaCompatEnabled = (value: boolean): void => {
  if (value === enabled) {
    if (value) scheduleApply()
    return
  }
  enabled = value

  if (value) {
    observer ??= new MutationObserver(scheduleApply)
    observer.observe(document.body, { childList: true, subtree: true })
    scheduleApply()
    return
  }

  observer?.disconnect()
  observer = null
  document.body.classList.remove('typora-theme', 'mac-os')
  document.querySelector<HTMLElement>('.mu-container')?.removeAttribute('id')
  document.querySelector<HTMLElement>('.side-bar')?.removeAttribute('id')
}
