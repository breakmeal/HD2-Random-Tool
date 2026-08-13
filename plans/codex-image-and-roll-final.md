# 图鉴图片裁切 + 随机收尾整组闪动 修复 ExecPlan

状态：Active
创建日期：2026-08-13
最后更新：2026-08-13

## Purpose / Goal

用户在 HEAD=ad2fbaa 之后仍观察到两个视觉问题，要求独立重新定位并修复：

1. 装备图鉴中「手雷」和「战略配备」的图片在用户实际视图里被裁切/遮挡，要求图片完整、清楚，不被容器、标签、渐变或布局遮挡。
2. 随机过程「延长 + 逐槽停止」后，最后一个槽位停止时整组再次闪动/刷新/入场/重绘，要求最后槽位停止后直接停住。

本任务只改展示层与交互层，不批量改源素材、不跑数据采集。

## Requirements

- [ ] 图鉴中手雷（throwable，PNG）图片完整显示，不被 `.codex-image` 的 `overflow:hidden` 裁切。
- [ ] 图鉴中战略配备（stratagem，SVG 为主，含个别 PNG）图片完整显示。
- [ ] 图鉴其它分类（primary/secondary/booster）图片同样不裁切（同源修复应覆盖）。
- [ ] 详情内联展开（`.detail-visual`）图片大小正确、不溢出。
- [ ] 随机最后一个槽位锁定后，界面直接稳定，不出现整组重建、入场动画重触发、图片重解码或 border 整组突变。
- [ ] 保留 `prefers-reduced-motion` 行为。
- [ ] 快速连续点击不叠加任务（roll 期间按钮禁用）。
- Out of scope: 数据采集、图片源素材、桌面打包。

## Current State

- HEAD=ad2fbaa（工作区干净），master。
- 图鉴渲染：`codex-v2.js` 的 `renderCodex()` → `codexCard()`；卡片结构 `.codex-card > .codex-image > img` + `.codex-info`。
- 关键 CSS（`codex.css`）：
  - `.codex-image{height:150px;display:grid;place-items:center;position:relative;overflow:hidden}`
  - `.codex-image img{width:88%;height:88%;object-fit:contain;...}`
  - `.codex-card[data-type="stratagem"] .codex-image img{width:72%;height:72%}`
  - `.codex-card[data-type="throwable"] .codex-image img{width:76%;height:76%}`
  - `.detail-visual{height:210px;display:grid;place-items:center}`
- 随机渲染：`app.js` 的 `roll()` + `renderLoadout()`。
  - `renderLoadout` 每次用 `$('#loadoutGrid').innerHTML = slotDefs.map(...)` 全量重建 8 张卡。
  - 滚动 10 tick 全量重建；锁定 8 次全量重建（每次 `renderLoadout(preview, locked, index)`）。
  - 收尾 `grid.add('roll-complete'); grid.remove('rolling');` 后遍历移除 `slot-locked`/`just-locked`。
- 图片资源：`assets/equipment/throwable` 与 `primary`、`secondary` 全为 PNG（有固有宽高比，如 1280×1280）；`stratagem`、`booster` 全为 SVG（`equipment-details.js` 内引用 `.svg`，个别被 `refreshed-images.js` 覆盖为 PNG，如 FX-12 / MS-11）。
- 现有验证脚本（均用 Edge headless `--dump-dom`）：
  - `scripts/validate-data.mjs`（通过：199 装备 / 199 图片 / 138 verified / 320 attacks / 0 errors）。
  - `scripts/run-smoke.mjs`（通过）。
  - `scripts/verify-codex-images-and-roll.mjs`（通过，但断言只覆盖 CSS 规则存在性与 roll 阶段计数/最终 animation=none，未覆盖 PNG 溢出与时间序列重绘）。
  - `scripts/verify-codex-layout.mjs`、`scripts/verify-codex-responsive.mjs`（布局/响应式）。

## Discoveries（实施前实测）

- **图片裁切根因**：`.codex-image` 为 `display:grid`，隐式行高 auto。PNG（有固有比例）的百分比 `height`（`height:76%` 等）相对 auto 行高无法解析，回退导致高度按宽度比例膨胀。实测 throwable img `width=238px`（76% of 313）但 `height=181px`（≈238×76%），超出 150px 容器，`overflow:hidden` 裁切底部 59px。SVG（无固有尺寸）不受影响（stratagem img 108px=72% of 150，正确）。
- 实验验证：`.codex-image{grid-template-rows:100%}` 使 throwable img 高度回到 114px、overflowY=false；flex + max-width/max-height 亦可；纯 `max-height:76%` 在 grid auto 行下仍失效。
- `.detail-visual` 同类问题：PNG 的 `max-height:82%` 在 grid auto 行下失效，img 175×175 略超预期 168px（但未溢出 205px 容器）。
- **随机收尾重绘根因**：`renderLoadout` 锁定阶段每次全量 `innerHTML` 重建 8 张卡，导致已锁定槽位图片反复重解码；最后一个槽位锁定后，收尾移除 `slot-locked` 又触发 8 张卡 border 整组突变。观测脚本记录到 18 次 `renderLoadout`（10 tick + 8 lock），锁定间隔 230ms。
- headless `--virtual-time-budget` 会跳过/加速 CSS 动画，`animationstart` 在该模式下捕获不到事件，故动画时序需用真实时间或 DOM 观测验证。

## Implementation Plan

1. `codex.css`：给 `.codex-image` 增加 `grid-template-rows:100%`；给 `.detail-visual` 增加 `grid-template-rows:100%`。使百分比 `height`/`max-height` 有确定基准，PNG/SVG 均正确 contained。（最小展示层改动）
2. `app.js`：将 `renderLoadout` 拆出单槽渲染函数，锁定阶段改为增量更新（只更新新锁定槽位与仍在滚动的未锁定槽位，已锁定槽位保持不动），消除整组重建与图片重解码；收尾保持最小 class 变更。
3. 更新 `scripts/verify-codex-images-and-roll.mjs` 增加 PNG 溢出断言（DOM 实测 overflow 而非仅 CSS 规则存在），并增加收尾后无整组重建/无新动画的观测断言。
4. 运行语法检查、`validate-data.mjs`、`run-smoke.mjs`、图鉴响应式、针对性验证；用真实时间观测脚本确认最后锁定后无新动画/无整组重建。
5. 独立 commit。

## Progress

- [x] 2026-08-13：确认 HEAD=ad2fbaa、工作区干净。
- [x] 2026-08-13：实测定位图片裁切根因（grid auto 行 + 百分比 height 对 PNG 失效）。
- [x] 2026-08-13：实测定位收尾重绘根因（锁定阶段全量 innerHTML 重建）。
- [ ] 实施 `codex.css` 修复。
- [ ] 实施 `app.js` 增量更新。
- [ ] 更新验证脚本并跑通全套验证。
- [ ] 提交。

## Validation

- `node --check app.js codex-v2.js`。
- `node scripts/validate-data.mjs`。
- `node scripts/run-smoke.mjs`。
- `node scripts/verify-codex-images-and-roll.mjs`（更新后）。
- `node scripts/verify-codex-responsive.mjs`。
- 针对性 DOM 观测：throwable/stratagem img 溢出为 false；roll 锁定阶段不再整组重建；收尾后无新动画。

## Outcome

（待填）
