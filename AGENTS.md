# AGENTS.md

本文件适用于项目根目录及其所有子目录。内容来自当前工作区中的真实代码、`README.md`、`SOURCES.md` 和现有脚本；未发现可继承的旧版 `AGENTS.md`、`PLANS.md`、包管理配置、CI 配置或其他开发规范。

## 项目用途

这是一个《HELLDIVERS 2》非官方中文随机装备挑战选择器。它允许用户：

- 从已发布且已启用的装备中随机生成主武器、次要武器、投掷物、强化剂和四项战略配备。
- 按战争债券整组启用或排除装备，也可单独控制某件装备。
- 查看装备图片、中文译名、英文原名、官方说明、用途专属参数和攻击档案。
- 保存本地配置并通过 URL Hash 分享装备池设置。
- 查看已公布但尚未发布的内容，但这些内容不得进入随机池。

数据边界、翻译原则、图片来源和版权说明以 `README.md` 与 `SOURCES.md` 为准。当前标注的数据更新时间为 2026-08-08。

## 技术栈与运行模型

- 原生 HTML、CSS 和 JavaScript；没有前端框架。
- 浏览器端脚本使用经典 `<script>`，不是 ES Module。
- Node.js ESM 脚本用于采集和校验数据。
- 数据存放在 JavaScript 常量中，没有后端、数据库或 API 服务。
- 浏览器持久化使用 `localStorage`，共享配置使用 `#cfg=` URL Hash。
- 页面字体从 Google Fonts 加载；字体不可用时使用现有 CSS 回退字体。
- 当前 UI 固定为至少 1180px 的桌面布局，`meta viewport` 使用固定桌面宽度；手机只显示缩放后的桌面页面，不提供专用适配。
- 当前没有 `package.json`、依赖锁文件、构建工具、测试框架、Lint 或格式化工具。

采集脚本使用 Node.js 内置 `fetch`，因此实际运行需要支持原生 `fetch` 的 Node.js。项目未声明或锁定确切 Node.js 版本；通常应使用 Node.js 18 或更高版本，确切支持版本为“待确认”。

## 当前目录结构

```text
project4/
├─ index.html                 页面结构、两个主页面板、档案舞台与脚本加载顺序
├─ styles.css                基础页面样式；当前为紧凑/压缩式 CSS
├─ codex.css                 装备图鉴及内联详情的扩展样式
├─ data.js                   战争债券、装备目录、中文名、类型和标签的主数据源
├─ equipment-details.js      由采集脚本生成的装备详情和本地图片映射
├─ stratagem-ratings.js      战略配备阵营适配社区参考评分（手写派生层）
├─ app.js                    随机选择器、军备库、状态持久化和基础图鉴逻辑
├─ codex-v2.js               在 app.js 之后加载的用途化图鉴与内联详情覆盖层
├─ enemy-data.js             三阵营敌人档案（含亚阵营变体）的本地数据快照与图标路径
├─ enemy-dossier.js          敌人分屏、阵营/亚阵营分组、护甲排序、搜索、焦点和开关逻辑
├─ enemy-dossier.css         右侧平行四边形入口、分屏扩张和敌人卡片样式
├─ mission-data.js           64 个主任务的中英文名、难度、时限、目标与难度差异数据
├─ mission-dossier.js        任务分屏、阵营/通用页签、搜索、难度梯度与详情逻辑
├─ mission-dossier.css       任务入口、任务卡片、难度条与详情样式
├─ refreshed-images.js       由图片刷新脚本生成的新资源映射
├─ equipment-descriptions-zh.js 199 件装备的中文说明覆盖映射
├─ README.md                 使用方式、功能、数据口径和版权说明
├─ SOURCES.md                数据来源、图片采集方式和字段定义
├─ PLANS.md                  复杂任务 ExecPlan 编写与维护规则
├─ plans/
│  ├─ enemy-dossier.md       敌人档案功能的执行计划与验证记录
│  └─ missions.md            任务档案功能的执行计划与验证记录
├─ desktop-app/              可选的 Windows 单文件 GUI 打包与测试目录
│  ├─ app.py                 内置回环资源服务和 pywebview 启动器
│  ├─ build.ps1              复制运行资源并构建 SuperEarthArsenal.exe
│  ├─ icon.ico               EXE 图标（深色底 + 黄色六边形环与菱形，多尺寸）
│  ├─ test_bundle.py         桌面资源包静态清单校验
│  └─ dist/SuperEarthArsenal.exe 已构建的单文件 Windows GUI
├─ scripts/
│  ├─ collect-wiki-data.mjs  联网采集说明、数值和图片，并生成详情数据
│  ├─ refresh-images.mjs     联网刷新装备/敌人图片并生成不可变批次清单
│  ├─ generate-chinese-descriptions.mjs 生成并校验中文说明覆盖
│  ├─ collect-mission-data.mjs 联网采集主任务数据并下载任务图标
│  └─ validate-data.mjs      校验 ID、详情映射和本地图片完整性
├─ assets/equipment/
   ├─ primary/               主武器图片
   ├─ secondary/             次要武器图片
   ├─ throwable/             投掷物图片
   ├─ stratagem/             战略配备图标
   ├─ booster/               强化剂图标
│  └─ missing-images.txt     采集脚本生成的缺图清单
└─ assets/ui/
   ├─ enemy-terminal-bg.svg  敌人分屏本地抽象背景的可编辑源文件
   └─ enemy-terminal-bg.png  页面实际加载的栅格化背景
assets/refreshed-images/      按运行批次保存、不会覆盖旧资源的装备/敌人图片
assets/missions/             由 collect-mission-data.mjs 下载的主任务图标（SVG）
assets/enemies/              尚未纳入刷新批次的新增敌人图标（由 ENEMY_LOCAL_IMAGES 映射）
```

当前工作区没有 Git 元数据，无法从本地确认分支、提交、忽略文件或发布流程；这些规则均为“待确认”。

## 安装、启动、构建、测试与 Lint

### 安装

无需安装项目依赖。当前不存在 `npm install`、`pnpm install` 或其他项目安装步骤。

### 启动

可直接用浏览器打开 `index.html`。如果浏览器限制本地脚本或资源，应在项目根目录运行 README 已记录的静态服务器：

```powershell
py -m http.server 4173
```

然后访问：

```text
http://127.0.0.1:4173/
```

`py` 命令是否在每台开发机上可用为“待确认”；如果不可用，应使用该环境已有的等价静态文件服务器，但不要因此向项目添加依赖。

### 构建

没有构建步骤。源文件就是浏览器实际加载的交付物。

### Windows 桌面版

`desktop-app/dist/SuperEarthArsenal.exe` 是单文件 Windows GUI 交付物。它使用 pywebview 和已安装的 Edge WebView2 Runtime 显示内嵌页面，因此不会打开外部浏览器；运行时仅监听 `127.0.0.1:41735`，窗口关闭后停止资源服务。

仅在需要重新打包桌面版时，进入 `desktop-app/` 并执行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build.ps1 -PythonExe "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
```

首次构建会在 `desktop-app/.venv` 安装 `pywebview==6.2.1` 和 `PyInstaller==6.21.0`。该虚拟环境、`bundle/`、`build/`、`dist/` 与 `SuperEarthArsenal.spec` 都是桌面打包生成物，不属于网页项目运行时；构建脚本只能清理这三个受限目录，绝不能触及根目录的 `assets/equipment/` 或 `assets/refreshed-images/`。

### 数据生成

仅在明确需要刷新 Wiki 数据、官方说明或图片时运行：

```powershell
node scripts/collect-wiki-data.mjs
```

该命令需要网络访问，并会重写 `equipment-details.js`、`assets/equipment/missing-images.txt` 和 `assets/equipment/` 下的装备资源。普通 UI 修改不得顺带运行它。

### 自动校验

```powershell
node scripts/validate-data.mjs
```

脚本会检查：

- `data.js` 中是否有重复装备 ID。
- 每件装备是否存在对应详情。
- 详情映射中的图片是否存在。
- 是否存在没有对应装备的孤立详情。

出现错误时命令以非零状态退出。

### JavaScript 语法检查

当前没有统一脚本封装。修改相关文件后按需执行：

```powershell
node --check app.js
node --check codex-v2.js
node --check data.js
node --check equipment-details.js
node --check scripts/collect-wiki-data.mjs
node --check scripts/validate-data.mjs
```

### Lint 与格式化

当前没有 Lint、Prettier 或其他格式化配置，也没有可执行的 `lint` 命令。不要声称通过了不存在的 Lint；如未来引入，必须同时补充配置、命令和本文档。

## 当前架构与编码习惯

### 数据与全局脚本

- `index.html` 中脚本顺序固定为 `data.js` → `equipment-details.js` → `enemy-data.js` → `mission-data.js` → `stratagem-ratings.js` → `refreshed-images.js` → `equipment-descriptions-zh.js` → `app.js` → `codex-v2.js` → `enemy-dossier.js` → `mission-dossier.js`。
- `data.js` 先定义紧凑数组，再映射为对象。装备 ID 由 `type + 英文名` 自动派生。
- `equipment-details.js` 暴露全局 `EQUIPMENT_DETAILS`，供浏览器代码直接读取。
- `app.js` 使用单一 `state` 对象保存启用项、过滤器（含当前军备库债券）、选项、主页面标签和随机结果；初始化时把图鉴与资料面板移入共用 `archive-overlay`，主 `<main>` 只保留随机部署和军备库。
- 军备库由 `#warbondNav` 左侧债券导航和 `#warbondList` 右侧当前范围装备列表组成；`filters.warbond === 'all'` 表示全部，选择具体 ID 后只渲染该债券。
- DOM 查询使用 `$`、`$$` 辅助函数；渲染主要通过模板字符串和 `innerHTML` 完成。
- 列表交互普遍使用父容器事件委托和 `data-*` 属性。
- 可持久化状态只保存禁用 ID 和选项，不保存完整装备对象。
- `codex-v2.js` 在基础脚本初始化后覆盖图鉴相关函数，并依赖 `app.js` 已定义的全局绑定。这是当前真实结构；修改图鉴前必须同时检查两个文件。图鉴的 12 个用途分类由 `codexCategoryFor()` 唯一计算，不修改 `data.js` 的基础类型或标签。
- `enemy-dossier.js` 在最后加载，复用 `app.js` 的 `$`、`escapeHtml` 等全局绑定，但维护独立 `enemyState`。敌人列表使用竖卡，点击后打开放大详情；`.enemy-mode` 与 `.archive-mode` 都让右侧舞台占据约八分之七宽度，左侧“超级地球”返回入口固定在视口内。图片失败时只显示纯色占位，不再使用抽象背景图。
- `mission-dossier.js` 在 `enemy-dossier.js` 之后加载，复用其 `experienceShell`、`earthStageReturn` 绑定并维护独立 `missionState`。任务按虫族/机器人/光能者/通用四组页签呈现，顶部有 1–10 级难度梯度条，详情展示难度范围、时限、目标与「难度差异」；使用 `.mission-mode` 分屏类。
- `refreshed-images.js` 仅覆盖已经在对应批次 `manifest.json` 中校验通过的图片路径；缺失项继续使用原有映射。
- `equipment-descriptions-zh.js` 是中文说明生成文件；不要在 `equipment-details.js` 中直接替换英文原文，更新时运行 `scripts/generate-chinese-descriptions.mjs` 并通过覆盖率校验。
- `stratagem-ratings.js` 是手写的社区参考评分派生层，读取 `EQUIPMENT_DETAILS` 和 `GEAR`，不得把 1–100 分数描述为官方平衡数据；每项战略配备必须同时有 `terminids`、`automatons`、`illuminate` 三组分数。

### JavaScript 风格

- 主要使用 `const`，需要变化的局部值使用 `let`。
- 函数和变量使用 `camelCase`，全局常量使用大写下划线命名。
- 使用普通函数声明、箭头函数、可选链、空值合并和模板字符串。
- 代码整体较紧凑，部分函数为单行或少量行；当前没有自动格式化规范。
- 来自数据文件或远程来源的字符串在插入 HTML 前使用 `escapeHtml`。
- 不可靠数据使用 `null` 或空状态展示，不用推测值填充。

### CSS 风格

- `styles.css` 提供基础变量和全局组件样式，当前是压缩式单行文件。
- `codex.css` 作为图鉴扩展层，并包含对旧侧栏样式的停用规则。
- `enemy-dossier.css` 负责左侧“超级地球”平行四边形入口、共用分屏宽度动画以及敌人卡片；`mission-dossier.css` 负责任务入口、任务卡片、难度梯度条与任务详情；`interface-refresh.css` 负责右侧“敌人 / 任务 / 装备图鉴 / 资料与译名”竖向入口列、图鉴/资料档案舞台、随机结果图片、图鉴用途分类控件和固定桌面主工作区；页面级滚动关闭，军备库导航与装备列表各自负责内部滚动。
- 颜色优先复用 `:root` 中的 CSS 变量和装备分类色 `--cat-color`。
- 基础样式和旧图鉴样式仍保留历史响应式断点，但固定 1180px viewport 与最小页面宽度使其不再作为手机适配入口；恢复手机布局前必须重新设计并完整回归这些断点。
- 当前界面采用深色军用终端风格、黄色强调色、紧凑信息卡和中英双语标签。

### 数据规则

- `WARBONDS[].released === false` 的战争债券可以显示，但任何装备都不得进入随机池。
- 装备类型只使用现有的 `primary`、`secondary`、`throwable`、`stratagem`、`booster`。
- 中文名与英文型号同时保留；英文型号是数据核对和 ID 派生的重要依据。
- 战略配备标签目前用于区分 `offensive`、`defensive`、`support`、`backpack`、`vehicle` 等用途。
- 图鉴按用途选择字段：不要给护盾、强化剂、载具、岗哨统一套用枪械伤害模板。当前 199 件装备中有 89 件战略配备，图鉴分类覆盖红色轨道/飞鹰、蓝色三号位/背包/组合/载具和绿色自动部署/角色操控；新增条目时必须确认仍能唯一归类。
- 数据与图片来源必须能追溯到 `SOURCES.md` 中列出的资料，或在该文件中补充新的可靠来源。

## 新增功能必须遵守的规则

1. 先确认功能属于随机部署、军备库、图鉴、资料说明还是数据生成层，避免把同一规则重复实现到多个文件。
2. 涉及图鉴渲染时同时检查 `app.js` 和 `codex-v2.js`；不得因不了解覆盖关系而恢复已经停用的右侧详情抽屉。
3. 保持 `index.html` 的脚本加载顺序，除非修改方案明确处理所有全局依赖。
4. 新增动态 HTML 时，对数据内容使用 `escapeHtml`；不要把远程文本直接拼入 DOM。
5. 新增装备或战争债券时，保持中英文名称、来源、发布日期、发布状态和用途标签完整。
6. 即将发布的内容必须设置为不可进入随机池；只有核实正式发布后才能修改 `released`。
7. 修改英文装备名之前先评估 ID 变化，因为它会影响：
   - `equipment-details.js` 的键。
   - 图片文件名与路径。
   - 已保存的 `localStorage` 禁用列表。
   - 分享链接中的装备 ID。
8. 修改 `STORAGE_KEY` 或 `#cfg=` 数据结构时必须考虑旧配置迁移；当前没有迁移框架，具体兼容周期为“待确认”。
9. 新增用途或数值时扩展用途化数据模型和展示逻辑，不要用无关字段占位。
10. 无可靠资料的数值保持为空，并在 UI 中明确说明；不得凭经验估算。
11. 当前 UI 修改只需保证至少 1180px 的桌面布局可用，并沿用现有视觉语言；手机专用适配暂不维护，恢复前必须重新设计并补充响应式回归。
12. 若修改数据来源、翻译口径或下载策略，同步更新 `README.md` 和/或 `SOURCES.md`，但不要删除原有署名与非官方声明。
13. 对复杂功能、跨多个文件的修改或大型重构，按 `PLANS.md` 先建立并持续维护 ExecPlan。

## 不应随意修改的文件与目录

- `equipment-details.js`：生成文件。不要手工编辑；应修改 `data.js` 或 `scripts/collect-wiki-data.mjs` 后重新生成。
- `assets/equipment/`：采集得到的本地资源。不要批量重命名、删除或替换；路径与生成详情存在一一映射。
- `assets/refreshed-images/`：图片刷新脚本的不可变批次输出。不得删除或覆盖已有文件；新一轮刷新必须使用新的 `run-id`。
- `assets/equipment/missing-images.txt`：生成文件，不要手工维护。
- `styles.css`：基础压缩样式。避免无关重排或整文件格式化，以免产生难以审查的大范围变化。
- `index.html` 的脚本顺序：当前全局依赖依靠该顺序建立。
- `data.js` 中的英文名与自动生成 ID：修改会影响持久化数据和资源关联。
- `README.md` 与 `SOURCES.md` 中的来源、许可和非官方声明：不得在没有依据时删除或弱化。
- 不要提交或引入 `node_modules/`；项目当前没有本地依赖。

是否需要将生成图片和 `equipment-details.js` 纳入版本控制，当前无法从工作区确认，因为这里没有 Git 元数据，标记为“待确认”。

## 修改后的验证流程

根据改动范围执行以下流程：

1. 确认只修改了任务范围内的文件；数据刷新时确认生成文件变化是预期的。
2. 对所有改过的 JavaScript/MJS 文件运行 `node --check`。
3. 只要改动涉及 `data.js`、详情、图片或采集逻辑，就运行：

   ```powershell
   node scripts/validate-data.mjs
   ```

4. 用静态服务器打开页面，检查浏览器控制台没有项目自身的错误。
5. 随机部署相关改动至少验证：
   - 主武器、次要武器、投掷物和四项战略配备均能生成。
   - 强化剂开关正常。
   - 背包/支援武器限制正常。
   - 未发布内容不会进入结果。
6. 军备库相关改动至少验证左侧“全部 + 债券”顺序、点击债券只显示当前内容、整债券开关、单装备开关、搜索、类型过滤和本地保存。
7. 图鉴相关改动至少验证搜索、用途分类/债券过滤、用途专属参数、卡片下方展开与关闭；涉及分类规则时核对 199 件装备完整覆盖且没有重复归类。
8. UI 改动至少在一个不小于 1180px 的桌面宽度检查，确认没有横向溢出、遮挡或不可操作控件；当前不要求手机布局回归。
9. 档案舞台显示方式改动至少验证右侧三个入口的顺序与悬停/聚焦、敌人/图鉴/资料分屏展开、左侧返回、ESC、阵营切换、搜索和桌面压缩。
10. 数据采集改动还要核对脚本摘要中的装备数、图片数、缺图数，并抽查至少一种枪械、爆炸物、护盾、战略配备和强化剂。
11. 文档改动应核对命令、路径和统计数字仍与仓库实际状态一致。
12. 桌面打包改动还要运行 `desktop-app/test_bundle.py`、Python/PowerShell 语法检查、`validate-data.mjs`，并启动 EXE 确认其资源服务只监听回环地址；在可交互 Windows 会话中还要确认窗口没有地址栏、外部浏览器或控制台窗口。

## 任务完成条件

只有同时满足以下条件才可认为任务完成：

- 用户要求和明确验收标准全部实现。
- 未发布内容仍被排除在随机池之外。
- 生成文件由正确脚本产生，没有手工篡改或无关批量变化。
- 必要的语法检查和 `validate-data.mjs` 通过。
- 受影响的主要交互已在浏览器中验证，且没有项目自身的控制台错误。
- 响应式界面在受影响断点下可用。
- 数据来源、翻译口径或用户可见行为变化已同步到相关文档。
- 没有把未经核实的数值、译名或发布状态当作事实写入。
- 所有无法确认但会影响后续工作的事项已明确标记为“待确认”。

## 当前待确认事项

- 正式支持的 Node.js 版本与浏览器版本范围。
- 正式部署/发布流程和生产托管位置。
- Git 分支、提交、代码审查和生成文件提交策略。
- CI、自动化浏览器测试、Lint 和格式化工具是否计划引入。
- `localStorage`/分享链接需要保持多长时间的向后兼容。
- 非官方中文译名的最终审核人和审批流程。
