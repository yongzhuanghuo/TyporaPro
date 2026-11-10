# MarkText × Typora 对标：代码现状评估与 MVP 规划

> 文档版本：v1（2026-11-09）
> 代码基线：`marktext/marktext` `develop` @ `a520befd`（2026-11-06），版本 `0.24.0-dev`
> 评估方式：源码静态审阅；尚未执行完整构建与测试
> 仓库状态：工作区已移除 `.git`，等待新建自有仓库；上游基线仅作为对照
> 适用读者：产品负责人、首位开发者、设计与 QA

---

## 0. 结论先行

1. **路线不变：Fork MarkText，不做 Typora 反编译重建。** 法律、工程可维护性和时间成本都不支持“反编译 → 可编译工程 → 可发布产品”这条链路。Typora 只作为黑盒行为参照。
2. **MarkText 比上一版结论预估的成熟。** 上一版列为差距的 Word/EPUB/Pandoc 导出、打印分页、PicGo 图片上传、GitHub Alerts、脚注、高亮、行内 diff、源码模式、阅读模式，代码里已经实现，其中相当一部分有 E2E 覆盖。
3. **真正的工作量在“打磨 + 覆盖 + 平台化”，不是“从零补功能”。** 优先级最高的五件事：表格/光标/输入法/撤销的长期稳定性、Typora 主题兼容层、PDF/HTML 导出保真度、macOS + Windows 分发与平台集成、大文档性能与 i18n 覆盖。
4. **建议 MVP 以 macOS + Windows 双端、12–14 周、1 名资深全职主程为基准。** 目标是一个“日常可用的 Typora 替代品”Beta，而不是功能表 1:1。若再加 Linux、40+ 语言和原生 QuickLook/Spotlight，首版会滑到 6 个月以上。
5. **先冻结范围，再动手。** 本文件第 4 节给出 P0/P1/P2 边界；第 9 节列出需要你拍板的决策。范围冻结前不建议大规模改 Muya 内核。

一句话：**MarkText 已经是 80% 的 Typora 核心体验，剩下 20% 是最贵的 80% 工作量；用 12–14 周做一个 macOS + Windows Beta 是现实的，做“全功能 1:1”不是。**

---

## 1. 背景、边界与合规

### 1.1 为什么不做 Typora 反编译

此前对 Typora 1.14.15 的观测结论仍然成立：

- **法律**：Typora EULA 第 7 项限制 adapt / decompile / reverse engineer / disassemble / derive source code（除非法律强制允许）。代码、主题、语言包受著作权保护。自用研究风险较低，商业分发/上架风险很高；这不是法律意见，商业项目应找律师。
- **工程**：macOS 版是原生 ObjC 壳 + WKWebView，编辑器是约 1.7 MB 的单行压缩 JS，无 sourcemap；恢复出来是混淆代码 + 反汇编，不是可编译的 Xcode 工程。
- **维护**：拿不到模块化源码、构建脚本、签名/公证流程和 Sparkle 更新实现；长期维护成本高于从开源项目改。

### 1.2 本项目允许与禁止

允许：

- 阅读 Typora 的公开文档、公开主题规范、公开截图；
- 以 Typora 作为黑盒行为参照，记录输入/输出、快捷键、导出结果；
- 使用公开的 Markdown/CommonMark/GFM 规范作为测试基准；
- 使用 MarkText（MIT）及其依赖（各自许可证）作为代码底座。

禁止：

- 复制 Typora 的 JS/CSS/主题/语言包/图标/字体等资源进产品仓库；
- 反编译后直接搬运代码、变量名、内部结构；
- 使用 Typora 名称、图标、商标做产品命名或商店素材；
- 把 Typora 主题打包进安装包分发（用户自行导入的第三方主题由用户承担许可证责任）。

### 1.3 许可证与品牌

- MarkText 是 MIT：保留 `LICENSE` 中的版权声明；衍生作品继续保留 MarkText Contributors 的版权 notice。
- 依赖许可证：仓库已有 `scripts/generateThirdPartyLicense.ts`、`scripts/validateLicenses.ts`，发布前必须跑通。
- 新仓库建议尽早确定产品名、`appId`、`productName`、图标和商店素材，避免后期改包名导致数据目录、更新源、文件关联迁移。
- MarkText 名称本身也可能涉及项目商标/社区识别，商业产品建议使用独立品牌，并在“关于”页注明基于 MarkText。

### 1.4 个人使用模式（local-only）

如果当前目标只是自己使用、不对外分发，边界可以放宽，但不要把“个人使用”和“可分发”混在一起：

- **本地资源**：`pnpm run prepare-typora-themes` 会生成到 `packages/desktop/src/renderer/src/assets/typora-local/`（主题 CSS + 图标字体）和 `packages/desktop/static/typora/`（应用图标）；两者都已加入 `.gitignore`。
- **应用图标**：开发模式下主进程通过 `app.dock.setIcon()` 使用 `static/typora/icon.png`；打包时用本地 electron-builder 覆盖配置指向 `static/typora/icon.icns` / `icon.ico`。
- **主题/样式**：已实现变量桥接和 DOM 别名（`#write`、`.md-fences`、`.md-table` 等）；MarkText 的 Vue/Element Plus 侧栏、菜单、工具栏样式只能做近似，不能原样套用。
- **界面图标**：文件树已换成 Typora 的 `ty-file` 图标字体；搜索/设置/格式工具栏等 Element Plus/SVG 图标仍需逐项映射，先做高频图标。
- **可以省掉**：代码签名/公证、自动更新、40+ 语言、QuickLook/Spotlight/AppleScript 等平台深度集成；个人版优先编辑体验、主题/图标替换、HTML/PDF 导出。
- **红线**：一旦把构建发给别人、上传网盘/商店或公开仓库，就必须切回 clean-room：移除所有 Typora 资源，重新做品牌/图标/主题。EULA 仍可能限制复制/改编，个人使用风险较低但不等于获得了授权。

**当前启用方式**（个人本地）：

```sh
pnpm install
pnpm run prepare-typora-themes   # 从 /Applications/Typora.app 生成主题/图标到 git-ignored 目录
pnpm run build:unpack
```

启动后在 Preferences → Theme 或 Theme 菜单选择 `Typora Github`、`Typora Night` 等；主题 CSS、文件图标、应用图标都来自本机 Typora 安装，不会进入仓库。

个人版打包（使用 Typora 图标）：

```sh
pnpm run build:mac:typora
pnpm run build:win:typora
```

---

## 2. 代码现状（证据）

### 2.1 架构

| 层 | 现状 |
| --- | --- |
| 仓库 | pnpm monorepo：`packages/desktop`（Electron 应用）、`packages/muya`（编辑器内核 `@muyajs/core`）、`packages/website`（Next.js 文档站） |
| 桌面框架 | Electron `~45`，electron-vite 6，electron-builder 26 |
| 前端 | Vue `3.5`、Pinia `4`、Vue Router `5`、Element Plus `2.14` |
| 语言/构建 | TypeScript `6.0` strict，Vite 8，Vitest 5，Playwright 1.64 |
| 编辑内核 | Muya：自研 `contenteditable` 引擎，`ot-json1` + `ot-text-unicode` 状态/事务，snabbdom 渲染，marked 解析 |
| 进程模型 | main / preload / renderer 分离；renderer `sandbox: true`、`contextIsolation: true`、`nodeIntegration: false` |
| IPC | `packages/desktop/src/shared/types/ipc.ts` 中约 176 个 `mt::` 通道，preload 暴露类型化 `window.electron.*` |
| 主进程模块 | `app`、`applicationState`、`cli`、`commands`、`contextMenu`、`dataCenter`、`filesystem`、`ipc`、`keyboard`、`menu`、`preferences`、`spellchecker`、`windows` |
| 渲染层模块 | `components`（editorWithTabs、sideBar、exportSettings、commandPalette、import、mediaViewer 等）、`store`（editor/preferences/layout/project/treeCtrl/keybindings 等）、`codeMirror`、`prefComponents` |

关键路径：

- 编辑器入口：`packages/desktop/src/renderer/src/components/editorWithTabs/editor.vue`
- 源码模式：`packages/desktop/src/renderer/src/components/editorWithTabs/sourceCode.vue`
- Muya 内核：`packages/muya/src/muya.ts`、`packages/muya/src/editor/index.ts`
- 状态/序列化：`packages/muya/src/state/`
- 块类型：`packages/muya/src/block/`
- 行内引擎：`packages/muya/src/inline/`
- 撤销/历史：`packages/muya/src/history/`

### 2.2 已具备的能力（与 Typora 核心重叠）

| 能力域 | 现状 | 证据 |
| --- | --- | --- |
| 编辑模式 | WYSIWYG、源码模式（CodeMirror 5）、Typewriter、Focus、Reading Mode | `editor.vue`、`sourceCode.vue`、`muya.setFocusMode()` |
| Markdown | CommonMark / GFM / 选择性 Pandoc 扩展；标题、列表、任务列表、引用、代码块、表格、脚注、Front Matter、链接、图片 | `packages/muya/src/block/`、`test/spec/` |
| 数学 | KaTeX 行内/块级公式，mhchem，错误提示 | `packages/muya/src/block/extra/math/` |
| 图表 | Mermaid、PlantUML、flowchart.js、sequence、Vega/Vega-Lite；Mermaid 明暗主题、PlantUML 服务器可配置 | `packages/muya/src/block/extra/diagram/`、`packages/muya/src/utils/diagram/` |
| 扩展语法 | GitHub Alerts、`==highlight==`、行内 diff、上下标、多行引用、emoji、命名锚点、TOC | `packages/website/content/docs/end-user/MARKDOWN_SYNTAX.md`、`muya/src/block/extra/` |
| 文件/工作区 | 标签页、文件树、多根目录、拖拽移动、快速打开、最近文件、会话恢复、自动保存、编码检测、换行符 | `components/sideBar/`、`store/project.ts`、`main/applicationState/sessionHost.ts` |
| 搜索 | 当前文档查找/替换；跨文件搜索基于 ripgrep | `main/ipc/ripgrep.ts`、`components/sideBar/search.vue` |
| 导出 | HTML、PDF、打印；页码范围/方向/页边距、页眉页脚、导出主题、TOC、标题自动编号、Front Matter 开关 | `main/menu/actions/file.ts`、`renderer/src/util/pdf.ts`、`components/exportSettings/` |
| Pandoc | 导出 Word(.docx)、ODT、RTF、EPUB3、LaTeX、reST、Org、MediaWiki、Textile；导入 HTML/DOCX/ODT/LaTeX/reST/Org/wiki/textile/OPML/EPUB | `main/utils/pandoc.ts`、`main/menu/actions/file.ts` |
| 图片 | 剪贴板/拖拽、文件夹/路径/上传三种插入策略、相对路径、媒体查看器、图表 PNG/SVG 导出 | `components/mediaViewer/`、`main/ipc/uploader.ts`、`docs/end-user/IMAGES.md` |
| 图片上传 | PicGo CLI + 自定义 CLI 脚本；旧 GitHub uploader 已在 0.19 移除 | `main/ipc/uploader.ts`、`prefComponents/image/components/uploader/` |
| 主题 | 33 套内置主题（32 个 CSS + 内置 Light）、跟随系统、Custom CSS；3 套导出主题（GitHub 默认 + Academic + Liber） | `renderer/src/assets/themes/`、`docs/end-user/THEMES.md` |
| 国际化 | 13 种语言，约 944 个 key/语言 | `static/locales/`、`renderer/src/i18n/index.ts` |
| 偏好/快捷键 | 偏好面板、可编辑快捷键、命令面板、拼写检查、keytar 存密钥 | `prefComponents/`、`store/keybindings.ts`、`main/keyboard/` |
| 打包/更新 | electron-builder 三端目标（首发 macOS + Windows）；electron-updater 已接入；自动更新检查 | `electron-builder.yml`、`main/menu/actions/marktext.ts`、`.github/workflows/release.yml` |

### 2.3 工程质量与测试基线

| 指标 | 数值 | 说明 |
| --- | --- | --- |
| 桌面单元测试 | 约 158 个 spec | `packages/desktop/test/unit/specs/` |
| 桌面 E2E | 约 150 个 spec | `packages/desktop/test/e2e/` |
| Muya 单元测试 | 360+ 个 spec | `packages/muya/src/**/__tests__/` |
| Muya 浏览器 E2E | 约 160 个 spec | `packages/muya/e2e/tests/` |
| CommonMark 0.31 | 593 / 652（91.0%） | `packages/muya/test/spec/conformance.md` |
| GFM 0.29-gfm | 600 / 672（89.3%） | 同上 |
| 测试门禁 | lint、typecheck、unit、e2e、muya spec、循环依赖、许可证校验 | `.github/workflows/` |
| 代码风格 | desktop 2 空格/无分号；muya 4 空格/分号（独立 antfu 配置） | 两套工具链并存 |

说明：CommonMark/GFM 数字衡量的是 `renderToStaticHTML(..., { sanitize: false })` 的静态解析一致性，不等于编辑器所见即所得的完整度；但它是导出/渲染路径的重要回归基线。`expected-failures.json` 是“只降不升”的锁，新增修复必须同步更新。

### 2.4 技术债与代码风险

| 风险 | 说明 | 影响 |
| --- | --- | --- |
| Muya 自研 contenteditable | 选区、输入法、表格、撤销的边界情况多，修复呈长尾 | 最大排期风险；需要语料库和回归测试兜底 |
| 两套代码风格 | desktop 2 空格/无分号，muya 4 空格/分号 | 不是阻塞项，但跨包改动需要切换上下文 |
| 导出保真度 | PDF/HTML 实现完整，但未发现像素级/版面级视觉回归基线 | 字体、分页、表格、图表、CJK 容易回归 |
| macOS + Windows 分发 | `electron-builder.yml` 中 `notarize: false`；release workflow 明确 Mac 构建未签名；Windows 未配置代码签名 | 正式分发必须补 Apple Developer ID/公证和 Windows 代码签名 |
| 平台原生集成 | macOS 侧未发现 QuickLook、Spotlight、AppleScript、Touch Bar、Services；Windows 侧已有 Jump List（最近文件/新窗口），未发现缩略图工具栏/预览处理程序 | 深度原生能力需要平台扩展或 helper；Electron 能覆盖的优先用 Electron API |
| 上游分叉 | MarkText 仍在活跃开发；fork 后长期同步成本 | 需要固定同步节奏，尽量把改动做成可 patch 的模块 |
| 大文档性能 | 有 `large-file-tabs` E2E，但没有性能 SLO/基准脚本 | 需要尽早建立基准，避免后期返工 |
| Pandoc 依赖 | Word/EPUB 等导出依赖外部 `pandoc`，未安装时只提示 | 首次使用体验需要安装引导/检测 |

---

## 3. 与 Typora 的真实差距

### 3.1 差距清单（按优先级）

优先级定义：**P0** = MVP 必须；**P1** = 首版后 1–3 个月；**P2** = 首版后 6 个月/按需；**不列** = 暂不做。

| # | 差距 | 现状 | MVP 目标 | 性质 | 优先级 | 粗估 |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 表格/光标/输入法/撤销的边界情况 | 表格引擎完整（插入/删除/对齐/矩形选区/拖拽），但长尾 bug 需要系统化清理 | 50 场景矩阵；P0 问题清零；IME（中/日/韩/越）回归 | 质量 | P0 | 3–4 周 |
| 2 | Typora 主题兼容 | 33 套内置主题 + Custom CSS 文本框；无主题导入；变量和 DOM 与 Typora 不同 | 导入 Typora 风格 CSS；变量/选择器适配；10 套热门主题验证 | 功能 + 兼容 | P0/P1 | 2–3 周 |
| 3 | PDF/HTML 导出保真 | 已有完整导出设置，但缺视觉回归；字体/分页/表格/图表/CJK 未系统验证 | 30 个 fixture 的版面基线；CJK 字体；分页规则 | 质量 | P0 | 2–3 周 |
| 4 | macOS + Windows 分发与原生集成 | Mac 未签名/未公证；Windows 未签名；macOS 无 QuickLook/Spotlight/AppleScript/Touch Bar/Services；Windows 已有 Jump List，缺缩略图工具栏/预览处理程序 | 签名+公证 DMG；Windows 签名 NSIS；Touch Bar/CLI/Jump List 可做；其余做可行性 spike | 平台 | 分发 P0；原生 P2 | 双端分发 2–3 周；原生 4–8 周 |
| 5 | 图片上传广度 | PicGo + 自定义 CLI；无 iPic、S3、GitHub、Imgur 内置 provider | provider 接口 + 2–3 个内置 provider | 功能 | P1 | 1–2 周 |
| 6 | 大文档性能/撤销稳定性 | 有 E2E 和性能调试脚本，无 SLO/基准 | 1/5/10 MB 基准；输入延迟 p95；内存上限 | 质量 | P0/P1 | 2–3 周 |
| 7 | 国际化广度 | 13 种语言；Typora 此前观测 40+ | 保证现有 13 种完整；按市场补 5–10 种 | 覆盖 | P2 | 每种 2–5 天 + 审校 |
| 8 | 高级数学语义 | KaTeX 行内/块级；未发现公式自动编号/交叉引用的产品化实现 | 对照 Typora 做行为测试；按需补编号/引用 | 功能 | P2 | 1–2 周 |
| 9 | 品牌/仓库/发布 | 仍是 MarkText 品牌；工作区无 `.git`；Mac 未公证；Windows 未签名 | 新仓库、新品牌、独立 appId、双端 CI/CD | 产品化 | P0 | 1–2 周 |
| 10 | Publish/协作/插件 | 未发现 Typora Publish 类集成；无协作/插件系统 | 不在 MVP；观察需求 | 功能 | 不做 | — |

### 3.2 对上一版结论的修正

上一版差距清单里以下项目被高估了，实际代码已具备：

| 上一版说法 | 实际情况 |
| --- | --- |
| “Word/Epub/Pandoc 导出缺失” | 已实现 9 种 Pandoc 导出格式，含 docx、odt、rtf、epub3、LaTeX、reST、Org、MediaWiki、Textile；需外部安装 Pandoc |
| “打印分页缺失” | 已实现打印/PDF 导出，含页面尺寸、方向、页边距、页眉页脚、标题分页规则、TOC、标题自动编号 |
| “图片上传集成不完整” | 已有 PicGo CLI + 自定义 CLI 脚本、文件夹/路径/上传三种策略、相对路径、媒体查看器；缺的是 provider 广度 |
| “数学/Mermaid 支持不足” | KaTeX、Mermaid、PlantUML、flowchart、sequence、Vega-Lite 均已接入，且有 E2E |
| “没有源码模式/大纲/文件树” | 均已实现，且有大量 E2E |

仍然成立的差距：表格/光标/IME 细腻度、Typora 主题兼容、macOS/Windows 原生集成、40+ 语言、大文档性能、双端发布签名/公证。

---

## 4. 产品定义与 MVP 范围

### 4.1 目标用户与差异化

目标用户：需要本地 Markdown 文件、所见即所得写作、可导出 PDF/Word 的作者、研究者、工程师、知识工作者。

建议选 1–2 个差异化点，不要同时打所有点：

- **主题生态兼容**：让 Typora 用户能低成本迁移自己的主题（最强迁移钩子，但工作量在适配层）。
- **macOS + Windows 平台质感**：macOS 签名/公证、Touch Bar、QuickLook、Spotlight、AppleScript；Windows 签名、Jump List、缩略图工具栏、文件关联、自动更新（平台钩子强，但深度原生能力需要扩展/helper）。
- **大文档/长文写作性能**：1–10 MB 文档的打开、滚动、输入、导出（最容易被验证，也最容易形成口碑）。
- **导出保真**：PDF/Word/EPUB 的版面一致性（对学术/出版用户最关键）。

### 4.2 MVP 范围（P0）

必须做：

- 打开/编辑/保存本地 Markdown；标签页、文件树、多根目录、搜索、快速打开、会话恢复、自动保存。
- WYSIWYG + 源码模式 + Typewriter + Focus + Reading Mode。
- 表格、数学、Mermaid/PlantUML/flowchart/sequence/Vega、图片（剪贴板/拖拽/文件夹/上传）、脚注、Front Matter、GitHub Alerts、高亮、TOC。
- HTML/PDF/打印导出达到“日常可用、版面稳定”；Word/EPUB 通过 Pandoc，带安装引导。
- 33 套内置主题 + Custom CSS + Typora 风格主题导入 v1（10 套验证）。
- 现有 13 种语言完整；新增文案不缺失。
- macOS 签名 + 公证 DMG；Windows 签名 NSIS + 文件关联 + 自动更新；自有更新源；Linux 保持可构建，但不作为首发门禁。
- Windows 兼容性专项：路径/盘符/长路径、GBK/Shift-JIS/UTF-8 BOM、CRLF、微软拼音 IME、CJK 字体回退、高 DPI、资源管理器拖拽。
- 50 篇文档回归语料；性能 SLO；崩溃/错误可诊断。

明确不做（P1/P2）：

- QuickLook、Spotlight、AppleScript、Services、Windows 预览处理程序/COM（MVP 只做 Touch Bar、Jump List、缩略图工具栏、CLI/URL scheme）。
- 40+ 语言全覆盖（先保证 13 种，再按市场补）。
- Typora Publish、协作、插件系统、移动端/Web 端。
- 打包/分发 Typora 主题或任何 Typora 资源（个人本地使用见 1.4；对外分发禁止）。
- 重写 Muya 内核或更换编辑器引擎。

### 4.3 MVP 验收指标（建议）

| 维度 | 指标 |
| --- | --- |
| 文档兼容 | 50 篇语料打开/保存/导出无数据丢失；Markdown round-trip 逐字节或人工 diff 通过 |
| 编辑性能 | 1 MB 文档冷打开 < 2 s；10 MB < 10 s；输入延迟 p95 < 16 ms（以基准机为准） |
| 导出质量 | 30 个 PDF fixture 版面回归通过率 ≥ 95%；CJK/代码块/表格/图表/分页无 P0 问题 |
| 主题兼容 | 10 套热门 Typora 风格主题渲染无布局破坏；不支持的选择器有明确提示 |
| 稳定性 | 2 周 Beta 崩溃自由会话 ≥ 99.5%；P0 bug 清零 |
| 安装体验 | macOS DMG 签名/公证通过；Windows NSIS 安装/卸载/升级通过；双端首次启动无 SmartScreen/Gatekeeper 阻断；自动更新可用 |
| 本地化 | 13 种语言 key 完整率 100%；新增文案全部有英文回退 |

---

## 5. 12–14 周执行计划（macOS + Windows 首发）

假设：1 名资深全职主程 + 0.5 名设计/QA；macOS + Windows 双端首发；范围冻结；不重写内核。若只有 1 人且兼顾设计/发布/运营，按 16–20 周排；若 2 名全职开发，可按 10–12 周压缩。双端 QA/打包/签名大约比单 macOS 多 2–3 周。

> W0 是准备周，不计入 12–14 周；W1–W10 为建设，W11–14 为缓冲/RC，可按双端情况压缩到 12 周。

| 周 | 主题 | 主要工作 | 交付/验收 |
| --- | --- | --- | --- |
| W0（3–5 天） | 基线与测试床 | 新建 git 仓库并提交基线；`pnpm install`、`build:unpack`、`test`、`lint`、`typecheck`；记录启动/打开/输入/导出基线；建立 50 篇语料 | 基线报告；可重复构建；语料库 v1 |
| W1–2 | 编辑核心加固 | 复现并修复表格/光标/选区/输入法/撤销 Top 20 问题；补 E2E；IME 矩阵（中/日/韩/越）；表格宽表/粘贴/拖拽/嵌套内容 | 20 个修复 + 20 个 E2E；无 P0 回归 |
| W3 | Markdown/渲染保真 | 数学（行内/块级/`\tag`/mhchem/错误）、图表（Mermaid/PlantUML/flowchart/sequence/Vega）、HTML 清洗；CommonMark/GFM 高价值失败项 | 渲染回归套件；spec 通过率不下降 |
| W4 | 主题兼容 v1 | 主题加载目录与导入 UI；Typora 变量桥接；选择器适配/降级提示；10 套主题验证 | 主题导入可用；兼容性报告 |
| W5 | 导出/打印保真 | 30 个 HTML/PDF fixture；CJK 字体；代码换行；分页；表格/图表；TOC/Front Matter；页眉页脚；Pandoc 安装引导与 docx/epub 验证 | 导出验收矩阵；视觉回归脚本 |
| W6 | 图片与上传 | provider 接口；PicGo 加固；自定义 CLI；可选 S3/iPic；剪贴板/拖拽/文件夹/路径；失败恢复；临时文件清理 | 上传矩阵 + 测试 |
| W7 | 文件/工作区与性能 | 标签页、多根、搜索、快速打开、会话恢复、自动保存；1/5/10 MB 基准；撤销栈上限；内存 | 性能报告；SLO 达标或给出差距 |
| W8 | i18n 与偏好 | 944 key 审计；现有 13 种完整；按市场补 5 种；locale 校验；RTL 冒烟；快捷键/菜单一致性 | 语言覆盖率报告 |
| W9 | 双端打包、签名与原生 spike | macOS：Developer ID、hardened runtime、公证、DMG；Windows：代码签名、NSIS、文件关联、SmartScreen；双端自动更新；Touch Bar/CLI/URL scheme/Jump List；QuickLook/Spotlight/AppleScript/Windows 预览处理程序可行性 memo | 签名公证 DMG + 签名 NSIS；双端更新可用；原生 go/no-go |
| W10 | Beta 硬化 | Bug bash；50 篇语料全量；双端测试矩阵；可访问性；首次启动/引导；文档；可选崩溃上报 | 双端 Beta 构建 |
| W11–14 | 缓冲与 RC（按需） | Beta 反馈修复；双端性能回归；发布检查；Linux 冒烟 | 双端 RC / MVP 发布 |

排期原则：

- 编辑核心（W1–2）和导出（W5）是硬依赖，不要并行压缩。
- 双端打包、签名、文件关联和自动更新是 P0，不能压缩到缓冲周。
- 如果确认只做个人使用，可省掉 W9 的签名/公证/NSIS 发布硬化，把时间投入编辑器、主题/图标替换与导出；个人版可按 8–10 周排。
- 主题兼容（W4）和原生集成（W9）是“可降级”项：时间不够就缩小验证主题数量/推迟原生 helper。
- W11–14 是缓冲，不是额外功能；不要把 P1 功能塞进缓冲。
- 任何涉及 Muya 状态/事务/选区的改动，必须先加回归测试再改。

---

## 6. 关键技术方案

### 6.1 Typora 主题兼容层

问题：Typora 主题通常以 `--bg-color`、`--text-color`、`--md-char-color`、`--side-bar-bg-color` 等 CSS 变量和 `#write`、`.md-fences`、`.md-table`、`.md-math-block`、`.CodeMirror` 等选择器编写；MarkText 使用 `--themeColor`、`--editorColor`、`--editorBgColor`、`--sideBarBgColor` 等变量和 `.mu-editor`、`.mu-code-block`、`.mu-table` 等 DOM。

建议实现：

1. 主题加载：扫描 `userData/themes/editor/*.css`，提供导入/删除/预览；不内置任何 Typora 主题。
2. 变量桥接：在主题前后注入兼容样式，把 Typora 常用变量映射到 MarkText 变量（或反向映射），保证颜色/背景/边框/选中态可用。
3. 选择器适配：用 PostCSS 或运行时 CSS 重写，把 `#write` → `.mu-editor`、`.md-fences` → `.mu-code-block`、`.md-table` → `.mu-table` 等；无法映射的选择器记录 warning，不 silent fail。
4. 资源处理：`url()` 相对路径按主题文件目录解析；`@font-face` 缺字体时回退；限制外链请求。
5. 验收：10 套热门主题 × 明/暗 × 编辑/源码模式；布局不破坏、文字可读、表格/代码/引用/图片正常。

风险：Typora DOM 与 MarkText 不完全同构，部分主题依赖 Typora 特有结构；兼容层只能做到“大部分主题可用”，不要承诺 100%。

### 6.2 PDF/HTML 导出保真

现状：`electron-builder` 的 `printToPDF` 已启用 `printBackground`、`generateTaggedPDF`、`generateDocumentOutline`；导出设置覆盖页面尺寸/方向/边距、字体、行高、标题编号、Front Matter、页眉页脚、导出主题。

建议：

1. 建立 fixture：30 篇覆盖标题/段落/列表/表格/代码/数学/图表/图片/脚注/引用/TOC/Front Matter/CJK/长表格/分页边界。
2. 视觉回归：用 Chromium `printToPDF` 生成 PDF，再用 `pdftoppm`/`pdfjs-dist` 转 PNG，按页做像素/结构 diff；CI 里存基线。
3. 字体：评估内置 Noto Sans/Serif CJK（OFL）或依赖系统字体；至少保证 macOS/Windows 的 CJK 回退一致（Linux 可选）。
4. 分页规则：标题与后续内容不分离、代码块/表格/图片不跨页断裂、避免孤行/寡行；补充 CSS `break-*`。
5. 页眉页脚：现有单栏/三栏样式；评估增加页码字段（Typora 有页码能力），但不要破坏现有布局。
6. Pandoc：检测/安装引导；导出前校验目标格式；图片 `--extract-media`；错误信息可操作。

### 6.3 图片上传 provider

现状：`main/ipc/uploader.ts` 支持 PicGo 和自定义 CLI；`keytar` 已用于密钥存储。

建议：

1. 定义 `UploaderProvider`：`id`、`label`、`validateConfig`、`upload(localPath) => Promise<url>`、`dispose`。
2. 内置：PicGo（保留）、自定义命令（保留）、S3 兼容（可选）、GitHub（可选）、iPic（macOS，CLI 包装，可选）。
3. UI：配置、测试连接、错误提示、上传进度；失败时保留本地图片并提示。
4. 安全：`spawn` 参数数组而非 shell 拼接；不记录密钥；URL 校验；临时文件清理；离线/超时处理。
5. 验收：3 个 provider 的端到端上传；剪贴板图片、拖拽图片、相对路径、上传失败恢复。

### 6.4 平台原生集成（macOS + Windows）

| 能力 | 平台 | 可行性 | 建议 |
| --- | --- | --- | --- |
| Touch Bar | macOS | Electron `TouchBar` API，低工作量 | MVP 可做：格式化按钮、字数、模式切换 |
| Dock 菜单 / Jump List | macOS / Windows | 已有 Dock 菜单；Windows 已有 Jump List（最近文件/新窗口） | MVP 保留并补任务/最近文件 |
| CLI / URL scheme | 双端 | 已有 CLI 解析；可加自有 scheme | MVP 可做：打开文档、只读模式、新窗口 |
| 缩略图工具栏 | Windows | Electron `setThumbarButtons`，低工作量 | MVP/P1 可做：常用命令 |
| QuickLook | macOS | 需要 Quick Look 扩展（Swift/ObjC `.appex`）+ 签名/公证 | P2；先做可行性 spike |
| Spotlight | macOS | 需要 `mdimporter` 原生插件 | P2；与 QuickLook 一起评估 |
| AppleScript / Services | macOS | 需要 `sdef` + Apple Event / NSServices；Electron 无直接支持 | P2；可先用 URL scheme/CLI 提供脚本能力 |
| 预览处理程序 / Windows Search | Windows | 需要原生 Shell Extension / Property Handler | P2；与 QuickLook/Spotlight 同期评估 |
| COM 自动化 | Windows | 需要原生 COM server | P2；可先用 CLI/URL scheme |

结论：MVP 做 macOS Touch Bar + Windows Jump List/缩略图工具栏 + 双端 CLI/URL scheme；QuickLook/Spotlight/AppleScript/Services/Windows 预览处理程序/COM 需要原生 helper，建议在产品验证后单独立项。不要把“原生壳”作为首版前置条件。

### 6.5 性能与稳定性

1. 基准脚本：生成 100 KB / 1 MB / 5 MB / 10 MB 文档（含表格、代码、数学、图片引用），测冷启动、打开、滚动、输入、撤销、导出、内存。
2. 指标：输入延迟 p95、首屏时间、滚动帧率、内存峰值、撤销栈大小；记录机器/系统/构建 hash。
3. 优化顺序：先测 Muya 事务/渲染热点，再考虑虚拟化、分块渲染、worker；不要先换引擎。
4. 稳定性：外部文件变更/冲突、自动保存失败、崩溃恢复、超大剪贴板、图片加载失败、网络图表超时。
5. 现有工具：`pnpm run perf:inspect` / `perf:inspect-brk`；`packages/website/content/docs/dev/PERFORMANCE.md`。

### 6.6 i18n

- 现有 13 种语言、约 944 key；`locale-validation` 测试已存在。
- MVP 只保证现有语言完整 + 新增文案不缺失；不要为了“40+”牺牲核心质量。
- 新增语言按市场优先级：日/韩/德/法/西/葡/俄/繁中已有；可补阿拉伯语（RTL）、希伯来语、印尼语、越南语、泰语等。
- 建立社区翻译流程：英文源 key → 翻译平台/PR → 审校 → 自动化校验；机器翻译必须人工审校。
- RTL 需要单独布局测试，不要假设镜像可用。

### 6.7 打包、签名、更新

- `electron-builder.yml`：改 `appId`/`productName`/图标/文件关联；mac `notarize: true`，配置 hardened runtime 和 entitlements。
- macOS：Apple Developer ID Application 证书、公证（notarytool）、DMG 签名；首次启动 Gatekeeper 验证；确认 x64/arm64 构建矩阵。
- Windows：代码签名证书（OV/EV；强烈建议）、NSIS 安装器（per-user 默认）、文件关联、SmartScreen 信誉、x64/arm64 构建矩阵；未签名构建会触发 SmartScreen 警告。
- Linux：保持可构建（AppImage/deb/rpm/snap），但不作为首发支持面；注意 `libasound`/`libgbm` 依赖（仓库已处理）。
- 自动更新：`electron-updater` 已接入；双端更新源、签名校验、灰度/回滚；Windows 上验证安装/升级/卸载。
- 版本：从 `0.24.0-dev` 切到自有版本线（如 `1.0.0-beta.1`）；保留 `CHANGELOG`。

### 6.8 Windows 兼容性专项

- 路径：盘符、UNC、长路径（`\\?\`）、反斜杠 Markdown 链接、文件监听、拖拽路径。
- 编码：GBK/GB18030、Shift-JIS、UTF-8 BOM；`ced` 检测；保存时保持原编码。
- 换行：CRLF/LF 保持；Git 协作场景。
- IME：微软拼音/日文/韩文输入；组合事件、候选窗、光标位置。
- 字体：微软雅黑/宋体/等线回退；PDF 嵌字与导出字体。
- Shell：文件关联、“打开方式”、`%LOCALAPPDATA%` 安装目录、命令行 `marktext`。
- 显示：高 DPI、多显示器、窗口位置/缩放恢复。
- 安全：SmartScreen、Defender 误报、安装包/更新包签名。
- 测试矩阵：Windows 10/11 x64；arm64 视用户占比决定。

### 6.9 新仓库与上游同步

工作区已移除 `.git`。建议：

```sh
cd /Users/Admin/project/marktext
git init
git add .
git commit -m "chore: import MarkText baseline (upstream a520befd, 0.24.0-dev)"
git remote add upstream https://github.com/marktext/marktext.git
git fetch upstream develop
```

同步策略（三选一，按团队规模）：

1. **季度同步**：每季度 `git fetch upstream`，用 `git diff upstream/develop` 评估变更，挑安全提交 cherry-pick；适合小团队。
2. **双分支**：`vendor/upstream` 保存上游快照，`main` 保存产品改动；每次同步把上游差异作为 patch 合入；适合中团队。
3. **贡献回流**：把通用修复提 PR 给上游，减少分叉；适合长期维护。

无论哪种，**产品改动尽量集中在 `packages/desktop` 和新增适配层，少改 Muya 内核**；必须改内核时，单独分支 + 回归测试 + 记录 patch。

---

## 7. 测试与验收

### 7.1 测试金字塔

| 层级 | 工具 | 覆盖 |
| --- | --- | --- |
| 单元 | Vitest | Muya 状态/事务/选择器/块行为、主进程工具、导出 CSS |
| 规范 | Muya spec | CommonMark 0.31、GFM 0.29-gfm、round-trip |
| 集成/E2E | Playwright | 桌面启动、编辑器输入、表格、导出、主题、搜索、会话恢复 |
| 视觉 | PDF/截图 diff | 导出 fixture、主题 fixture |
| 平台矩阵 | 手动/CI | macOS arm64/x64；Windows x64（arm64 可选）；双端安装/升级/自动更新 |
| 手动 | 清单 | IME、触控板、可访问性、首次启动、Gatekeeper/SmartScreen |

### 7.2 Typora 对照语料

- 50 篇 Markdown，覆盖：标题/段落/列表/任务列表/引用/代码/表格/数学/图表/图片/脚注/Front Matter/链接/HTML/emoji/TOC/长文/宽表/CJK/混合语言。
- 每篇记录：Typora 中的预期行为、MarkText 当前行为、差异等级（P0/P1/P2）、截图/录屏（不提交到仓库，按贡献指南放到仓库外）。
- 不把 Typora 的 CSS/JS/语言包/主题放进语料库；只使用自己编写的 Markdown 和公开规范示例。

### 7.3 回归门禁

每次合并必须通过：

```sh
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm --filter @muyajs/core test
pnpm --filter @muyajs/core test:spec
pnpm --filter @muyajs/core check-circular
pnpm run validate-licenses
```

发布前额外：desktop E2E、muya E2E、双端导出视觉回归、macOS 签名/公证、Windows 签名/SmartScreen、双端安装/升级/自动更新验证。

---

## 8. 风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
| --- | --- | --- | --- |
| 法律/EULA | 中 | 高 | 严格 clean-room；不复制资源；商业发布前法律审阅 |
| Muya 长尾 bug | 高 | 高 | 语料库 + 回归测试；40% 缓冲；优先修 P0；不重写内核 |
| 主题兼容不达预期 | 中 | 中 | 明确“尽力兼容”边界；支持变量/选择器白名单；10 套验证 |
| 平台原生集成延期 | 高 | 中 | 原生 helper 单独立项；MVP 只做 Touch Bar/Jump List/缩略图工具栏/CLI/URL scheme |
| Windows 兼容性（路径/编码/IME/字体/高 DPI） | 高 | 中/高 | W1 起跑 Windows 冒烟；建立双端测试矩阵；编码/CRLF 专项 |
| 导出保真回归 | 中 | 高 | 视觉回归基线；字体/分页专项；发布前人工抽检 |
| 大文档性能不达标 | 中 | 高 | 第 7 周前建基准；早测早优化；必要时限制超大文件并提示 |
| 上游分叉成本 | 高 | 中 | 季度同步；改动模块化；通用修复回流 |
| 范围蔓延 | 高 | 高 | P0 冻结；变更评审；W11–14 只修 bug |
| 双端签名/公证/更新源 | 中 | 高 | 提前申请 Apple Developer + Windows 代码签名证书；CI 密钥管理；灰度发布 |
| Pandoc 依赖 | 高 | 低/中 | 检测/安装引导；文档；可选内置（注意许可证/体积） |
| i18n 质量 | 中 | 中 | 社区 + 审校；机器翻译不直接上线；RTL 单独测试 |

---

## 9. 待决策事项

1. **首发平台**：已定 macOS + Windows；需确认架构矩阵（macOS arm64/x64、Windows x64/arm64）和 Linux 是否只保持可构建。
2. **产品形态**：个人使用（local-only）还是对外分发？个人使用可放宽本地图标/主题替换；对外分发必须 clean-room。若闭源商业，仍需保留 MarkText MIT 版权声明；若开源，是否回馈上游？
3. **差异化优先级**：主题兼容 / macOS+Windows 平台集成 / 大文档性能 / 导出保真，选 1–2 个。
4. **团队与预算**：1 人全职，还是 2–3 人？是否外包设计/QA/本地化？
5. **命名与品牌**：产品名、appId、图标、域名、更新源；是否保留 “MarkText” 字样？
6. **原生集成边界**：是否接受 MVP 不含 QuickLook/Spotlight/AppleScript/Windows 预览处理程序/COM？若必须含，排期需增加 4–8 周并引入原生开发。
7. **上游策略**：季度同步、双分支，还是尽量回流？是否接受长期分叉？
8. **发布标准**：Beta 是否公开下载？是否要求 macOS 公证 + Windows 代码签名后才发布？是否收集崩溃报告？

---

## 10. 本周执行清单

1. 新建仓库并提交基线：

   ```sh
   cd /Users/Admin/project/marktext
   git init
   git add .
   git commit -m "chore: import MarkText baseline (upstream a520befd, 0.24.0-dev)"
   git remote add upstream https://github.com/marktext/marktext.git
   git fetch upstream develop
   ```

2. 跑通构建与测试，记录结果：

   ```sh
   pnpm install
   pnpm run build:unpack
   pnpm run lint
   pnpm run typecheck
   pnpm run test
   pnpm --filter @muyajs/core test
   pnpm --filter @muyajs/core test:spec
   ```

3. 建立 `test/fixtures/typora-parity/`（或等价目录）的 10 篇种子文档，覆盖表格、数学、图表、图片、脚注、Front Matter、CJK。
4. 从语料和 GitHub issues 中筛出 P0 Top 20，形成 W1–2 的修复清单。
5. 确认第 9 节的 8 个决策，尤其是架构矩阵、品牌、原生集成边界。
6. 双端发布准备：申请/确认 Apple Developer 账号与 Windows 代码签名证书；确认 macOS arm64/x64、Windows x64/arm64 构建矩阵。
7. 建立基线指标：启动时间、1/5/10 MB 打开时间、输入延迟、导出耗时、内存。

---

## 附录 A：证据索引

| 主题 | 路径 |
| --- | --- |
| 根脚本/依赖 | `package.json`、`packages/desktop/package.json`、`packages/muya/package.json` |
| 主进程 | `packages/desktop/src/main/` |
| 渲染层 | `packages/desktop/src/renderer/src/` |
| IPC 类型 | `packages/desktop/src/shared/types/ipc.ts` |
| Muya 入口 | `packages/muya/src/muya.ts`、`packages/muya/src/index.ts` |
| Muya 块 | `packages/muya/src/block/` |
| Muya 状态 | `packages/muya/src/state/` |
| Muya 历史 | `packages/muya/src/history/` |
| 导出 | `packages/desktop/src/main/menu/actions/file.ts`、`packages/desktop/src/renderer/src/util/pdf.ts`、`packages/desktop/src/renderer/src/components/exportSettings/` |
| Pandoc | `packages/desktop/src/main/utils/pandoc.ts` |
| 图片上传 | `packages/desktop/src/main/ipc/uploader.ts`、`packages/desktop/src/renderer/src/prefComponents/image/` |
| 主题 | `packages/desktop/src/renderer/src/assets/themes/`、`packages/desktop/src/renderer/src/util/theme.ts` |
| 语言包 | `packages/desktop/static/locales/`、`packages/muya/src/locales/` |
| 打包 | `packages/desktop/electron-builder.yml`、`.github/workflows/release.yml` |
| 规范基线 | `packages/muya/test/spec/conformance.md`、`packages/muya/test/spec/expected-failures.json` |
| 用户文档 | `packages/website/content/docs/end-user/` |
| 开发文档 | `packages/website/content/docs/dev/` |

## 附录 B：Typora 1.14.15 观测摘要（此前 REA）

仅作为行为参照，不作为代码来源：

- 原生 macOS 应用（Cocoa/AppKit + WebKit + Sparkle），不是 Electron。
- 主二进制约 3.2 MB Mach-O（x86_64 + arm64），约 238 个自定义 ObjC 类。
- 编辑器 “TypeMark” 基于 `contenteditable`，不是 ProseMirror/remark。
- `main.js`、`frame.js` 各约 1.7 MB，单行压缩，88 个 SystemJS 模块，无 sourcemap。
- 约 187 个 JS↔原生 bridge 方法（file/document/menu/export/print/images/clipboard/window/quickOpen 等）。
- 资源约 30 MB：40+ 语言、主题、HTML/CSS、文档。
- Windows/Linux 代码中存在 Electron 分支；macOS 为原生壳。

结论：REA 适合架构取证和行为理解，不适合作为可维护生产源码来源。

## 附录 C：与上一版结论的差异

| 项目 | 上一版 | 本版（基于代码） |
| --- | --- | --- |
| 路线 | Fork MarkText | 维持 |
| Word/EPUB/Pandoc | 列为差距 | 已实现 9 种格式，需外部 Pandoc |
| 打印分页 | 列为差距 | 已实现页面尺寸/边距/页眉页脚/分页规则 |
| 图片上传 | 列为差距 | 已有 PicGo + 自定义 CLI；缺 provider 广度 |
| 数学/图表 | 列为差距 | 已接入 KaTeX/Mermaid/PlantUML/flowchart/sequence/Vega |
| 主题兼容 | 列为差距 | 仍是真实差距（变量/DOM 不同，无导入） |
| macOS/Windows 原生 | 列为差距 | 仍是真实差距（macOS 深度集成未发现实现；Windows 已有 Jump List） |
| 40+ 语言 | 列为差距 | 仍是真实差距（当前 13 种） |
| 大文档性能 | 列为差距 | 仍是真实差距（有 E2E，无 SLO/基准） |
| 时间预估 | 1–2 周可用、2–4 个月接近核心体验 | 12–14 周双端 MVP、9–18 个月全功能/全平台（1 人基准） |

## 附录 D：路线对比（1 名资深开发者，macOS + Windows 首发）

| 路线 | 首版可用 | 接近 Typora 核心体验 | 全功能/全平台 | 可维护性 | 主要风险 |
| --- | --- | --- | --- | --- | --- |
| A. 反编译 Typora 重建 | 4–6 个月 | 8–14 个月 | 18–30 个月 | 低 | EULA/版权、产物不可维护 |
| B. Fork MarkText（本方案） | 1–2 周跑通 | 2–4 个月 | 9–18 个月 | 中高 | 上游分叉、Muya 长尾 |
| C. Muya 内核 + 原生/Tauri 壳 | 1–2 个月 | 3–6 个月 | 12–20 个月 | 高 | 原生开发成本 |
| D. Clean-room（Milkdown/TipTap + Tauri） | 3–5 个月 | 6–12 个月 | 18–36 个月 | 最高 | 产品组装工作量大 |

时间是量级估算，不含 40+ 语言、License/激活、自动更新等产品外围。B 的“1–2 周跑通”指构建和基本编辑；“2–4 个月接近核心体验”偏功能覆盖，本文件的“12–14 周 MVP”还包含双端质量、导出、主题和发布硬化。
