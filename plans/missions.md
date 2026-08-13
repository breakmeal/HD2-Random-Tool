# 任务档案（Missions Dossier）ExecPlan

状态：Active
创建日期：2026-08-08
最后更新：2026-08-08

## Purpose / Goal

在页面右侧竖向入口列新增第 4 个入口「任务」，点击后展开一个与「敌人档案」同风格的分屏档案舞台，展示《HELLDIVERS 2》各阵营的主任务（Main Objectives）。不同阵营拥有不同任务；每个任务的详情中明确标注其难度范围、时限、目标，并说明不同难度之间的差异。

## Requirements

- [ ] 右侧入口顺序保持「敌人 / 装备图鉴 / 任务 / 资料与译名」或类似合理顺序，且入口与现有悬停/聚焦/展开动画一致。
- [ ] 任务按阵营分组：虫族、机器人、光能者，另加「通用」（任意阵营都可出现的主任务）。
- [ ] 每个任务卡片显示任务图标与中英文名；点击后放大显示详情。
- [ ] 详情包含：阵营、难度范围、时限、目标说明、以及「难度差异」说明。
- [ ] 档案内提供一份 1–10 级难度梯度参考（敌军数量/种类、巡逻频率、行动修正、据点规模、可选目标数量的变化）。
- [ ] 任务图标使用从 Helldivers Wiki 下载的本地文件；失败时显示纯色占位，不使用推测图片。
- [ ] 未核实或停用/事件型任务如实标注，不杜撰数值。
- [ ] 复用现有 `.enemy-mode` / 分屏宽度动画与「超级地球」左侧返回面板；ESC 与左侧返回可关闭。
- Out of scope: 不实现任务随机抽取；不修改随机部署、军备库、图鉴现有行为。

## Current State

- 右侧入口列在 `index.html` 的 `.right-rail` 中，现有 `enemyDossierBtn`（敌人）、`codex`（装备图鉴）、`intel`（资料与译名），分别由 `interface-refresh.css` 的 `.side-portal` 样式与 `enemy-dossier.js` / `app.js` 控制。
- `enemy-dossier.js` 是任务档案可直接复用的模式：独立 `enemyState`、阵营页签、竖卡列表、放大详情、`enemyImageFallback` 图片失败占位、`.enemy-mode` 分屏类与 `#earthStageReturn` 返回、ESC 关闭。
- 脚本加载顺序固定于 `index.html` 末尾：`data.js → equipment-details.js → enemy-data.js → stratagem-ratings.js → refreshed-images.js → equipment-descriptions-zh.js → app.js → codex-v2.js → enemy-dossier.js`。
- 任务数据来源为 Helldivers Wiki 的 `Missions` Cargo 表与各任务页 `{{Infobox Mission}}`，已核实主任务共 64 个（通用 10、虫族 26、机器人 20、光能者 8），另有 32 个可选/战术目标暂不纳入。
- 难度信息来自 Helldivers Wiki `Difficulty` 页的「Mission Difficulty Changes」表（1–10 级梯度）。

## Implementation Plan

1. 编写采集脚本，从 Cargo 与各任务页拉取结构化字段（阵营、图片、最低/最高难度、时限、简报、目标步骤），并把任务图标下载到 `assets/missions/`。
2. 手工整理 `mission-data.js`：64 个任务的中英文名、阵营、难度范围、时限、目标中文说明、难度差异说明、本地图标路径。
3. `index.html`：在 `.right-rail` 增加「任务」入口，并在 `.enemy-overlay` 之外新增任务档案舞台结构。
4. `mission-dossier.js`：阵营页签、搜索、卡片列表、详情、难度梯度参考、图片失败占位、打开/关闭与焦点管理。
5. `mission-dossier.css`：入口色、卡片、详情、难度梯度样式，沿用敌方档案的深色终端视觉。
6. 更新文档：`README.md`（功能与图片来源）、`SOURCES.md`（数据与图片来源）、`AGENTS.md`（目录结构、脚本顺序、新增文件说明）。
7. 验证：`node --check` 所有改动的 JS/MJS；静态服务器打开页面核对交互与无控制台报错。

## Progress

- [x] 2026-08-08：核实任务与难度数据来源，确认 64 个主任务清单。
- [x] 采集脚本 `scripts/collect-mission-data.mjs` 下载 64 个任务图标到 `assets/missions/`。
- [x] 编写 `mission-data.js`（64 个主任务 + 4 阵营 + 10 级难度梯度）。
- [x] UI 与逻辑实现（`index.html` 入口与舞台、`mission-dossier.js`、`mission-dossier.css`）。
- [x] 文档更新（README / SOURCES / AGENTS）与 `node --check`、`validate-data.mjs` 验证。

## Decisions

- 2026-08-08 — 决定：任务档案沿用 `enemy-dossier.js` 的分屏/卡片/详情交互模式，而非新建一套完全不同组件。
  - 原因：复用已验证的交互与样式，减少回归面。
  - 影响：新功能集中在 `mission-data.js` + `mission-dossier.js` + `mission-dossier.css`，并复用 `interface-refresh.css` 的分屏机制。
- 2026-08-08 — 决定：主任务按「虫族 / 机器人 / 光能者 / 通用」四组呈现。
  - 原因：Wiki 的 `faction` 字段即如此划分；「通用」覆盖任意阵营都会出现的主任务。
  - 影响：数据模型使用 `faction` 字段，UI 有四个页签。

## Discoveries

- Helldivers Wiki 的 `Missions` Cargo 表同时包含主任务与可选目标；`faction` 为空字符串的条目对应可选/战术目标，需按 `faction ∈ {Any, Terminid, Automaton, Illuminate}` 过滤出主任务。
- 各任务页的难度信息并不统一：部分页面有明确的「每难度」说明（如 Eradicate 的击杀数、Blitz 的目标数），多数只提供 `min_difficulty_main` / `max_difficulty_main` 与 `time_limit_main`；通用梯度需要依赖 `Difficulty` 页的全局表。

## Risks / Open Questions

- 任务图标为 SVG，个别文件可能依赖 wiki 的外部资源或存在渲染问题；缓解：下载后抽查，失败时走占位逻辑。
- 部分任务为事件型/已停用（如 Deploy Dark Fluid、Retrieve Essential Personnel）；缓解：如实标注，不删除条目。
- 中文任务名无官方来源，为语义翻译；英文原名随附用于核对。

## Validation

- `node --check mission-data.js mission-dossier.js scripts/collect-mission-icons.mjs`。
- 静态服务器打开页面：右侧四入口顺序与悬停/展开、任务页签切换、搜索、卡片打开详情、难度梯度显示、图片失败占位、ESC/左侧返回。
- 核对 64 个任务的图标文件均存在于 `assets/missions/`。

## Outcome

已完成：

- 右侧竖向入口列新增「任务」入口（紫色，位于「敌人」之后），打开独立的任务档案分屏。
- 任务按虫族（26）、机器人（20）、光能者（8）、通用（10）四组页签呈现，共 64 个主任务。
- 每个任务详情含阵营、难度范围、时限、目标说明与「难度差异」说明；档案顶部提供 1–10 级难度梯度参考条。
- 64 个任务图标（SVG）由 `scripts/collect-mission-data.mjs` 下载到 `assets/missions/`。
- 复用现有分屏机制（`.mission-mode`），支持阵营切换、搜索、卡片放大详情、图片失败占位、ESC 与左侧返回。

验证：

- `node --check` 通过：`app.js`、`mission-data.js`、`mission-dossier.js`、`scripts/collect-mission-data.mjs`。
- `node scripts/validate-data.mjs` 通过（0 errors；该命令校验的是装备数据，未受本次改动影响）。
- 任务数据完整性校验：64 个唯一 id，4 个阵营计数正确，无缺失字段。

遗留：

- 中文任务名为语义翻译（无官方译名），英文原名随附用于核对。
- 任务难度差异按 Wiki 公开资料整理；个别事件型/已停用任务已如实标注。
- `assets/missions/` 图标为 SVG，浏览器 `<img>` 直接渲染；已抽查文件头为合法 SVG。
