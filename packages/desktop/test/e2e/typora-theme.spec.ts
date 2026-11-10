import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { launchElectron, waitForEditor, waitForMenuReady } from './helpers'

// These assets are generated from the user's own Typora installation and are
// intentionally git-ignored, so CI skips this spec. Run
// `pnpm run prepare-typora-themes` first to exercise it locally.
const projectRoot = path.resolve(__dirname, '../..')
const hasTyporaAssets = fs.existsSync(
  path.join(projectRoot, 'src/renderer/src/assets/typora-local/github.css')
)

test.skip(!hasTyporaAssets, 'run `pnpm run prepare-typora-themes` first')

test('Typora theme maps MarkText DOM, icons and status bar', async() => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'marktext-typora-theme-'))
  const filePath = path.join(directory, 'demo.md')
  fs.writeFileSync(
    filePath,
    [
      '# Typora theme test',
      '',
      '- [x] done',
      '- [ ] pending',
      '',
      '| A | B |',
      '| --- | --- |',
      '| 1 | 2 |',
      '',
      '```ts',
      'const answer = 42',
      '```',
      ''
    ].join('\n')
  )

  const { app, page } = await launchElectron([directory, filePath], {
    windowLayout: { showSideBar: true, showTabBar: false },
    preferences: {
      theme: 'typora-github',
      followSystemTheme: false
    }
  })

  try {
    await waitForEditor(page)
    await waitForMenuReady(app)

    await expect(page.locator('body')).toHaveClass(/(^|\s)typora-theme(\s|$)/)
    await expect(page.locator('.mu-container')).toHaveAttribute('id', 'write')
    await expect(page.locator('.mu-code-block').first()).toHaveClass(/md-fences/)
    await expect(page.locator('.mu-table').first()).toHaveClass(/md-table/)
    await expect(page.locator('.mu-task-list-item').first()).toHaveClass(/md-task-list-item/)
    await expect(page.locator('.typora-status-bar')).toBeVisible()
    await expect(page.locator('.side-bar .file-icon').first()).toHaveClass(/ty-fi-markdown/)

    await page.locator('.status-source-toggle').click()
    await expect(page.locator('.CodeMirror').first()).toBeVisible()
  } finally {
    await app.close()
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
