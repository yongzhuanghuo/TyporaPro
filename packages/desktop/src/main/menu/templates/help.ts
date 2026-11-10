import type { BrowserWindow, MenuItemConstructorOptions } from 'electron'
import * as actions from '../actions/help'
import { t } from '../../i18n'

// External links to the upstream MarkText project are intentionally absent:
// this build is a standalone TyporaPro distribution, so only the About entry
// remains useful.
export default function(): MenuItemConstructorOptions {
  return {
    label: t('menu.help.help'),
    role: 'help',
    submenu: [
      {
        label: t('menu.help.about'),
        click(_menuItem, browserWindow) {
          actions.showAboutDialog(browserWindow as BrowserWindow | undefined)
        }
      }
    ]
  }
}
