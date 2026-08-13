/*
 * Community-reference stratagem scores.
 * These are derived from the local Wiki attack snapshot plus matchup heuristics;
 * they are not official balance values and seed the editable random weights.
 */
const TARGET_FACTIONS = [
  {id:'terminids',zh:'虫族',en:'Terminids',short:'虫',hint:'群体压制、燃烧与范围伤害'},
  {id:'automatons',zh:'机器人',en:'Automatons',short:'机',hint:'穿甲、耐久部位与精确火力'},
  {id:'illuminate',zh:'光能者',en:'Illuminate',short:'光',hint:'电弧、光束与中远程控制'}
];
const TARGET_FACTION_BY_ID=Object.fromEntries(TARGET_FACTIONS.map(target=>[target.id,target]));
const clampScore=value=>Math.max(1,Math.min(100,Math.round(value)));
function scoreAttacks(detail){
  const attacks=detail?.attacks||[];
  let damage=0,penetration=0,area=0,control=0,elemental={fire:0,gas:0,Arc:0,beam:0};
  attacks.forEach(attack=>{
    const hit=attack.damage||{};
    const standard=Number(hit.standard)||0;
    const durable=Number(hit.durable)||0;
    const radius=attack.radius||{};
    damage=Math.max(damage,standard,durable);
    penetration=Math.max(penetration,Number(hit.penetration)||0);
    area=Math.max(area,Number(radius.max)||0);
    control=Math.max(control,Number(hit.stagger)||0,Number(hit.demolition)||0);
    const element=hit.element;
    if(element&&elemental[element]!=null) elemental[element]+=1;
    if(attack.kind==='arc') elemental.Arc+=1;
    if(attack.kind==='beam') elemental.beam+=1;
  });
  if(!attacks.length)return {base:34,damage,penetration,area,control,elemental};
  const base=30+(Math.log10(Math.max(10,damage))*10)+(penetration*4.2)+(Math.min(area,35)*.42)+(Math.min(control,100)*.08)+(attacks.length*1.8);
  return {base,damage,penetration,area,control,elemental};
}
function matchupAdjustment(stats,targetId,g){
  const e=stats.elemental,area=stats.area,penetration=stats.penetration;
  let adjustment=0;
  if(e.fire) adjustment+=targetId==='terminids'?14:targetId==='illuminate'?6:-3;
  if(e.gas) adjustment+=targetId==='terminids'?8:targetId==='automatons'?7:5;
  if(e.Arc) adjustment+=targetId==='illuminate'?13:targetId==='automatons'?8:5;
  if(e.beam) adjustment+=targetId==='illuminate'?9:targetId==='automatons'?7:3;
  if(penetration>=6) adjustment+=targetId==='automatons'?12:targetId==='illuminate'?8:4;
  else if(penetration>=4) adjustment+=targetId==='automatons'?6:targetId==='illuminate'?5:2;
  if(area>=10) adjustment+=targetId==='terminids'?10:targetId==='illuminate'?7:5;
  else if(area>=5) adjustment+=targetId==='terminids'?6:3;
  if(stats.damage>=1500) adjustment+=targetId==='automatons'?5:targetId==='illuminate'?4:3;
  if(g.tags.includes('backpack')&&!g.tags.includes('support'))adjustment+=2;
  if(g.tags.includes('defensive'))adjustment+=targetId==='terminids'?3:2;
  return adjustment;
}
function buildStratagemRating(g){
  const stats=scoreAttacks(EQUIPMENT_DETAILS[g.id]);
  const scores=Object.fromEntries(TARGET_FACTIONS.map(target=>[target.id,clampScore(stats.base+matchupAdjustment(stats,target.id,g))]));
  const best=TARGET_FACTIONS.reduce((winner,target)=>scores[target.id]>scores[winner.id]?target:winner,TARGET_FACTIONS[0]);
  return {base:clampScore(stats.base),scores,best:best.id,source:'Helldivers Wiki 结构化攻击数据 + 社区适配参考'};
}
const STRATAGEM_RATINGS=Object.fromEntries(GEAR.filter(g=>g.type==='stratagem').map(g=>[g.id,buildStratagemRating(g)]));
function stratagemRating(g,targetId){return STRATAGEM_RATINGS[g.id]?.scores[targetId]??STRATAGEM_RATINGS[g.id]?.base??0}
function stratagemBestTarget(g){return TARGET_FACTION_BY_ID[STRATAGEM_RATINGS[g.id]?.best]||TARGET_FACTIONS[0]}
