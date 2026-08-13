/* Enemy dossier data. Values are kept as strings because some enemies have
 * difficulty-dependent variants or several anatomical health pools.
 * Health values come from the Helldivers Wiki "Enemies" Cargo table (health field).
 * Each faction may contain subfactions (亚阵营) rendered as groups in the dossier. */
const ENEMY_FACTIONS = [
  {
    id: 'terminids',
    zh: '虫族',
    en: 'TERMINIDS',
    color: '#c9a74b',
    note: '高速近战、酸液与虫巢增援。优先处理会召唤增援或喷吐酸液的单位。',
    source: 'https://helldivers.wiki.gg/wiki/Terminids',
    enemies: [
      ['scavenger','食腐虫','Scavenger','60','头部；低护甲部位可用轻武器处理','近距离扑咬；发现目标后可能发出虫鸣召唤增援'],
      ['bile-spitter','喷吐虫','Bile Spitter','60','头部与腹部；避开酸液正面','远距离喷吐酸液，保持移动并优先击破头部'],
      ['pouncer','跳跃虫','Pouncer','60','头部；跳跃落地后短暂暴露','会扑向目标并造成硬直，注意其跃起前的动作'],
      ['hunter','猎杀虫','Hunter','130（中等及以下）/ 160（挑战及以上）','头部；四肢不是高效击杀点','高速侧跳、扑击并减速目标，适合用近距离爆发武器处理'],
      ['shrieker','尖啸虫','Shrieker','80（主体）','翅膀与头部；空中目标优先打翅膀','空袭俯冲并可从远处骚扰，保持抬枪观察天空'],
      ['warrior','战士','Warrior','250（中等及以下）/ 325（挑战及以上）','头部；被斩首后仍可能短暂攻击','基础近战单位，群体出现时优先控制数量'],
      ['bile-warrior','胆汁战士','Bile Warrior','325','头部与腹部；酸液囊是明显弱点','战士的酸液变体，近战和酸液攻击并存'],
      ['alpha-warrior','阿尔法战士','Alpha Warrior','325','头部；破坏头部可快速终止威胁','更强的近战战士，会带领虫群压迫阵地'],
      ['hive-guard','巢穴卫士','Hive Guard','500','未被甲壳覆盖的头部与腿部','正面甲壳能挡住轻武器，绕侧面或使用穿甲攻击'],
      ['brood-commander','育母指挥官','Brood Commander','800','头部；断肢不等于立即安全','高威胁近战指挥单位，受击后仍可能继续冲锋'],
      ['alpha-commander','阿尔法指挥官','Alpha Commander','1,000','头部与未甲壳覆盖部位','强化型指挥官，能在战场上制造持续近战压力'],
      ['stalker','潜行虫','Stalker','800','头部；受伤或被照明后更易追踪','隐身接近并击飞目标。看到空气扰动或舌击时立即转火'],
      ['charger','冲锋虫','Charger','2,400','尾部软组织；头部需要高穿甲火力','直线冲锋威胁极高，诱导其撞击后攻击暴露的尾部'],
      ['spore-charger','孢子冲锋虫','Spore Charger','2,400','尾部软组织与头部','冲锋虫变体，会用孢子遮蔽战场，先脱离烟雾再反击'],
      ['charger-behemoth','重甲冲锋虫','Charger Behemoth','3,000','腿部甲壳或尾部软组织；需重型穿甲','重型冲锋变体，正面更难处理，避免在狭窄地形被顶住'],
      ['impaler','穿刺虫','Impaler','4,000','脸部与触手收回后的头部；重甲部位需穿甲','触手可从地下远程穿刺，先找出本体并在其收回触手时攻击'],
      ['nursing-spewer','育母喷吐虫','Nursing Spewer','750','头部与腹部','大范围酸液喷吐单位，保持侧向移动并避免正面长时间对射'],
      ['bile-spewer','胆汁喷吐虫','Bile Spewer','750','头部与腹部；酸液囊为关键目标','重型喷吐虫，酸液覆盖范围大，远距离优先击杀'],
      ['bile-titan','胆汁泰坦','Bile Titan','6,500（主体）','口部与腹部；头部为高价值目标，重甲需高穿甲','超大型单位，会喷吐酸液并踩踏。不要站在其正前方或脚下'],
      ['dragonroach','龙蟑','Dragonroach','6,500','翅膀、头部与腹部','飞行喷火单位，火焰持续覆盖地面，优先击落并避开燃烧区域'],
      ['hive-lord','巢穴领主','Hive Lord','150,000','主体弱点以 Wiki 当前解剖表为准；部分部位需穿甲','巨型虫族单位。其可用形态与部位数据会随版本变化'],
    ],
    subfactions: [
      { id: 'predator-strain', zh: '掠食者菌株', enemies: [
        ['predator-hunter','掠食猎杀虫','Predator Hunter','175','头部与未甲壳覆盖部位','猎杀虫的掠食者变体，保持距离并注意侧向扑击'],
        ['predator-stalker','掠食潜行虫','Predator Stalker','650','头部；优先用照明、火力或范围攻击显形','潜行虫变体，隐身接近后会快速击飞目标'],
      ]},
      { id: 'rupture-strain', zh: '破裂菌株', enemies: [
        ['rupture-charger','破裂冲锋虫','Rupture Charger','2,400','尾部软组织；注意其钻地突进','会钻地的冲锋虫变体，可从地下发起突袭'],
        ['rupture-spewer','破裂喷吐虫','Rupture Spewer','750','头部与腹部','会钻地的喷吐虫变体，酸液覆盖范围大'],
        ['rupture-warrior','破裂战士','Rupture Warrior','250','头部','会钻地的战士变体，近战威胁较高'],
      ]},
      { id: 'spore-burst-strain', zh: '孢子爆发菌株', enemies: [
        ['spore-burst-bile-titan','孢子爆发胆汁泰坦','Spore Burst Bile Titan','7,000','头部与腹部；重甲区域需穿甲','胆汁泰坦的孢子变体，会喷射可强化周围敌人的孢子'],
        ['spore-burst-hunter','孢子爆发猎杀虫','Spore Burst Hunter','160','头部；死亡时会爆裂','猎杀虫变体，死亡时会爆裂成致命孢子云'],
        ['spore-burst-scavenger','孢子爆发食腐虫','Spore Burst Scavenger','60','头部；死亡时会爆裂','食腐虫变体，死亡时会爆裂成孢子云'],
        ['spore-burst-warrior','孢子爆发战士','Spore Burst Warrior','325','头部；死亡时会爆裂','战士变体，死亡时会爆裂成孢子云'],
      ]},
    ],
  },
  {
    id: 'automatons',
    zh: '机器人',
    en: 'AUTOMATONS',
    color: '#d45d48',
    note: '远程火力、装甲与载具构成的机械军团。先拆除高威胁武器和暴露弱点。',
    source: 'https://helldivers.wiki.gg/wiki/Automatons',
    enemies: [
      ['trooper','士兵','Trooper','125','头部；轻甲躯干也可被常规武器击穿','基础步兵，常与重型单位和哨站共同出现'],
      ['commissar','政委','Commissar','125','头部；优先阻止其接近并发出警报','近战与手枪单位，可能触发机器人增援'],
      ['marauder','掠夺者','Marauder','125','头部；武器手臂可作为优先目标','携带混合武器的步兵，注意火箭与机枪火力'],
      ['berserker','狂战士','Berserker','750','头部与胸部；近战时优先集中火力','双持电锯冲锋，压迫距离很快，使用硬直或爆发火力'],
      ['devastator','毁灭者','Devastator','750','头部与胸部中央；装甲处需穿甲','中型装甲步兵，正面火力稳定，优先打头部'],
      ['rocket-devastator','火箭毁灭者','Rocket Devastator','750','头部与胸部；先处理肩部火箭巢','远距离火箭齐射威胁高，发现肩部发射器时优先击破'],
      ['heavy-devastator','重型毁灭者','Heavy Devastator','750','头部、胸部与暴露的武器手臂','盾牌遮挡正面，绕侧面或用爆炸/穿甲攻击压制'],
      ['scout-strider','侦察步行机','Scout Strider','500','驾驶员；腿部或座舱需针对性攻击','驾驶员是关键弱点，避免把火力浪费在前方装甲板'],
      ['reinforced-scout-strider','强化侦察步行机','Reinforced Scout Strider','500','驾驶员与后方组件；重甲区域需穿甲','强化步行机，侧后方通常比正面更容易处理'],
      ['hulk-bruiser','浩克·重拳','Hulk Bruiser','1,800（主体）','背部散热组件、头部与腿部；重甲需穿甲','近战装甲单位，冲锋后会造成巨大硬直，保持侧后方输出'],
      ['hulk-scorcher','浩克·喷火','Hulk Scorcher','1,800','背部组件、头部与腿部；火焰臂是高威胁目标','喷火浩克近距离持续压制，先拉开距离并攻击背部'],
      ['hulk-obliterator','浩克·歼灭者','Hulk Obliterator','1,800','背部组件、头部与腿部；远程武器需优先处理','重装远程变体，会用高爆火力压制阵地'],
      ['gunship','武装飞船','Gunship','950','发动机与推进部位；通常需高穿甲或专用武器','空中单位，持续导弹攻击会打断行动，先打发动机'],
      ['dropship','运输飞船','Dropship','3,500','发动机；破坏发动机可迫使其坠落','负责投放机器人部队，发现增援信号时优先攻击发动机'],
      ['war-strider','战争步行机','War Strider','3,500','驾驶舱、腿部与武器组件；重甲需穿甲','大型步行载具，先处理驾驶位或威胁最大的武器'],
      ['annihilator-tank','歼灭坦克','Annihilator Tank','4,000（车体）/ 2,100（炮塔）','后方散热口与炮塔组件；正面重甲需穿甲','主炮远程威胁高，绕到后方攻击散热口'],
      ['shredder-tank','粉碎坦克','Shredder Tank','4,000（主体）/ 2,100（炮塔）','后方散热口与炮塔组件','机枪坦克，持续扫射覆盖广，利用掩体接近后方'],
      ['barrager-tank','弹幕坦克','Barrager Tank','4,000（主体）/ 2,100（炮塔）','后方组件与炮塔；重甲需穿甲','远程火箭弹幕单位，保持移动并优先切断其远程火力'],
      ['factory-strider','工厂步行机','Factory Strider','10,000','腹部舱门、腿部与背部组件；重甲需穿甲','超大型载具，可持续部署部队。集中火力打可见结构弱点'],
      ['brawler','斗殴者','Brawler','125','头部；轻甲躯干可被常规武器处理','基础近战机器人，常与远程单位一起推进'],
      ['mg-raider','机枪掠夺者','MG Raider','125','头部与机枪手臂；优先压制其持续火力','携带机枪的远程步兵，压制火力会限制走位'],
      ['rocket-raider','火箭掠夺者','Rocket Raider','125','头部与火箭发射器；先打断火箭攻击','轻型火箭单位，远距离骚扰能力强但本体防护较低'],
      ['assault-raider','突击掠夺者','Assault Raider','125','头部；喷气背包被摧毁会爆炸，击落时注意自爆','轻型机器人单位，装备聚变手枪、热刃与喷气背包，擅长近距离作战'],
    ],
    subfactions: [
      { id: 'incineration-corps', zh: '焚化军团', enemies: [
        ['conflagration-devastator','燃烧毁灭者','Conflagration Devastator','750（主体）','头部与胸部；持盾单位，绕侧或用爆炸/穿甲攻击','毁灭者变体，装备燃烧聚变霰弹枪与大型护盾，可压制并阻挡来火'],
        ['hulk-firebomber','浩克·火焰轰炸','Hulk Firebomber','1,800（主体）','背部组件、头部与腿部；火焰臂威胁高','浩克变体，装备大型火焰喷射器与燃烧榴弹发射器'],
        ['incendiary-mg-devastator','燃烧机枪毁灭者','Incendiary MG Devastator','750（主体）','头部与暴露的武器手臂；先压制其持续火力','重型毁灭者变体，装备射速较慢的燃烧聚变机枪'],
        ['incendiary-rocket-raider','燃烧火箭掠夺者','Incendiary Rocket Raider','125','头部与火箭发射器；先打断火箭攻击','装备专用燃烧火箭发射器的轻型机器人单位'],
        ['pyro-trooper','火焰士兵','Pyro Trooper','125（主体）','头部；优先引爆其背负的燃料罐','强化士兵，装备火焰喷射器与背负式燃料罐'],
      ]},
      { id: 'jet-brigade', zh: '喷射旅', enemies: [
        ['jet-brigade-commissar','喷射旅政委','Jet Brigade Commissar','125','头部；喷气背包可被击毁','政委变体，装备喷气背包可长距离跳跃'],
        ['jet-brigade-devastator','喷射旅毁灭者','Jet Brigade Devastator','750（主体）','头部与胸部；喷气背包','毁灭者变体，装备喷气背包可长距离跳跃'],
        ['jet-brigade-hulk-bruiser','喷射旅浩克·重拳','Jet Brigade Hulk Bruiser','1,800','背部散热组件、头部与腿部','浩克·重拳变体，装备大型喷气背包，可长距离跃击'],
        ['jet-brigade-hulk-scorcher','喷射旅浩克·喷火','Jet Brigade Hulk Scorcher','1,800','背部组件、头部与腿部；火焰臂','浩克·喷火变体，装备大型喷气背包，可长距离跃击'],
        ['jet-brigade-mg-raider','喷射旅机枪掠夺者','Jet Brigade MG Raider','125','头部与机枪手臂','机枪掠夺者变体，装备喷气背包'],
        ['jet-brigade-trooper','喷射旅士兵','Jet Brigade Trooper','125','头部','士兵变体，装备喷气背包'],
      ]},
      { id: 'cyborg-legion', zh: '义体军团', enemies: [
        ['agitator','煽动者','Agitator','750','头部；优先击杀以削弱其指挥的机器人单位','义体战地指挥官，能直接指挥下属机器人单位'],
        ['radical','激进者','Radical','750','头部；其重霰弹枪与近身武术威胁高','装备重霰弹枪与“技术武术”的义体改造士兵'],
        ['vox-engine','噪轰引擎','Vox Engine','9,000','火焰易伤；重甲需高穿甲，优先攻击其武器','巨型义体机甲，装备重型聚变炮、导弹阵列与加特林机枪，仅难度 7+ 出现'],
      ]},
    ],
  },
  {
    id: 'illuminate',
    zh: '光能者',
    en: 'ILLUMINATE',
    color: '#63c8d5',
    note: '能量护盾、心灵科技与传送结构。先破盾，再针对暴露部位输出。',
    source: 'https://helldivers.wiki.gg/wiki/Illuminate',
    enemies: [
      ['voteless','无投票权者','Voteless','100（轻）/ 130（中）/ 160（重）','头部与四肢；群体战优先使用范围控制','数量庞大的近战感染者，会以人海压迫阵地'],
      ['watcher','监察者','Watcher','600','眼部/主体；先打断其侦测与传送行为','漂浮侦察单位，负责发现目标并引导光能者增援'],
      ['overseer','监督者','Overseer','600','头部与能量护盾；破盾后集中攻击身体','拥有护盾与远程武器的精英单位，先破盾再击杀'],
      ['elevated-overseer','高阶监督者','Elevated Overseer','450','头部、能量护盾与喷气组件','空中机动型监督者，保持垂直观察并优先压制其飞行能力'],
      ['harvester','收割者','Harvester','3,000','腿部、眼部与护盾；先拆腿或破盾','大型三脚单位，能量护盾和主武器都很危险，绕侧后方处理'],
      ['crescent-overseer','新月监督者','Crescent Overseer','600','头部；弧线等离子炮可越过掩体，远距离优先击杀','精英监督者变体，装备大型等离子炮，可直射与曲射覆盖掩体后方，常伴随无投票权者出现'],
      ['fleshmob','血肉团','Fleshmob','5,000','火焰与电弧易伤；近距离冲锋单位，保持距离集中火力','由多具无投票权者尸体融合而成的巨型近战单位，会向目标冲锋并挥舞多条肢体'],
      ['stingray','刺鳐','Stingray','800','高速飞行单位；用远程或追踪火力应对其等离子扫射','高速掠袭飞行器，盘旋后用等离子武器对目标实施大范围扫射'],
      ['leviathan','利维坦','Leviathan','15,000','重甲飞行战舰，仅出现在难度 8+；需高穿甲与防空火力','重甲飞行母舰，装备大型光束炮与等离子炸弹舱，仅在难度 8 及以上出现'],
      ['warp-ship','曲速舰','Warp Ship','3,500（主体）','主舰体护甲高；优先击落以阻断敌军增援','运输飞行器，用于投放光能者增援；出现增援信号时应优先击落'],
    ],
    subfactions: [
      { id: 'vote-snatchers', zh: '投票抢夺者', enemies: [
        ['crusher','粉碎者','Crusher','—','可快速再生；需集中火力在其再生前击倒','大型近战单位，生命回复很快，常与可怜虫一同出现'],
        ['wretch','可怜虫','Wretch','—','高速灵活；避免被其近身包抄','装备巨爪、行动敏捷的突变单位，常与粉碎者一同出现'],
      ]},
      { id: 'appropriators', zh: '强占者', enemies: [
        ['gatekeeper','看门人','Gatekeeper','2,500','护甲较高；用高穿甲火力','有人驾驶的光能者战机，装备等离子炮与加强装甲'],
        ['obtruder','闯入者','Obtruder','400','群体出现；用范围火力清剿','成群出现的无人机，发射等离子弹，是监察者的变体'],
        ['veracitor','追索者','Veracitor','3,000','护甲较高；优先攻击其武器臂','有人驾驶的光能者战机，带有臂状附肢'],
      ]},
    ],
  },
];

// 护甲等级（主体 Armor Value，来自各敌人页 Anatomy Table 的 Main 部位 av 字段）。
const ENEMY_ARMOR = {
  scavenger:0, 'bile-spitter':0, pouncer:0, hunter:0, shrieker:0, warrior:1, 'bile-warrior':1, 'alpha-warrior':1,
  'hive-guard':2, 'brood-commander':2, 'alpha-commander':2, stalker:1, charger:4, 'spore-charger':4, 'charger-behemoth':4,
  impaler:4, 'nursing-spewer':2, 'bile-spewer':2, 'bile-titan':4, dragonroach:4, 'hive-lord':5,
  'predator-hunter':0, 'predator-stalker':1,
  'rupture-charger':4, 'rupture-spewer':2, 'rupture-warrior':1,
  'spore-burst-bile-titan':4, 'spore-burst-hunter':0, 'spore-burst-scavenger':0, 'spore-burst-warrior':1,
  trooper:0, commissar:1, marauder:0, berserker:0, devastator:2, 'rocket-devastator':2, 'heavy-devastator':2,
  'scout-strider':4, 'reinforced-scout-strider':4, 'hulk-bruiser':4, 'hulk-scorcher':4, 'hulk-obliterator':4,
  gunship:3, dropship:5, 'war-strider':4, 'annihilator-tank':5, 'shredder-tank':5, 'barrager-tank':5,
  'factory-strider':4, brawler:0, 'mg-raider':0, 'rocket-raider':0, 'assault-raider':0,
  'conflagration-devastator':2, 'hulk-firebomber':4, 'incendiary-mg-devastator':2, 'incendiary-rocket-raider':0, 'pyro-trooper':0,
  'jet-brigade-commissar':0, 'jet-brigade-devastator':2, 'jet-brigade-hulk-bruiser':4, 'jet-brigade-hulk-scorcher':4, 'jet-brigade-mg-raider':0, 'jet-brigade-trooper':0,
  agitator:1, radical:1, 'vox-engine':5,
  voteless:0, watcher:0, overseer:0, 'elevated-overseer':0, harvester:4, 'crescent-overseer':0, fleshmob:0, stingray:3, leviathan:4, 'warp-ship':5,
  crusher:1, wretch:0,
  gatekeeper:4, obtruder:0, veracitor:3
};
const ENEMY_DATA = ENEMY_FACTIONS.flatMap(faction => {
  const base = { faction: faction.id, factionZh: faction.zh, factionColor: faction.color, source: faction.source };
  const toEnemy = (row, subfaction, subfactionZh) => {
    const [id, zh, en, health, weakness, summary] = row;
    return { id, zh, en, health, weakness, summary, subfaction, subfactionZh, armor: ENEMY_ARMOR[id] ?? null, ...base,
      image: `https://helldivers.wiki.gg/wiki/Special:FilePath/${encodeURIComponent(en.replace(/ /g, '_'))}_Enemy_Icon.png?width=640` };
  };
  const main = faction.enemies.map(row => toEnemy(row, null, null));
  const subs = (faction.subfactions || []).flatMap(sf => sf.enemies.map(row => toEnemy(row, sf.id, sf.zh)));
  return [...main, ...subs];
});

// 尚未纳入 refreshed-images 批次的新增敌人，使用本地图标（assets/enemies/）。
const ENEMY_LOCAL_IMAGES = {
  'illuminate:crescent-overseer': 'assets/enemies/illuminate/crescent-overseer.png',
  'illuminate:fleshmob': 'assets/enemies/illuminate/fleshmob.png',
  'illuminate:leviathan': 'assets/enemies/illuminate/leviathan.png',
  'illuminate:stingray': 'assets/enemies/illuminate/stingray.png',
  'illuminate:warp-ship': 'assets/enemies/illuminate/warp-ship.png',
  'automatons:assault-raider': 'assets/enemies/automatons/assault-raider.png',
  'automatons:conflagration-devastator': 'assets/enemies/automatons/conflagration-devastator.png',
  'automatons:hulk-firebomber': 'assets/enemies/automatons/hulk-firebomber.png',
  'automatons:incendiary-mg-devastator': 'assets/enemies/automatons/incendiary-mg-devastator.png',
  'automatons:incendiary-rocket-raider': 'assets/enemies/automatons/incendiary-rocket-raider.png',
  'automatons:pyro-trooper': 'assets/enemies/automatons/pyro-trooper.png',
  'automatons:jet-brigade-commissar': 'assets/enemies/automatons/jet-brigade-commissar.png',
  'automatons:jet-brigade-devastator': 'assets/enemies/automatons/jet-brigade-devastator.png',
  'automatons:jet-brigade-hulk-bruiser': 'assets/enemies/automatons/jet-brigade-hulk-bruiser.png',
  'automatons:jet-brigade-hulk-scorcher': 'assets/enemies/automatons/jet-brigade-hulk-scorcher.png',
  'automatons:jet-brigade-mg-raider': 'assets/enemies/automatons/jet-brigade-mg-raider.png',
  'automatons:jet-brigade-trooper': 'assets/enemies/automatons/jet-brigade-trooper.png',
  'automatons:agitator': 'assets/enemies/automatons/agitator.png',
  'automatons:radical': 'assets/enemies/automatons/radical.png',
  'automatons:vox-engine': 'assets/enemies/automatons/vox-engine.png',
  'illuminate:crusher': 'assets/enemies/illuminate/crusher.png',
  'illuminate:wretch': 'assets/enemies/illuminate/wretch.png',
  'illuminate:gatekeeper': 'assets/enemies/illuminate/gatekeeper.png',
  'illuminate:obtruder': 'assets/enemies/illuminate/obtruder.png',
  'illuminate:veracitor': 'assets/enemies/illuminate/veracitor.png',
  'terminids:rupture-charger': 'assets/enemies/terminids/rupture-charger.png',
  'terminids:rupture-spewer': 'assets/enemies/terminids/rupture-spewer.png',
  'terminids:rupture-warrior': 'assets/enemies/terminids/rupture-warrior.png',
  'terminids:spore-burst-hunter': 'assets/enemies/terminids/spore-burst-hunter.png',
  'terminids:spore-burst-scavenger': 'assets/enemies/terminids/spore-burst-scavenger.png',
  'terminids:spore-burst-warrior': 'assets/enemies/terminids/spore-burst-warrior.png'
};
ENEMY_DATA.forEach(enemy=>{const image=ENEMY_LOCAL_IMAGES[`${enemy.faction}:${enemy.id}`];if(image)enemy.image=image});
