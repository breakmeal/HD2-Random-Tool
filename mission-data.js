/*
 * Mission dossier data. Values are kept as strings/numbers because several missions
 * only appear within a narrow difficulty band, and objective scaling is documented
 * per mission on Helldivers Wiki. Difficulty facts follow the wiki's Difficulty page.
 * Chinese names are semantic translations; the English name is retained for verification.
 * Images are local files downloaded by scripts/collect-mission-data.mjs into assets/missions/.
 */
const MISSION_FACTIONS = [
  { id: 'terminids', zh: '虫族', en: 'TERMINIDS', color: '#c9a74b',
    note: '虫族专属任务：肃清孵化巢、炸毁虫洞、击杀突变精英，并在迷雾星球回收研究数据。' },
  { id: 'automatons', zh: '机器人', en: 'AUTOMATONS', color: '#d45d48',
    note: '机器人专属任务：摧毁工厂与指挥地堡、破坏补给与空军基地、缴获战略资产。' },
  { id: 'illuminate', zh: '光能者', en: 'ILLUMINATE', color: '#63c8d5',
    note: '光能者专属任务：击退入侵舰队、摧毁曲速舰与外层塔、撤离殖民地。' },
  { id: 'any', zh: '通用', en: 'ALL FRONTS', color: '#7f897d',
    note: '任意阵营的星球上都可能出现的主任务。' }
];

// 1–10 级难度梯度（Helldivers Wiki「Difficulty」页的 Mission Difficulty Changes 表）。
const MISSION_DIFFICULTIES = [
  { level: 1, en: 'Trivial', zh: '微不足道', main: '1', outposts: '无据点', reward: '+0%', note: '地图半径约 250 米；无可选目标。' },
  { level: 2, en: 'Easy', zh: '简单', main: '1–3', outposts: '4 个轻型', reward: '+0%', note: '引入敌方据点与出生区，出现 1 个可选目标。' },
  { level: 3, en: 'Medium', zh: '中等', main: '1–3', outposts: '5–9 个（含中型）', reward: '+25%', note: '出现中型据点；奖励乘数开始生效。' },
  { level: 4, en: 'Challenging', zh: '挑战', main: '1–3', outposts: '含 1 个重型', reward: '+50%', note: '引入重型据点与稀有样本。' },
  { level: 5, en: 'Hard', zh: '困难', main: '1–3', outposts: '含 1–2 个重型', reward: '+75%', note: '开始出现第 1 项行动修正。' },
  { level: 6, en: 'Extreme', zh: '极端', main: '2–3', outposts: '含 1–2 个重型', reward: '+100%', note: '出现超级样本。' },
  { level: 7, en: 'Suicide Mission', zh: '自杀任务', main: '3', outposts: '含 1–2 个重型', reward: '+150%', note: '主目标固定 3 个；多数小型兴趣点转为敌方主题。' },
  { level: 8, en: 'Impossible', zh: '不可能', main: '3–4', outposts: '含 2–3 个重型', reward: '+200%', note: '出现第 2 项行动修正。' },
  { level: 9, en: 'Helldive', zh: '地狱俯冲', main: '3–4', outposts: '含 1–4 个重型', reward: '+250%', note: '敌军构成进一步强化。' },
  { level: 10, en: 'Super Helldive', zh: '超级地狱俯冲', main: '3–4', outposts: '含 0–1 个巨型', reward: '+300%', note: '引入巨型据点，奖励乘数最高。' }
];

// [id, faction, zh, en, minDifficulty, maxDifficulty, timeMinutes, briefing, difficultyNote]
const RAW_MISSIONS = [
  // —— 通用（Any）——
  ['conduct-geological-survey','any','地质勘测','Conduct Geological Survey',1,10,40,'部署地震探针与勘探钻机，采集矿脉土壤样本并上传数据。','钻探与扫描会触发敌军增援，其数量与种类随难度增加；高难度下子目标更多。'],
  ['emergency-evacuation','any','紧急撤离','Emergency Evacuation',3,10,40,'建立通信上行链路，护送滞留的 A 级公民登上撤离穿梭机。','需撤离的公民数量与敌军进攻波次随难度增强，防守压力持续加大。'],
  ['evacuate-high-value-assets','any','撤离高价值资产','Evacuate High-Value Assets',5,10,20,'防守高价值资产与发电机，抵挡敌军多波进攻并坚持到撤离。','防守波次随难度增强，敌军数量与种类随难度提升；仅出现在 5–10 级。'],
  ['launch-icbm','any','发射洲际导弹','Launch ICBM',3,10,40,'启动发射井并完成终端流程，发射 ICBM 摧毁敌方战略目标。','终端流程与防守阶段敌军压力随难度增强。'],
  ['retrieve-essential-personnel','any','营救重要人员','Retrieve Essential Personnel',1,9,15,'解锁应急地堡门，护送研究员转移至撤离穿梭机。','已停用的历史任务；其历史版本在高难度下所需撤离的平民更少。'],
  ['retrieve-valuable-data','any','回收宝贵数据','Retrieve Valuable Data',3,10,40,'回收 SSSD 硬盘并搬运至上传点，传输宝贵的研究数据。','搬运与上传阶段敌军压力随难度增强。'],
  ['spread-democracy','any','传播民主','Spread Democracy',1,10,40,'在指定地点升起超级地球旗帜，并坚守直至升旗完成。','升旗防守的时长与敌军波次随难度增强。'],
  ['start-fuel-pumps','any','启动燃料泵','Start Fuel Pumps',1,2,40,'启动燃料泵以恢复 E-710 生产。','仅出现在 1–2 级低难度任务中。'],
  ['terminate-illegal-broadcast','any','摧毁非法广播','Terminate Illegal Broadcast',1,2,40,'摧毁敌方非法广播发射塔。','仅出现在 1–2 级低难度任务中。'],
  ['upload-escape-pod-data','any','上传逃生舱数据','Upload Escape Pod Data',1,2,40,'回收逃生舱内的数据并上传。','仅出现在 1–2 级低难度任务中。'],

  // —— 虫族（Terminids）——
  ['activate-oil-pumps','terminids','启动油泵','Activate Oil Pumps',2,3,40,'重新激活大型原油库的油泵：登录终端、解开管道谜题并转动阀门。','低难度专属，仅出现于 2–3 级。'],
  ['activate-tcs-station','terminids','启动 TCS+ 站','Activate TCS+ Station',1,10,20,'启动 TCS+ 站，分阶段激活并防守电池筒仓，释放灭虫毒雾。','无论难度如何，激活阶段都会持续刷新虫族进攻，防守压力随难度增强。'],
  ['activate-terminid-control-system','terminids','启动虫族控制体系','Activate Terminid Control System',2,9,40,'启动灭虫剂散布塔，净化所在区域的虫族。','防守激活流程时敌军压力随难度增强。'],
  ['blitz-search-and-destroy-terminid','terminids','闪电战：搜索与摧毁（虫族）','Blitz: Search and Destroy',2,10,12,'在 12 分钟内摧毁尽可能多的虫洞（虫巢/尖啸虫巢/潜行虫巢）。','固定 12 分钟时限；需摧毁的虫洞数量随难度随机增加。'],
  ['blitz-secure-research-site','terminids','闪电战：保卫研究点','Blitz: Secure Research Site',1,10,12,'在 12 分钟内清理研究点周边的虫巢，保障科学小队安全。','固定 12 分钟时限；需清理的虫巢数量随难度增加。'],
  ['chart-terminid-tunnels','terminids','测绘虫族隧道','Chart Terminid Tunnels',3,10,40,'部署地震探针扫描迷雾星球的地下隧道，并经中继站上传数据。','扫描触发的敌军增援数量与种类随难度增加。'],
  ['cleanse-infested-district','terminids','净化受感染城区','Cleanse Infested District',4,10,40,'摧毁被虫族寄生的摩天大楼（尖啸虫繁殖场）。','仅出现在 4–10 级；需摧毁的感染大楼与敌军压力随难度增强。'],
  ['collect-gloom-spore-readings','terminids','采集迷雾孢子读数','Collect Gloom Spore Readings',1,10,40,'激活 LiDAR 塔测量迷雾孢子密度与成分，并经中继站上传。','激活与上传阶段敌军压力随难度增强。'],
  ['collect-gloom-infused-oil','terminids','采集迷雾浸润原油','Collect Gloom-Infused Oil',1,10,40,'重启油泵并提取受迷雾浸润的原油样本。','提取阶段敌军压力随难度增强。'],
  ['collect-meteorological-data','terminids','采集气象数据','Collect Meteorological Data',1,10,40,'回收失事侦察机的黑匣子，解密并上传迷雾气象数据。','回收与上传阶段敌军压力随难度增强。'],
  ['conduct-mobile-e-711-extraction','terminids','进行移动 E-711 提取','Conduct Mobile E-711 Extraction',1,10,40,'驾驶 GATER 移动提取平台，逐点开采 E-711 物质。','开采阶段敌军压力随难度增强。'],
  ['deactivate-terminid-control-system','terminids','关闭虫族控制体系','Deactivate Terminid Control System',1,9,12,'在 12 分钟内摧毁突变虫卵并关闭腐化的灭虫剂塔。','固定 12 分钟时限；需摧毁的虫卵数量随难度变化。'],
  ['deploy-dark-fluid','terminids','部署暗流体','Deploy Dark Fluid',1,9,40,'把暗流体容器运至钻探点，插入构造钻机并防守钻探完成。','事件型任务；防守钻机与尖啸虫潮的压力随难度增强。'],
  ['destroy-spore-lung','terminids','摧毁孢子肺','Destroy Spore Lung',3,10,40,'深入虫巢，用便携式地狱火炸弹摧毁产生迷雾的孢子肺。','洞穴内需击杀的虫族数量随难度变化。'],
  ['eliminate-bile-titans','terminids','消灭胆汁泰坦','Eliminate Bile Titans',4,5,40,'定位并击杀胆汁泰坦精英目标。','仅出现在 4–5 级；目标为固定精英单位。'],
  ['eliminate-brood-commanders','terminids','消灭育母指挥官','Eliminate Brood Commanders',1,2,40,'定位并击杀出现危险突变的育母指挥官。','仅出现在 1–2 级低难度任务中。'],
  ['eliminate-chargers','terminids','消灭冲锋虫','Eliminate Chargers',3,3,40,'定位并击杀突变的重甲冲锋虫。','仅出现在 3 级。'],
  ['eliminate-impaler','terminids','消灭穿刺虫','Eliminate Impaler',5,5,40,'定位并击杀从地下穿刺攻击的穿刺虫。','仅出现在 5 级。'],
  ['enable-oil-extraction','terminids','启用原油提取','Enable Oil Extraction',4,10,40,'启用 E-710 提取设施并防守提取流程。','仅出现在 4–10 级；防守提取时敌军压力随难度增强。'],
  ['eradicate-terminid-swarm','terminids','肃清虫群','Eradicate Terminid Swarm',2,10,15,'在 15 分钟内击杀指定数量的虫族。','固定 15 分钟时限；需击杀数量随难度增加，出现的虫族种类也随难度提升；完成后敌军停止增援。'],
  ['extract-e-711','terminids','提取 E-711','Extract E-711',1,10,40,'开采并提取 E-711 燃料。','提取阶段敌军压力随难度增强。'],
  ['extract-research-probe-data','terminids','提取研究探针数据','Extract Research Probe Data',1,10,40,'回收研究探针并上传其数据。','回收与上传阶段敌军压力随难度增强。'],
  ['nuke-nursery','terminids','核平虫巢孵化场','Nuke Nursery',4,10,40,'护送核弹头至虫族孵化场并引爆。','仅出现在 4–10 级；护送达阶段敌军压力随难度增强。'],
  ['purge-hatcheries','terminids','肃清孵化巢','Purge Hatcheries',2,10,40,'摧毁虫族孵化巢内的虫卵。','需摧毁的虫卵数量与敌军压力随难度增强。'],
  ['restart-pumps','terminids','重启油泵','Restart Pumps',1,10,40,'重启故障的 E-710 油泵。','启动流程敌军压力随难度增强。'],
  ['restore-air-quality','terminids','恢复空气质量','Restore Air Quality',1,10,40,'清理污染源以恢复区域空气质量。','目标数量与敌军压力随难度增强。'],

  // —— 机器人（Automatons）——
  ['annex-untapped-mineral-sites','automatons','吞并未开发矿点','Annex Untapped Mineral Sites',1,10,40,'夺取坐标、钻探并采集矿脉样本，阻止机器人掠夺资源。','钻探触发的敌军增援数量与种类随难度增加；高难度子目标更少。'],
  ['blitz-search-and-destroy-automaton','automatons','闪电战：搜索与摧毁（机器人）','Blitz: Search and Destroy',3,10,12,'在 12 分钟内摧毁尽可能多的机器人制造厂。','固定 12 分钟时限；需摧毁的制造厂数量随难度随机增加。'],
  ['blitz-destroy-bio-processors','automatons','闪电战：摧毁生物处理器','Blitz: Destroy Bio-Processors',5,10,12,'在 12 分钟内摧毁合成有机等离子体的生物处理器。','固定 12 分钟时限，仅出现在 5–10 级；需摧毁数量随难度增加。'],
  ['commando-acquire-evidence','automatons','突击队：获取证据','Commando: Acquire Evidence',1,10,40,'携带战术摄像机潜入基地拍摄罪证，并携带摄像机撤离。','潜入与撤离阶段敌军压力随难度增强。'],
  ['commando-extract-intel','automatons','突击队：提取情报','Commando: Extract Intel',1,10,40,'搜索基地、夺取情报包并携带撤离。','搜索与撤离阶段敌军压力随难度增强。'],
  ['commando-secure-black-box','automatons','突击队：夺取黑匣子','Commando: Secure Black Box',1,10,40,'回收被击落侦察机的黑匣子并携带撤离。','回收与撤离阶段敌军压力随难度增强。'],
  ['confiscate-assets','automatons','没收资产','Confiscate Assets',1,10,40,'缴获聚变电池与高纯度铂金条并装入货柜运走。','需搬运的电池/铂金数量等于当前难度 + 1。'],
  ['destroy-command-bunkers','automatons','摧毁指挥地堡','Destroy Command Bunkers',5,10,40,'用地狱火炸弹摧毁重兵把守的指挥地堡。','仅出现在 5–10 级；需摧毁的地堡数量随难度变化，高难度目标更多。'],
  ['destroy-transmission-network','automatons','摧毁传输网络','Destroy Transmission Network',2,3,40,'摧毁本地机器人的天线传输网络。','仅出现在 2–3 级低难度任务中。'],
  ['eliminate-automaton-factory-strider','automatons','消灭工厂步行机','Eliminate Automaton Factory Strider',4,6,40,'定位并击杀工厂步行机精英目标。','仅出现在 4–6 级。'],
  ['eliminate-automaton-hulks','automatons','消灭浩克','Eliminate Automaton Hulks',3,3,40,'定位并击杀机器人浩克（歼灭者变体）。','仅出现在 3 级。'],
  ['eliminate-devastators','automatons','消灭毁灭者','Eliminate Devastators',1,2,40,'定位并击杀毁灭者精英目标。','仅出现在 1–2 级低难度任务中。'],
  ['eradicate-automaton-forces','automatons','肃清机器人部队','Eradicate Automaton Forces',2,10,15,'在 15 分钟内击杀指定数量的机器人。','固定 15 分钟时限；需击杀数量随难度增加，敌军种类随难度提升。'],
  ['halt-cyborg-production','automatons','停止义体生产','Halt Cyborg Production',4,10,40,'破坏义体生产设施。','仅出现在 4–10 级；需摧毁设施数量随难度变化。'],
  ['neutralize-ground-to-orbit-defenses','automatons','解除地对轨道防御','Neutralize Ground-to-Orbit Defenses',4,10,40,'摧毁地对轨道防御炮台。','仅出现在 4–10 级；需摧毁目标数量随难度增加。'],
  ['rapid-acquisition','automatons','快速缴获','Rapid Acquisition',3,10,15,'在 15 分钟内缴获并运出目标物资。','固定 15 分钟时限；需缴获数量与敌军压力随难度增强。'],
  ['sabotage-air-base','automatons','破坏空军基地','Sabotage Air Base',3,10,40,'摧毁空军基地的停泊战机与设施。','仅出现在 3–10 级；需摧毁目标数量随难度增加。'],
  ['sabotage-orgo-plasma-synthesis','automatons','破坏有机等离子合成','Sabotage Orgo-Plasma Synthesis',1,10,40,'摧毁有机等离子体合成设施。','需摧毁设施数量随难度变化。'],
  ['sabotage-supply-bases','automatons','破坏补给基地','Sabotage Supply Bases',1,10,40,'摧毁补给基地的弹药库与燃料储备。','需摧毁目标数量随难度增加。'],
  ['seize-industrial-complex','automatons','夺取工业综合体','Seize Industrial Complex',1,10,40,'攻占机器人工业综合体并夺取控制权。','目标数量与敌军压力随难度增强。'],

  // —— 光能者（Illuminate）——
  ['blitz-destroy-illuminate-warp-ships','illuminate','闪电战：摧毁曲速舰','Blitz: Destroy Illuminate Warp Ships',1,10,12,'在 12 分钟内摧毁停泊的曲速舰。','固定 12 分钟时限；需摧毁的曲速舰数量随难度随机增加。'],
  ['destroy-exospire','illuminate','摧毁外层塔','Destroy Exospire',3,10,40,'突破护盾与暗流体电池，摧毁外层塔核心并引发坍塌。','仅出现在 3–10 级；防守数据注入与核心战阶段敌军压力随难度增强。'],
  ['destroy-harvesters','illuminate','摧毁收割者','Destroy Harvesters',3,3,40,'定位并击杀三足收割者精英目标。','仅出现在 3 级。'],
  ['evacuate-colonists','illuminate','撤离殖民者','Evacuate Colonists',1,10,40,'护送被光能者威胁的殖民者撤离。','需撤离人数与敌军压力随难度增强。'],
  ['free-colony','illuminate','解放殖民地','Free Colony',1,10,40,'夺回被光能者占领的殖民地并升起旗帜。','防守阶段敌军波次随难度增强。'],
  ['repel-invasion-fleet','illuminate','击退入侵舰队','Repel Invasion Fleet',3,10,20,'在 20 分钟内击退光能者入侵舰队。','固定 20 分钟时限；防守波次随难度增强，仅出现在 3–10 级。'],
  ['retrieve-recon-craft-intel','illuminate','回收侦察机情报','Retrieve Recon Craft Intel',1,10,40,'回收被击落侦察机的黑匣子并上传情报。','回收与上传阶段敌军压力随难度增强。'],
  ['take-down-overship','illuminate','击落母舰','Take Down Overship',1,10,40,'摧毁光能者母舰。','需摧毁目标与敌军压力随难度增强。']
];

const MISSIONS = RAW_MISSIONS.map(([id,faction,zh,en,minDifficulty,maxDifficulty,timeMinutes,briefing,difficultyNote])=>({
  id, faction, zh, en,
  minDifficulty, maxDifficulty, timeMinutes,
  briefing, difficultyNote,
  image: `assets/missions/${id}.svg`
}));
