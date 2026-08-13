# 数据来源与生成说明

更新时间：2026-08-08

## Helldivers Wiki

- 战争债券目录：https://helldivers.wiki.gg/wiki/Warbond
- 武器目录：https://helldivers.wiki.gg/wiki/Weapons
- 战略配备目录：https://helldivers.wiki.gg/wiki/Stratagem
- 强化剂目录：https://helldivers.wiki.gg/wiki/Boosters
- 伤害机制：https://helldivers.wiki.gg/wiki/Damage
- 武器基础数据：https://helldivers.wiki.gg/wiki/Module:Decodedata-Weapons/data.json
- 新版武器攻击数据：https://helldivers.wiki.gg/wiki/Module:Decodedata-Attacks/weapons_data.json
- 战略配备攻击数据：https://helldivers.wiki.gg/wiki/Module:Decodedata-Attacks/stratagems_data.json
- 状态伤害数据：https://helldivers.wiki.gg/wiki/Module:Decodedata-Attacks/status_data.json
- 图标目录：https://helldivers.wiki.gg/wiki/Category:Helldivers_2_-_Icons

图片通过 MediaWiki API 查询各装备页面实际引用的 `Primary Render`、`Secondary Render`、`Throwable Render`、`Stratagem Icon` 或 `Booster Icon` 文件后下载。生成脚本不会抓取即将推出且内容未公开的战争债券装备。

图片刷新使用 `scripts/refresh-images.mjs`，每次运行写入独立的 `assets/refreshed-images/<run-id>/` 目录，并生成带来源和 SHA-256 的 `manifest.json` 以及根目录映射文件 `refreshed-images.js`。本次批次 `2026-08-08-matched` 下载了 162/199 件装备和 51/51 个敌人；没有可靠文件匹配的 37 件装备保留原有本地映射。脚本不会删除、清空或覆盖任何已有图片，写入采用排他创建；同一批次重复运行时仅复用内容完全相同的文件。

装备说明的中文覆盖文件 `equipment-descriptions-zh.js` 以 `equipment-details.js` 中的英文军械库文本为翻译源，使用公开翻译页面生成初稿，再统一“绝地潜兵、地狱舱、战略配备、驱逐舰”等项目术语并抽查。英文原文不删除，仍用于来源核对；中文覆盖须通过 199 个装备 ID、中文字符和无孤立键校验。

## 字段解释

- `standard`：标准/直击伤害。
- `durable`：对 100% 耐久部位的伤害。
- `penetration`：正面命中的穿甲等级。
- `radius.inner`：爆炸全伤害内圈。
- `radius.outer`：爆炸衰减区外圈。
- `radius.max`：爆炸最大影响范围。
- `status`：燃烧、毒气等持续状态的独立伤害档案。

伤害数据可能随游戏补丁变化。无法从结构化数据可靠关联的条目在界面中显示为“暂无可靠数据”。

## 战略配备社区参考评分

`stratagem-ratings.js` 是手写的用途化评分层，不覆盖或修改 `equipment-details.js` 生成数据。每项战略配备先依据上方 Wiki 结构化攻击数据计算基础杀伤、范围、穿甲和控制分，再按公开社区攻略和 Tier List 讨论中常见的阵营适配结论对虫族、机器人、光能者分别修正：虫族偏重范围、燃烧和持续压制；机器人偏重穿甲、耐久部位和高单体伤害；光能者偏重电弧、光束和中远程控制。最终值限制在 1–100，仅作为本项目的相对参考，不是官方评级，也不改变随机概率。

公开讨论入口（仅用于趋势核对，不作为单一真值）：[Helldivers Wiki Stratagem](https://helldivers.wiki.gg/wiki/Stratagem)、[Helldivers 2 Reddit](https://www.reddit.com/r/Helldivers/)、[Helldivers 2 Wiki.gg Forums](https://helldivers.wiki.gg/wiki/Forum:Recent_changes)。

## 敌人档案

- 阵营目录：[Terminids](https://helldivers.wiki.gg/wiki/Terminids)、[Automatons](https://helldivers.wiki.gg/wiki/Automatons)、[Illuminate](https://helldivers.wiki.gg/wiki/Illuminate)
- 敌人字段来源：各敌人 Wiki 页面公开的 `Infobox Enemy`、`Anatomy Table` 和页面说明；示例：[Bile Titan](https://helldivers.wiki.gg/wiki/Bile_Titan)、[Hulk Bruiser](https://helldivers.wiki.gg/wiki/Hulk_Bruiser)、[Voteless](https://helldivers.wiki.gg/wiki/Voteless)
- 生命值来源：MediaWiki `Enemies` Cargo 表的 `health` 字段；多部位敌人按「主体/炮塔/车体」等拆分标注，随难度变化的生命值标注对应难度段。个别无统一生命值的敌人（或仅有多部位解剖表）以「待核实」或「主体」标注。
- 护甲等级来源：各敌人页 `{{Anatomy Table}}` 中 `part_name = Main` 部位的 `av`（Armor Value）字段；用于阵营内按护甲从低到高排序与详情展示。
- 亚阵营来源：`Enemies` Cargo 表的 `faction` 字段同时含主阵营与亚阵营（焚化军团、喷射旅、义体军团、投票抢夺者、强占者、掠食者菌株、破裂菌株、孢子爆发菌株等）；亚阵营敌人按阵营归入 `enemy-data.js` 的 `subfactions` 分组，界面在阵营页签内再按亚阵营分组显示。
- 敌人图像：各页面实际引用的 `Enemy Icon` 文件，通过 MediaWiki `images` 查询获取真实文件 URL，下载到 `assets/refreshed-images/<run-id>/enemies/<faction>/` 后由 `refreshed-images.js` 加载。页面不再使用 `enemy-terminal-bg.png` 作为敌人卡片或失败图片背景。
- 新增敌人（尚未纳入刷新批次的 6 个主阵营单位：新月监督者、血肉团、刺鳐、利维坦、曲速舰、突击掠夺者）的图标单独下载到 `assets/enemies/<faction>/`，由 `enemy-data.js` 内的 `ENEMY_LOCAL_IMAGES` 映射加载；下次运行 `refresh-images.mjs` 时可并入批次。

`enemy-data.js` 是本地 UI 数据快照，不参与随机装备池。部分敌人有多种形态或难度生命池；当公开资料无法给出统一数值时，页面显示“待核实”，不使用估算值代替。

敌人入口和分屏面板使用的 `assets/ui/enemy-terminal-bg.svg` 是项目本地绘制的抽象界面背景，`enemy-terminal-bg.png` 是供浏览器加载的栅格化版本。该背景仅表达三阵营的概念轮廓，不作为敌人外观、数值或来源依据。

## 任务档案

- 任务目录：[Missions](https://helldivers.wiki.gg/wiki/Missions)；任务列表来自 MediaWiki `Missions` Cargo 表（字段 `_pageName`、`faction`、`image`、`min_difficulty`、`max_difficulty`）。
- 每个任务的时限、简报与目标步骤来自各任务页的 `{{Infobox Mission}}` 与正文；难度梯度来自 [Difficulty](https://helldivers.wiki.gg/wiki/Difficulty) 页的「Mission Difficulty Changes」表（1–10 级）。
- 任务图标：各任务页 `image_main` 引用的 `Mission Icon` 文件，由 `scripts/collect-mission-data.mjs` 下载到 `assets/missions/<id>.svg`。
- 主任务筛选口径：`faction ∈ {Any, Terminid, Automaton, Illuminate}`，共 64 个；`faction` 为空的可选/战术目标（`Optional_Objectives` 表，32 个）暂不纳入。

`mission-data.js` 是本地 UI 数据快照，不参与随机装备池。中文任务名为语义翻译，英文原名保留用于核对；难度范围、时限与目标来自 Wiki 公开资料，个别事件型或已停用任务如实标注，不推测数值。
