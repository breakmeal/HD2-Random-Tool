const STORAGE_KEY = 'super-earth-randomizer-v1';
const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const wbById = Object.fromEntries(WARBONDS.map(w=>[w.id,w]));
const gearByWarbond = {};
for(const g of GEAR) (gearByWarbond[g.warbond] = gearByWarbond[g.warbond] || []).push(g);
const gearSearchKey = {};
for(const g of GEAR){ const w=wbById[g.warbond]; gearSearchKey[g.id] = `${g.zh} ${g.en} ${w.zh} ${w.en}`.toLowerCase(); }

const state = {
  enabled: Object.fromEntries(GEAR.map(g=>[g.id,true])),
  filters:{search:'',type:'all',enabledOnly:false,warbond:'all'},
  codex:{search:'',type:'all',warbond:'all',statsOnly:false},
  options:{oneBackpack:true,oneSupport:false,includeBooster:true},
  weightOverrides:{},
  loadout:null,
  loadoutCode:null,
  missionTarget:'terminids',
  mainTab:'roulette'
};

function loadState(){
  try{
    const hash = location.hash.startsWith('#cfg=') ? JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(5))))) : null;
    const saved = hash || JSON.parse(localStorage.getItem(STORAGE_KEY));
    if(!saved) return;
    if(Array.isArray(saved.disabled)) saved.disabled.forEach(id=>{if(id in state.enabled) state.enabled[id]=false});
    if(saved.options) Object.assign(state.options,saved.options);
    if(saved.missionTarget&&TARGET_FACTION_BY_ID[saved.missionTarget]) state.missionTarget=saved.missionTarget;
    if(saved.weights&&typeof saved.weights==='object') state.weightOverrides=saved.weights;
  }catch(e){ console.warn('Configuration could not be loaded',e); }
}
function saveState(){
  const data={disabled:GEAR.filter(g=>!state.enabled[g.id]).map(g=>g.id),options:state.options,missionTarget:state.missionTarget,weights:state.weightOverrides};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
}
function released(g){return wbById[g.warbond]?.released !== false}
function pool(type){return GEAR.filter(g=>g.type===type && released(g) && state.enabled[g.id])}
function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function defaultWeight(g,targetId){return stratagemRating(g,targetId)||1}
function weightFor(g,targetId=state.missionTarget){return Math.max(1,Math.min(100,Number(state.weightOverrides?.[targetId]?.[g.id])||defaultWeight(g,targetId)))}
function weightedPick(arr,targetId=state.missionTarget){
  if(!arr.length)return null;
  const total=arr.reduce((sum,g)=>sum+weightFor(g,targetId),0);
  let cursor=Math.random()*total;
  for(const g of arr){cursor-=weightFor(g,targetId);if(cursor<0)return g}
  return arr[arr.length-1];
}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function showToast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(showToast.t);showToast.t=setTimeout(()=>el.classList.remove('show'),2200)}

function updateCounts(){
  $('#releasedCount').textContent=WARBONDS.filter(w=>w.released && w.id!=='base').length;
  $('#upcomingCount').textContent=WARBONDS.filter(w=>!w.released).length;
  $('#gearCount').textContent=GEAR.length;
  const active=GEAR.filter(g=>released(g)&&state.enabled[g.id]).length;
  $('#poolCount').textContent=active;
  $('#poolCount').parentElement.title=`${active} / ${GEAR.filter(released).length} 件已发布装备已启用`;
}

const slotDefs=[
  ['primary','主武器'],['secondary','次要武器'],['throwable','投掷物'],['booster','强化剂'],
  ['stratagem','战略配备 01'],['stratagem','战略配备 02'],['stratagem','战略配备 03'],['stratagem','战略配备 04']
];
function loadoutCardHtml(i,item,locked,justLocked){
  const [type,label]=slotDefs[i]; const meta=TYPE_META[type];
  const image=item?EQUIPMENT_DETAILS[item.id]?.image:null;
  let cn=item?item.zh:'等待民主配给';
  let en=item?item.en:'AWAITING AUTHORIZATION';
  if(!item&&type==='booster'){
    if(!state.options.includeBooster){cn='本轮不抽取';en='BOOSTER DISABLED';}
    else if(state.loadout){cn='本轮未含强化剂';en='NO BOOSTER THIS ROLL';}
  }
  return `<article class="loadout-card ${item?'':'empty'} ${locked?'slot-locked':''} ${justLocked?'just-locked':''}" data-index="0${i+1}" style="--cat-color:${meta.color}">
      <div class="slot-head"><span>${label}</span><span class="slot-icon">${meta.icon}</span></div>
      <div class="loadout-visual ${type}">${item&&image?`<img src="${escapeHtml(image)}" alt="${escapeHtml(item.zh)}">`:`<span aria-hidden="true">${meta.icon}</span>`}</div>
      <div class="gear-cn">${escapeHtml(cn)}</div>
      <div class="gear-en">${escapeHtml(en)}</div>
      ${item?`<span class="gear-source">${escapeHtml(wbById[item.warbond].zh)}</span>`:''}
    </article>`;
}
function renderMissionTarget(){
  const root=$('#missionTargetOptions');if(!root)return;
  root.innerHTML=TARGET_FACTIONS.map(target=>`<label class="mission-choice ${state.missionTarget===target.id?'active':''}"><input type="radio" name="missionTarget" value="${target.id}" ${state.missionTarget===target.id?'checked':''}><b>${target.zh}</b></label>`).join('');
}
function renderLoadout(items=state.loadout,lockedIndexes=[],newlyLocked=-1){
  const locked=new Set(lockedIndexes);
  renderMissionTarget();
  $('#loadoutGrid').innerHTML=slotDefs.map((_,i)=>loadoutCardHtml(i,items?.[i],locked.has(i),newlyLocked===i)).join('');
}
function renderLoadoutSlot(index,item,locked,justLocked){
  const card=$(`.loadout-card[data-index="0${index+1}"]`);
  if(card)card.outerHTML=loadoutCardHtml(index,item,locked,justLocked);
}

// 配给编号：把一次随机结果编码成可分享、可载入的短码。格式 SES-L1-<16 位 base36 负载><1 位校验>。
const LOADOUT_CODE_PREFIX='SES-L1-';
const LOADOUT_CODE_NULL=255; // 强化剂槽为空的哨兵值
function encodeLoadout(items){
  const values=items.map(it=>it?GEAR.indexOf(it):LOADOUT_CODE_NULL);
  if(values.some(v=>v<0))return null;
  const payload=values.map(v=>v.toString(36).padStart(2,'0')).join('');
  const checksum=(values.reduce((s,v)=>s+v,0)%36).toString(36);
  return LOADOUT_CODE_PREFIX+payload+checksum;
}
function decodeLoadout(code){
  const clean=String(code||'').trim().toUpperCase();
  const body=clean.startsWith(LOADOUT_CODE_PREFIX)?clean.slice(LOADOUT_CODE_PREFIX.length):clean;
  if(body.length!==17||!/^[0-9A-Z]{17}$/.test(body))return null;
  const values=[];
  for(let i=0;i<8;i++){const v=parseInt(body.slice(i*2,i*2+2),36);if(Number.isNaN(v))return null;values.push(v)}
  if(values.reduce((s,v)=>s+v,0)%36!==parseInt(body[16],36))return null;
  const items=values.map(v=>v===LOADOUT_CODE_NULL?null:GEAR[v]||null);
  const types=slotDefs.map(s=>s[0]);
  for(let i=0;i<items.length;i++){
    if(items[i]==null){if(i!==3)return null}
    else if(items[i].type!==types[i])return null;
  }
  return items;
}
function applyLoadoutCode(code){
  const items=decodeLoadout(code);
  if(!items){showToast('配给编号无效，请检查后重试');return false}
  state.loadout=items;
  state.loadoutCode=encodeLoadout(items);
  const grid=$('#loadoutGrid');
  grid.classList.remove('rolling','sweeping');
  grid.classList.add('roll-complete');
  renderLoadout(items,[0,1,2,3,4,5,6,7]);
  $('#rollHint').textContent=`已载入配给编号 ${state.loadoutCode} · 结果已锁定`;
  if($('#loadoutCodeInput'))$('#loadoutCodeInput').value=state.loadoutCode;
  return true;
}

function isCompatible(candidate, selected){
  if(state.options.oneBackpack && candidate.tags.includes('backpack') && selected.some(x=>x.tags.includes('backpack'))) return false;
  if(state.options.oneSupport && candidate.tags.includes('support') && selected.some(x=>x.tags.includes('support'))) return false;
  return true;
}
function drawStratagems(){
  const available=pool('stratagem');
  for(let attempt=0;attempt<300;attempt++){
    const remaining=[...available],chosen=[];
    while(remaining.length&&chosen.length<4){
      const compatible=remaining.filter(item=>isCompatible(item,chosen));
      if(!compatible.length)break;
      const item=weightedPick(compatible);
      chosen.push(item);
      remaining.splice(remaining.indexOf(item),1);
    }
    if(chosen.length===4)return chosen;
  }
  return [];
}
function generate(){
  const required=['primary','secondary','throwable'];
  const missing=required.filter(t=>!pool(t).length).map(t=>TYPE_META[t].zh);
  if(state.options.includeBooster&&!pool('booster').length) missing.push('强化剂');
  if(pool('stratagem').length<4) missing.push('战略配备（至少 4 件）');
  if(missing.length){showToast(`无法抽取：请启用${missing.join('、')}`);return null}
  const strats=drawStratagems();
  if(strats.length<4){showToast('当前背包/支援限制下不足四项，请放宽限制');return null}
  return [pick(pool('primary')),pick(pool('secondary')),pick(pool('throwable')),state.options.includeBooster?pick(pool('booster')):null,...strats];
}
function generatePreview(){return [pick(pool('primary')),pick(pool('secondary')),pick(pool('throwable')),state.options.includeBooster?pick(pool('booster')):null,...drawStratagems()]}
function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
async function roll(){
  const result=generate();if(!result)return;
  const btn=$('#rollBtn');btn.classList.add('rolling');btn.disabled=true;
  const grid=$('#loadoutGrid');grid.classList.remove('roll-complete');grid.classList.add('rolling');
  const hint=$('#rollHint');
  const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  hint.textContent='民主配给计算中 · 正在校验装备池';
  if(!reduceMotion){
    for(let tick=0;tick<10;tick++){
      renderLoadout(generatePreview());
      await wait(75+tick*10);
    }
    const stopOrder=state.options.includeBooster?[0,1,2,3,4,5,6,7]:[0,1,2,4,5,6,7];
    const locked=[];
    for(const index of stopOrder){
      locked.push(index);
      const preview=generatePreview();
      for(let i=0;i<slotDefs.length;i++){
        if(!locked.includes(i))renderLoadoutSlot(i,preview[i],false,false);
      }
      const prev=locked[locked.length-2];
      if(prev!=null)$(`.loadout-card[data-index="0${prev+1}"]`)?.classList.remove('just-locked');
      renderLoadoutSlot(index,result[index],true,true);
      hint.textContent=`民主配给锁定中 · ${locked.length} / ${stopOrder.length}`;
      await wait(230);
    }
    state.loadout=result;
    $$('.loadout-card',grid).forEach(card=>card.classList.remove('just-locked'));
    grid.classList.remove('rolling');
    grid.classList.add('sweeping');
    hint.textContent='配给结果核验中 · 战备信号扫掠中';
    await wait(1100);
    grid.classList.remove('sweeping');
    grid.classList.add('roll-complete');
  }else{
    state.loadout=result;
    grid.classList.add('roll-complete');
    grid.classList.remove('rolling');
    renderLoadout();
  }
  btn.classList.remove('rolling');btn.disabled=false;
  state.loadoutCode=encodeLoadout(state.loadout);
  if($('#loadoutCodeInput'))$('#loadoutCodeInput').value=state.loadoutCode||'';
  hint.textContent=state.loadoutCode?`配给编号 ${state.loadoutCode} · 结果已锁定`:'配给编号生成失败 · 结果已锁定';
}

function groupEnabled(wbId){const items=gearByWarbond[wbId]||[];return items.length>0&&items.every(g=>state.enabled[g.id])}
function renderArmory(){
  const f=state.filters,q=f.search.trim().toLowerCase();
  const selected=f.warbond==='all'?null:wbById[f.warbond];
  const scope=selected?[selected]:WARBONDS;
  const matches=g=>(f.type==='all'||g.type===f.type)&&(!f.enabledOnly||state.enabled[g.id])&&(!q||gearSearchKey[g.id].includes(q));
  const rows=[];
  for(const w of scope){const items=gearByWarbond[w.id]||[];for(const g of items)if(matches(g))rows.push(gearRow(g,w,!selected));}
  $('#warbondNav').innerHTML=`<button class="warbond-nav-item ${!selected?'active':''}" type="button" data-warbond-select="all" aria-pressed="${!selected}"><span>◈</span><b>全部</b><small>${GEAR.length}</small></button>`+
    WARBONDS.map(w=>{const count=(gearByWarbond[w.id]||[]).length;const active=selected?.id===w.id;return `<button class="warbond-nav-item ${active?'active':''} ${!w.released?'upcoming':''}" type="button" data-warbond-select="${w.id}" aria-pressed="${active}"><span>${w.tier==='legendary'?'★':w.tier==='premium'?'◆':'⬢'}</span><b>${escapeHtml(w.zh)}</b><small>${w.released?count:'档案'}</small></button>`}).join('');
  let total=0,activeCount=0;
  for(const w of scope){const items=gearByWarbond[w.id]||[];total+=items.length;for(const g of items)if(state.enabled[g.id])activeCount++;}
  const title=selected?selected.zh:'全部装备';
  const subtitle=selected?`${selected.en} · ${selected.date}`:'当前所有战争债券中的装备';
  const isReleased=!selected||selected.released;
  const toggle=selected&&isReleased?`<button class="catalog-bond-switch ${groupEnabled(selected.id)?'on':''}" type="button" data-action="toggle-wb" data-wb="${selected.id}" role="switch" aria-checked="${groupEnabled(selected.id)}"><span></span>整组${groupEnabled(selected.id)?'已启用':'已排除'}</button>`:'';
  const empty=selected&&!total?`<div class="armory-empty"><span>⌛</span><b>该债券内容尚未公开</b><small>ARCHIVE CONTENT PENDING</small></div>`:`<div class="armory-empty"><span>⌕</span><b>没有符合当前筛选的装备</b><small>调整搜索或筛选条件后重试</small></div>`;
  $('#warbondList').innerHTML=`<header class="armory-catalog-head ${selected&&!selected.released?'upcoming':''}"><div><span class="kicker">${selected?'WARBOND INVENTORY':'AUTHORIZED INVENTORY'}</span><h3>${escapeHtml(title)}</h3><small>${escapeHtml(subtitle)}</small></div><div class="catalog-summary"><b>${activeCount}/${total}</b><small>${selected&&!selected.released?'待发布 · 不参与随机':'已启用'}</small>${toggle}</div></header><div class="armory-gear-list">${rows.length?rows.join(''):empty}</div>`;
}
function gearRow(g,w,showWarbond=false){const m=TYPE_META[g.type],on=state.enabled[g.id];return `<div class="gear-row ${on?'':'disabled'} ${w.released?'':'future'}" data-gear="${g.id}">
  <span class="gear-type" style="--cat-color:${m.color}" title="${m.zh}">${m.icon}</span>
  <span><b>${escapeHtml(g.zh)}</b><small>${escapeHtml(g.en)} · ${m.zh}${showWarbond?` · ${escapeHtml(w.zh)}`:''}</small></span>
  ${w.released?`<span class="mini-switch ${on?'on':''}"></span>`:'<span class="state-badge future">锁定</span>'}
  </div>`}

const BOOSTER_DESCRIPTIONS={
  'Hellpod Space Optimization':'绝地潜兵离开地狱舱时，弹药、手榴弹与治疗剂全部补满。',
  'Vitality Enhancement':'为全体绝地潜兵提供少量来自所有伤害来源的减伤。',
  'UAV Recon Booster':'扩大所有绝地潜兵的有效雷达侦察范围。',
  'Stamina Enhancement':'提高全体绝地潜兵的耐力容量与恢复速度。',
  'Muscle Enhancement':'让绝地潜兵更容易穿越泥泞、积雪等困难地形。',
  'Increased Reinforcement Budget':'增加任务开始时可用的增援次数。',
  'Flexible Reinforcement Budget':'增援耗尽后，缩短自动补充新增援所需的时间。',
  'Localization Confusion':'延长敌军增援或遭遇事件之间的间隔。',
  'Expert Extraction Pilot':'缩短撤离穿梭机抵达撤离信标所需的时间。',
  'Motivational Shocks':'受到酸液等攻击减速后恢复得更快；不抵消电磁脉冲区域效果。',
  'Experimental Infusion':'治疗剂除恢复生命外，还会短暂提高移动速度与伤害抗性。',
  'Firebomb Hellpods':'所有地狱舱着陆时引爆燃烧装药，点燃落点附近单位。',
  'Dead Sprint':'耐力耗尽后仍可继续冲刺，但会改为消耗生命值。',
  'Armed Resupply Pods':'为补给舱加装改装型 AR-23，使其着陆后可作为自动炮塔。',
  'Sample Extricator':'大型敌人死亡时有概率掉落样本；每场任务最多触发 10 次。',
  'Sample Scanner':'拾取样本时有 15% 概率获得双倍样本。',
  'Stun Pods':'地狱舱接触地面时释放电击，眩晕落点附近单位。',
  'Concealed Insertion':'地狱舱着陆时部署烟幕，遮蔽绝地潜兵的投送位置。'
};
const ATTACK_KIND={projectile:'弹丸直击',explosion:'爆炸',beam:'光束',arc:'电弧',spray:'喷射',status:'持续状态'};
const fmt=v=>v==null?'—':Number.isFinite(Number(v))?Number(v).toLocaleString('zh-CN'):String(v);
// 图鉴真实实现在 codex-v2.js（加载后覆盖 renderCodex / codexCard / openDetail / closeDetail）。
// 旧版 firstDamage / renderCodex / codexCard 已移除，避免双实现与改错文件。
function damageCell(label,value,cls=''){return `<div class="damage-cell ${cls}"><small>${label}</small><b>${fmt(value)}</b></div>`}
function attackHtml(a){
  const d=a.damage||{},isBlast=a.kind==='explosion',status=a.kind==='status';
  const kind=ATTACK_KIND[a.kind]||a.kind||'攻击';
  return `<div class="attack"><div class="attack-head"><b>${escapeHtml(kind)}</b>${a.name?`<span class="attack-code">${escapeHtml(a.name)}</span>`:''}</div>
    <div class="damage-grid">${damageCell(status?'状态伤害':'标准伤害',d.standard,'direct')}${damageCell('耐久伤害',d.durable,'durable')}${damageCell('穿甲等级',d.penetration,isBlast?'blast':'')}</div>
    ${a.projectile?.pellets>1?`<div class="radius-band">每次发射 <b>${fmt(a.projectile.pellets)}</b> 枚弹丸 · 上方为单颗弹丸伤害</div>`:''}
    ${isBlast&&a.radius?`<div class="radius-band">爆炸半径　内圈 <b>${fmt(a.radius.inner)}m</b>　外圈 <b>${fmt(a.radius.outer)}m</b>　最大 <b>${fmt(a.radius.max)}m</b></div>`:''}
    ${a.range?`<div class="radius-band">有效范围 <b>${fmt(a.range)}m</b>${a.chains?`　电弧分裂 <b>${fmt(a.chains)}</b>`:''}</div>`:''}
  </div>`
}
// 旧版 openDetail / closeDetail（弹层 detailOverlay 形式）已被 codex-v2.js 的内联详情取代。

function toggleWarbond(id){
  const items=gearByWarbond[id]||[];const next=!groupEnabled(id);
  items.forEach(g=>state.enabled[g.id]=next);saveState();renderArmory();updateCounts();
  showToast(`${wbById[id].zh}：已${next?'启用':'排除'}全部装备`);
}
function toggleGear(id){state.enabled[id]=!state.enabled[id];saveState();renderArmory();updateCounts()}
function renderWeights(){
  const targetId=state.weightTarget||state.missionTarget;
  const target=TARGET_FACTION_BY_ID[targetId]||TARGET_FACTIONS[0];
  const q=($('#weightSearch')?.value||'').trim().toLowerCase();
  $('#weightFactions').innerHTML=TARGET_FACTIONS.map(item=>`<label class="weight-faction ${item.id===target.id?'active':''}"><input type="radio" name="weightFaction" value="${item.id}" ${item.id===target.id?'checked':''}><span>${item.short}</span><b>${item.zh}</b></label>`).join('');
  const items=GEAR.filter(g=>g.type==='stratagem'&&released(g)&&(!q||gearSearchKey[g.id].includes(q)));
  $('#weightList').innerHTML=items.map(g=>{const weight=weightFor(g,target.id);return `<div class="weight-row" data-weight-id="${g.id}"><div class="weight-gear"><span class="gear-type" style="--cat-color:${TYPE_META.stratagem.color}">${TYPE_META.stratagem.icon}</span><span><b>${escapeHtml(g.zh)}</b><small>${escapeHtml(g.en)} · ${g.tags.length?escapeHtml(g.tags.join(' / ')):'常规战略配备'}</small></span></div><input class="weight-range" type="range" min="1" max="100" value="${weight}" aria-label="${escapeHtml(g.zh)} 对${target.zh}的权重"><input class="weight-number" type="number" min="1" max="100" value="${weight}" aria-label="${escapeHtml(g.zh)} 权重数值"></div>`}).join('');
}
function setWeight(id,value){
  const targetId=state.weightTarget||state.missionTarget;
  const next=Math.max(1,Math.min(100,Math.round(Number(value)||1)));
  state.weightOverrides[targetId] ||= {};
  state.weightOverrides[targetId][id]=next;
  saveState();
  const row=$(`[data-weight-id="${id}"]`);if(row){$('.weight-range',row).value=next;$('.weight-number',row).value=next}
}

let archiveReturnFocus=null;
function mountArchivePanels(){
  const drawer=$('#archiveDrawer');
  ['codexPanel','intelPanel'].forEach(id=>{const panel=$(`#${id}`);if(panel)drawer.append(panel)});
}
function activatePanel(tabName){
  const panel=$(`#${tabName}Panel`);if(!panel)return;
  const archiveMode=tabName==='codex'||tabName==='intel';
  const archiveOverlay=$('#archiveOverlay'),shell=$('#experienceShell');
  if(archiveMode&&!archiveOverlay.classList.contains('open'))archiveReturnFocus=document.activeElement;
  if(!archiveMode)state.mainTab=tabName;
  shell.classList.toggle('archive-mode',archiveMode);
  archiveOverlay.classList.toggle('open',archiveMode);
  archiveOverlay.setAttribute('aria-hidden',String(!archiveMode));
  document.body.classList.toggle('archive-mode-active',archiveMode);
  $$('[data-tab]').forEach(control=>{
    const active=control.dataset.tab===tabName;
    control.classList.toggle('active',active);
    control.setAttribute('aria-pressed',String(active));
    if(control.closest('.right-rail'))control.setAttribute('aria-expanded',String(active));
  });
  $$('.panel').forEach(item=>item.classList.toggle('active',item===panel));
  if(archiveMode){
    $('#archiveDrawer').scrollTop=0;
    requestAnimationFrame(()=>panel.querySelector('input,select,button')?.focus({preventScroll:true}));
  }
}
function closeArchive(){
  if(!$('#archiveOverlay').classList.contains('open'))return;
  const focusTarget=archiveReturnFocus?.isConnected?archiveReturnFocus:$(`[data-tab="${state.mainTab}"]`);
  archiveReturnFocus=null;
  activatePanel(state.mainTab);
  focusTarget?.focus({preventScroll:true});
}

function bindEvents(){
  $$('[data-tab]').forEach(control=>control.addEventListener('click',()=>activatePanel(control.dataset.tab)));
  $('#earthStageReturn').addEventListener('click',()=>{if($('#experienceShell').classList.contains('archive-mode'))closeArchive()});
  $('#missionTarget').addEventListener('change',e=>{if(e.target.name!=='missionTarget')return;state.missionTarget=e.target.value;saveState();renderLoadout();renderWeights();showToast(`敌情已切换：${TARGET_FACTION_BY_ID[state.missionTarget].zh}`)});
  $('#weightFactions').addEventListener('change',e=>{if(e.target.name!=='weightFaction')return;state.weightTarget=e.target.value;renderWeights()});
  $('#weightSearch').addEventListener('input',renderWeights);
  $('#weightList').addEventListener('input',e=>{if(!e.target.matches('.weight-range,.weight-number'))return;setWeight(e.target.closest('[data-weight-id]').dataset.weightId,e.target.value)});
  $('#resetWeightsBtn').addEventListener('click',()=>{const targetId=state.weightTarget||state.missionTarget;delete state.weightOverrides[targetId];saveState();renderWeights();showToast('当前敌族权重已恢复为原始强度值')});
  $('#rollBtn').addEventListener('click',roll);
  $('#loadCodeBtn').addEventListener('click',()=>applyLoadoutCode($('#loadoutCodeInput').value));
  $('#loadoutCodeInput').addEventListener('keydown',e=>{if(e.key==='Enter')applyLoadoutCode(e.target.value)});
  $('#copyCodeBtn').addEventListener('click',async()=>{
    const code=state.loadoutCode||$('#loadoutCodeInput').value.trim();
    if(!code){showToast('暂无配给编号，请先执行随机部署');return}
    try{await navigator.clipboard.writeText(code);showToast('配给编号已复制')}catch{showToast('复制失败，请手动复制编号')}
  });
  ['oneBackpack','oneSupport','includeBooster'].forEach(id=>{$(`#${id}`).checked=state.options[id];$(`#${id}`).addEventListener('change',e=>{state.options[id]=e.target.checked;saveState();renderLoadout()})});
  $('#warbondNav').addEventListener('click',e=>{const button=e.target.closest('[data-warbond-select]');if(!button)return;state.filters.warbond=button.dataset.warbondSelect;renderArmory()});
  $('#warbondList').addEventListener('click',e=>{
    const toggle=e.target.closest('[data-action="toggle-wb"]');
    if(toggle){toggleWarbond(toggle.dataset.wb);return}
    const row=e.target.closest('[data-gear]');if(row&&!row.classList.contains('future')){toggleGear(row.dataset.gear);return}
  });
  $('#searchInput').addEventListener('input',e=>{state.filters.search=e.target.value;renderArmory()});
  $('#typeFilter').addEventListener('change',e=>{state.filters.type=e.target.value;renderArmory()});
  $('#enabledOnly').addEventListener('change',e=>{state.filters.enabledOnly=e.target.checked;renderArmory()});
  $('#codexSearch').addEventListener('input',e=>{state.codex.search=e.target.value;renderCodex()});
  $('#codexWarbond').addEventListener('change',e=>{state.codex.warbond=e.target.value;renderCodex()});
  $('#statsOnly').addEventListener('change',e=>{state.codex.statsOnly=e.target.checked;renderCodex()});
  $('#codexGrid').addEventListener('click',e=>{const card=e.target.closest('[data-detail]');if(card)openDetail(card.dataset.detail)});
  document.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    if(state.codex.selected){closeDetail();return}
    if($('#archiveOverlay').classList.contains('open')){closeArchive();return}
    closeDetail();
  });
  $('#enableAllBtn').addEventListener('click',()=>{GEAR.forEach(g=>state.enabled[g.id]=true);saveState();renderArmory();updateCounts();showToast('所有已发布装备均已启用')});
  $('#disablePaidBtn').addEventListener('click',()=>{GEAR.forEach(g=>state.enabled[g.id]=['base','mobilize'].includes(g.warbond));saveState();renderArmory();updateCounts();showToast('已仅保留基础军备与免费债券')});
  $('#resetBtn').addEventListener('click',()=>{GEAR.forEach(g=>state.enabled[g.id]=true);Object.assign(state.options,{oneBackpack:true,oneSupport:false,includeBooster:true});state.weightOverrides={};state.weightTarget='terminids';state.loadout=null;state.loadoutCode=null;state.missionTarget='terminids';localStorage.removeItem(STORAGE_KEY);history.replaceState(null,'',location.pathname+location.search);init();if($('#loadoutCodeInput'))$('#loadoutCodeInput').value='';showToast('配置已恢复默认')});
  $('#shareBtn').addEventListener('click',async()=>{
    const data={disabled:GEAR.filter(g=>!state.enabled[g.id]).map(g=>g.id),options:state.options,missionTarget:state.missionTarget,weights:state.weightOverrides};
    const url=`${location.origin}${location.pathname}#cfg=${btoa(unescape(encodeURIComponent(JSON.stringify(data))))}`;
    try{await navigator.clipboard.writeText(url);showToast('当前装备配置链接已复制')}catch{showToast('浏览器不允许复制；请从地址栏复制链接')}
  });
}
function init(){
  state.weightTarget ||= state.missionTarget;
  updateCounts();renderLoadout();renderArmory();renderWeights();
  $('#codexWarbond').innerHTML='<option value="all">全部来源</option>'+WARBONDS.filter(w=>w.released).map(w=>`<option value="${w.id}">${escapeHtml(w.zh)}</option>`).join('');
  ['oneBackpack','oneSupport','includeBooster'].forEach(id=>{if($(`#${id}`))$(`#${id}`).checked=state.options[id]});
}

mountArchivePanels();loadState();bindEvents();init();
