# 单文件桌面 GUI 打包 ExecPlan

状态：Complete
创建日期：2026-08-08
最后更新：2026-08-08 19:10

## Purpose / Goal

将当前《HELLDIVERS 2》随机军备终端封装为 Windows 桌面应用。最终用户双击一个 `.exe` 即可打开独立 GUI 窗口，不启动或跳转到系统浏览器；新建独立目录保存启动器、构建脚本、测试脚本和构建产物。

## Requirements

- [x] 新建 `desktop-app/`，桌面封装、构建缓存、测试记录和最终 EXE 均位于该目录。
- [x] 最终交付一个可直接双击的 Windows `.exe`，不要求用户安装 Python、Node.js 或项目依赖。
- [x] 应用打开为独立 GUI 窗口，没有浏览器地址栏、标签页或外部浏览器启动步骤。
- [x] 现有随机部署、军备库、敌人、装备图鉴、资料与译名、图片和本地配置功能在桌面窗口内可用。
- [x] EXE 内嵌当前实际使用的 HTML/CSS/JS 与图片，不打包历史图片批次，不删除或修改现有资源。
- [x] 桌面程序只监听本机回环地址，不暴露局域网服务；应用退出时关闭内置服务。
- [x] 提供可重复运行的构建脚本和静态/启动测试脚本。
- [x] README、AGENTS.md 和本计划同步更新。

## Current State

- 项目是无构建步骤的原生 HTML/CSS/JavaScript，直接打开 `index.html` 或静态服务器即可运行。
- 系统没有 `py`/`python` 命令，但工作区提供 Python 3.12.13 与 pip 26.0.1。
- 当前未安装 PyInstaller、pywebview 或 pythonnet；pip 索引可访问 `pywebview 6.2.1` 与 `PyInstaller 6.21.0`。
- Windows 已安装 Microsoft Edge WebView2 Runtime 151.0.4129.72。
- 项目全部资源约 304MB，其中运行所需的 `assets/equipment/`、`assets/refreshed-images/2026-08-08-matched/` 与 `assets/ui/` 约 145MB；其他刷新批次是历史留档，不应重复嵌入。
- 本机只有 .NET Runtime，没有 .NET SDK，因此不采用需要现场编译 C# 工程的路线。

## Implementation Plan

1. 创建 `desktop-app/`，编写 Python 桌面启动器：启动固定回环端口的只读静态服务，创建 WebView2 独立窗口，关闭时回收服务。
2. 编写 PyInstaller spec/PowerShell 构建脚本，只收集运行文件与当前有效图片目录，生成单文件 GUI EXE。
3. 在 `desktop-app/.venv` 安装锁定版本的 pywebview 与 PyInstaller，构建 `desktop-app/dist/SuperEarthArsenal.exe`。
4. 编写并执行静态包清单测试、Python 语法检查、现有数据校验和 EXE 启动测试。
5. 使用 Windows GUI 自动化确认 EXE 打开独立窗口、主页面渲染且不出现控制台窗口或外部浏览器。
6. 更新 README、AGENTS.md 和本计划，记录依赖、体积、运行前提与验证结果。

## Progress

- [x] 2026-08-08 18:20：确认 Python、pip、WebView2、.NET SDK 和资源体积基线。
- [x] 2026-08-08 18:35：创建 `desktop-app/`、桌面启动器、构建脚本、静态包测试和构建说明。
- [x] 2026-08-08 18:38：安装隔离构建依赖并生成 `desktop-app/dist/SuperEarthArsenal.exe`，实际大小 163,620,624 bytes（156.04 MB）。
- [x] 2026-08-08 18:57：完成资源、随机部署、图片和控制台回归；EXE 内置服务确认仅监听 `127.0.0.1:41735`。
- [x] 2026-08-08 19:10：更新 README、AGENTS.md、桌面构建说明和交付记录。

## Decisions

- 2026-08-08 — 决定：使用 pywebview + Edge WebView2 + PyInstaller onefile。
  - 原因：保留现有成熟交互和视觉，同时交付没有浏览器外壳的独立 Windows GUI；当前机器已有 WebView2 Runtime。
  - 影响：最终 EXE 内含 Python 与项目资源，但目标机器仍需要 Windows 10/11 上常见的 WebView2 Runtime。
- 2026-08-08 — 决定：应用内部使用固定回环端口 `41735` 提供静态资源。
  - 原因：onefile 每次解压目录变化，直接使用 `file://` 可能让 localStorage 来源变化；固定 `http://127.0.0.1:41735` 可保持用户配置来源稳定。
  - 影响：端口同时充当单实例保护；若被其他程序占用，启动器会显示原生错误对话框并退出。
- 2026-08-08 — 决定：只打包当前有效资源，不打包历史刷新批次。
  - 原因：完整 `assets/` 约 304MB，当前实际引用资源约 145MB；历史批次不会被页面读取。
  - 影响：不会删除历史文件，只缩小 EXE 内嵌清单。

## Discoveries

- Windows PowerShell 5.1 会把无 BOM 的 UTF-8 `.ps1` 按系统代码页解析；构建脚本中的中文错误消息导致了解析失败。已把 `build.ps1` 保持为纯 ASCII，程序窗口和文档仍使用 UTF-8 中文。
- 首次 pip 安装已成功访问索引并下载依赖，但在用户级 pip wheel 缓存目录写入时被拒绝。构建脚本已改用 `--no-cache-dir`，并对每条 Python/PyInstaller 命令检查退出码，避免依赖安装失败后继续产生不完整构建。
- PyInstaller 自动加载了 pywebview 与 pythonnet 的官方 hooks；构建完成时只有 Android 平台子模块和可选 pycparser 表的非目标平台警告，不影响 Windows Edge WebView2 后端。
- 受限自动化会话没有交互式 Windows 桌面，WebView2 顶层窗口被宿主回收，不能在该会话抓取独立窗口截图。使用同一 EXE 内嵌资源服务完成的页面回归确认主页面、随机结果、8 张结果图片和项目控制台均正常；在真实双击会话中仍应按 README 复查窗口外观。

## Risks / Open Questions

- PyInstaller 对 pywebview/pythonnet 的隐藏导入已通过实际构建确认。pywebview 官方 hook 与 pythonnet hook 均已运行；风险已解决。
- 单文件 EXE 首次启动需要把约 145MB 资源解压到临时目录，启动时间会比普通原生程序长。缓解：只打包活动图片目录并记录实际体积/启动时间。非阻塞。
- WebView2 Runtime 是 Windows GUI 渲染前提。当前机器已安装；目标机器若缺失，应用会给出错误提示。是否需要随 EXE 捆绑 Evergreen Bootstrapper 为待确认，本轮不联网安装运行时。

## Validation

- Python 启动器、构建辅助脚本语法检查。
- `node --check app.js codex-v2.js enemy-dossier.js`。
- `node scripts/validate-data.mjs`。
- 构建清单测试：必须文件齐全、历史刷新批次不进入 bundle、资源引用均能解析。
- EXE 启动时确认内置服务只监听 `127.0.0.1:41735`；关闭测试进程后端口不再处于 `LISTENING` 状态。
- 内嵌资源包页面回归：主页面标题为“超级地球 · 随机军备终端”；随机部署生成主武器、次要武器、投掷物、强化剂和四项战略配备，8/8 对应图片具有有效自然尺寸，项目控制台错误为零。
- 资源 HTTP 抽查：一张主武器 PNG、一个战略配备 SVG 和一个原始战略配备 SVG 均返回 200，MIME 类型正确。
- 受限测试宿主无法保留独立 WebView2 窗口以截图；真实交互式 Windows 会话中的窗口外观为待用户验收项。

## Outcome

已交付 `desktop-app/dist/SuperEarthArsenal.exe`（156.04 MB）及 `desktop-app/` 内的启动器、构建脚本、依赖清单和静态包测试。EXE 是无外部浏览器外壳的 Windows GUI，运行依赖目标系统已有的 Edge WebView2 Runtime；不包含 Python 或 Node.js 的用户侧安装步骤。

未删除或修改任何项目原有装备/敌人图片。打包仅复制当前生效的 `assets/equipment/`、`assets/refreshed-images/2026-08-08-matched/` 和 `assets/ui/`，历史图片批次保留在项目中且未嵌入 EXE。真实双击窗口的视觉验收受本自动化宿主无交互桌面限制，标记为待用户验收。
