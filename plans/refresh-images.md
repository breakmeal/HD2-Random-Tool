# 装备与敌人图片刷新 ExecPlan

状态：Completed（浏览器实测受本机 localhost 安全策略阻断）
创建日期：2026-08-08
最后更新：2026-08-08 14:20

## Purpose / Goal

从项目已注明的 Helldivers Wiki 重新下载与当前 199 件装备和 51 个敌人条目对应的合适图片，按装备类型和敌人阵营整理为本地资源。新资源确认后由页面优先使用，同时完整保留现有图片，不执行删除、清空或批量替换目录的操作。

## Requirements

- [x] 重新查询装备页面实际引用的渲染图和图标。
- [x] 重新查询 51 个敌人页面实际引用的敌人图标。
- [x] 新图片保存到独立批次目录，按装备类型和敌人阵营分类。
- [x] 保留 `assets/equipment/` 下现有 199 张图片；全流程未执行删除或覆盖。
- [x] 每个下载结果记录来源、文件、路径、MIME、字节数与 SHA-256。
- [x] 只有通过 HTTP、图片类型和非空文件校验的资源进入映射。
- [x] 页面优先使用新的本地图片；37 件缺少可靠新图的装备继续使用原有路径。
- [x] 未发布装备、ID、发布状态和数值数据未改变。
- [x] README、SOURCES、AGENTS.md 已说明新目录、脚本、加载顺序与保留原则。
- [x] JavaScript 语法检查和数据校验通过。

## Current State

- `equipment-details.js` 当前映射 199 张 `assets/equipment/<type>/` 本地图片；`node scripts/validate-data.mjs` 当前报告 199 张图片、0 个错误。
- `scripts/collect-wiki-data.mjs` 会同时采集数值、说明和装备图片，并直接写入 `assets/equipment/` 与 `equipment-details.js`；本任务不应为了图片刷新顺带改写数值数据。
- `enemy-data.js` 当前为 51 个敌人拼接 Wiki `Special:FilePath/<英文名>_Enemy_Icon.png` 远程 URL，部分实际文件名不匹配或在离线环境无法加载。
- `enemy-dossier.js` 已在远程敌人图标失败时切换到 `assets/ui/enemy-terminal-bg.png`，但这只是通用视觉兜底，不是敌人专属图片。
- 已新增独立的图片刷新脚本、每批图片来源清单和本地敌人图片目录；旧目录保持不变。
- 当前脚本顺序为 `data.js` → `equipment-details.js` → `enemy-data.js` → `refreshed-images.js` → `app.js` → `codex-v2.js` → `enemy-dossier.js`。

## Implementation Plan

1. 新增只负责图片的 Node.js ESM 脚本，读取现有装备与敌人数据，通过 MediaWiki API 查询页面实际引用图片；下载时使用独立日期目录和排他写入，不删除或覆盖现有图片。

已完成：`scripts/refresh-images.mjs` 生成 `assets/refreshed-images/2026-08-08-matched/manifest.json` 和 `refreshed-images.js`。该批次包含 162/199 件装备和 51/51 个敌人；37 件未找到可靠战略配备图标，未使用相似条目或通用徽标替代。
2. 为下载结果生成 JSON 清单和浏览器可加载的 JS 映射；映射只覆盖内存中的 `EQUIPMENT_DETAILS[].image` 与 `ENEMY_DATA[].image`，不改写装备详情数值和敌人资料。
3. 在 `index.html` 中于数据文件之后、渲染脚本之前加载图片映射，保持所有全局依赖明确。
4. 运行联网刷新，检查下载摘要、缺图、文件签名、大小、哈希和本地文件存在性；对缺失项保留现有映射，不删除任何资源。
5. 更新 README、SOURCES、AGENTS.md，记录目录、脚本、来源、刷新命令和资源保留原则。
6. 运行语法检查、`validate-data.mjs` 和新增清单校验；浏览器验证若仍被安全策略阻止则明确记录待确认。

## Progress

- [x] 2026-08-08 13:25：确认现有装备图片完整、敌人图片为远程猜测路径，且现有采集脚本范围过大。
- [ ] 实现无删除图片刷新脚本和资源清单。
- [ ] 下载并核验装备与敌人图片。
- [ ] 接入本地图片映射。
- [ ] 更新文档和验证结果。

## Decisions

- 2026-08-08 — 决定：不直接运行 `collect-wiki-data.mjs`。
  - 原因：该脚本会重写装备详情数值和说明，超出用户本次仅刷新图片的范围。
  - 影响：新增图片专用脚本，复用其 MediaWiki 图片发现原则但隔离数值数据。
- 2026-08-08 — 决定：新图片写入 `assets/refreshed-images/2026-08-08/`，不覆盖 `assets/equipment/`。
  - 原因：用户明确要求确认后不进行任何删除行为；独立目录能保留全部旧资源并便于审查。
  - 影响：需要生成运行时图片映射文件，让页面优先使用刷新目录。

## Discoveries

- 现有 199 张装备图片均通过数据校验，刷新目的不是修复缺图，而是重新核对来源和获得可审查清单。
- 现有敌人 URL 通过英文名拼接文件名，不能证明每个 URL 对应页面实际引用的文件。

## Risks / Open Questions

- Wiki 页面可能使用重定向、图像列表续页或非统一文件命名。缓解：查询页面实际 `images`，对缺失项记录清单并保留旧映射。非阻塞。
- 网络或审批服务可能拒绝下载。缓解：保留现有资源且不删除；若无法联网则记录为阻塞，不生成虚假成功清单。
- 远程文件可能格式混合。缓解：根据响应 MIME 和文件签名确定扩展名，并校验非空内容。非阻塞。

## Validation

- `node --check scripts/refresh-images.mjs`
- `node --check refreshed-images.js`
- `node scripts/validate-data.mjs`
- 新增脚本摘要：装备总数/成功/缺失、敌人总数/成功/缺失、下载字节数、无效文件数。
- 清单逐项检查：本地文件存在、字节数一致、SHA-256 一致、路径位于日期目录。
- 确认原 `assets/equipment/` 文件数量没有减少，且没有执行删除命令。
- 浏览器抽查无法完成：本机 in-app Browser 访问 `http://127.0.0.1:4173/` 被 `ERR_BLOCKED_BY_CLIENT` 拦截；已通过本地文件签名、manifest 校验和图片可视化抽查替代验证。

## Outcome

完成。旧资源目录仍有 199 张图片，刷新批次资源均独立保存且没有删除/覆盖行为。
