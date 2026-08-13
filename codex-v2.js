/* Purpose-aware equipment codex. Loaded after app.js to replace the original drawer UI. */
state.codex.selected = null;

const CODEX_ATTACK_LABELS = ATTACK_KIND;

const CODEX_CATEGORY_GROUPS = [
  {id:'equipment',label:'常规装备',tone:'neutral',items:[
    {id:'all',label:'全部'}, {id:'primary',label:'主武器'}, {id:'secondary',label:'副武器'},
    {id:'throwable',label:'手雷'}, {id:'booster',label:'强化剂'}
  ]},
  {id:'red',label:'红色战备',tone:'red',items:[
    {id:'red-orbital',label:'轨道战备'}, {id:'red-eagle',label:'飞鹰战备'}
  ]},
  {id:'blue',label:'蓝色战备',tone:'blue',items:[
    {id:'blue-slot3',label:'仅三号位'}, {id:'blue-backpack',label:'仅背包'},
    {id:'blue-combo',label:'三号位 + 背包',fullLabel:'三号位和背包都有的战备'}, {id:'blue-vehicle',label:'载具战备'}
  ]},
  {id:'green',label:'绿色战备',tone:'green',items:[
    {id:'green-turret',label:'炮塔战备',fullLabel:'炮塔与自动部署战备'},
    {id:'green-operated',label:'需要角色操控',fullLabel:'需要角色操控的战备'}
  ]}
];
const CODEX_CATEGORY_ITEMS = CODEX_CATEGORY_GROUPS.flatMap(group=>group.items.map(item=>({...item,tone:group.tone})));
const CODEX_CATEGORY_BY_ID = Object.fromEntries(CODEX_CATEGORY_ITEMS.map(item=>[item.id,item]));

function codexCategoryFor(g){
  if(g.type!=='stratagem')return g.type;
  if(g.en.startsWith('Orbital '))return 'red-orbital';
  if(g.en.startsWith('Eagle '))return 'red-eagle';
  if(g.tags.includes('vehicle'))return 'blue-vehicle';
  if(g.tags.includes('support')&&g.tags.includes('backpack'))return 'blue-combo';
  if(g.tags.includes('backpack'))return 'blue-backpack';
  if(g.tags.includes('support'))return 'blue-slot3';
  if(g.en==='MS-11 Solo Silo'||/^(E\/|E-)|Emplacement|Battlement/i.test(g.en))return 'green-operated';
  return 'green-turret';
}
function renderCodexCategories(){
  const counts=GEAR.reduce((result,g)=>{const category=codexCategoryFor(g);result[category]=(result[category]||0)+1;return result},{});
  counts.all=GEAR.length;
  $('#codexCategories').innerHTML=CODEX_CATEGORY_GROUPS.map(group=>`<section class="codex-category-group ${group.tone}" aria-labelledby="codex-group-${group.id}">
    <h3 id="codex-group-${group.id}">${group.label}</h3>
    <div>${group.items.map(item=>`<button type="button" class="codex-category-button ${state.codex.type===item.id?'active':''}" data-codex-category="${item.id}" aria-pressed="${state.codex.type===item.id}" title="${escapeHtml(item.fullLabel||item.label)}"><span>${escapeHtml(item.label)}</span><b>${counts[item.id]||0}</b></button>`).join('')}</div>
  </section>`).join('');
}

function codexValue(value, unit=''){
  if(value==null || value==='') return '—';
  if(value==='∞') return '无限';
  const number=Number(value);
  const shown=Number.isFinite(number)?Number(number.toFixed(2)).toLocaleString('zh-CN'):String(value);
  return `${shown}${unit}`;
}
function codexAttack(detail, kind){return detail?.attacks?.find(a=>(!kind||a.kind===kind)&&a.damage)}
function hasPurposeData(detail){return !!(detail?.verified||detail?.operational||detail?.officialDescription||detail?.shield||detail?.deployment)}
function equipmentRole(g,d){
  if(g.type==='booster')return 'booster';
  if(d.shield)return 'shield';
  if(g.type==='throwable')return 'throwable';
  if(g.type!=='stratagem')return 'firearm';
  if(/exosuit|vehicle|tank|bastion/i.test(g.en)||g.tags.includes('vehicle'))return 'vehicle';
  if(d.deployment?.sentryAmmo!=null||/sentry|mortar|tesla tower/i.test(g.en))return 'sentry';
  if(/emplacement|relay|battlement/i.test(g.en))return 'emplacement';
  if(g.tags.includes('offensive'))return 'offensive';
  return 'support';
}
function statItem(label,value,unit='',tone=''){
  return {label,value:codexValue(value,unit),tone,empty:value==null||value===''};
}
function purposeStats(g,d,compact=false){
  const role=equipmentRole(g,d),direct=codexAttack(d),blast=codexAttack(d,'explosion'),dep=d.deployment||{};
  const blastRadius=d.attacks?.find(a=>a.kind==='explosion'&&a.radius)?.radius?.max;
  let stats=[];
  if(role==='booster'){
    stats=[statItem('作用范围','全队'),statItem('生效方式','被动'),statItem('装备位','强化剂')];
  }else if(role==='shield'){
    stats=[statItem('护盾值',d.shield.capacity,'','shield'),statItem('再生速度',d.shield.regeneration,'/秒'),statItem('破盾恢复',d.shield.brokenRechargeDelay,'秒'),statItem('受击恢复',d.shield.rechargeDelay,'秒'),statItem('护盾半径',d.shield.radius,'米'),statItem('冷却时间',dep.cooldown,'秒')];
  }else if(role==='vehicle'){
    stats=[statItem('载具耐久',dep.health,'','durable'),statItem('装甲等级',dep.armor),statItem('呼叫时间',dep.callTime,'秒'),statItem('冷却时间',dep.cooldown,'秒'),statItem('使用次数',dep.uses),statItem('弹药 / 容量',d.capacity)];
  }else if(role==='sentry'||role==='emplacement'){
    stats=[statItem(role==='sentry'?'岗哨耐久':'设施耐久',dep.health,'','durable'),statItem('装甲等级',dep.armor),statItem('呼叫时间',dep.callTime,'秒'),statItem('冷却时间',dep.cooldown,'秒'),statItem('载弹量',dep.sentryAmmo),statItem('射速',dep.sentryRpm,' RPM')];
  }else if(g.type==='stratagem'){
    stats=[statItem('呼叫时间',dep.callTime,'秒'),statItem('冷却时间',dep.cooldown,'秒'),statItem('使用次数',dep.uses),statItem('重新武装',dep.rearmTime,'秒'),statItem('投放数量',dep.bombs),statItem('齐射轮数',dep.salvos)];
  }else if(role==='throwable'){
    stats=[statItem('直击伤害',direct?.damage?.standard,'','direct'),statItem('爆炸伤害',blast?.damage?.standard,'','blast'),statItem('爆炸半径',blastRadius,'米','blast'),statItem('携带数量',d.capacity),statItem('耐久伤害',direct?.damage?.durable,'','durable'),statItem('穿甲等级',direct?.damage?.penetration)];
  }else{
    stats=[statItem('直击伤害',direct?.damage?.standard,'','direct'),statItem('耐久伤害',direct?.damage?.durable,'','durable'),statItem('射速',d.rpm,' RPM'),statItem('弹匣容量',d.capacity),statItem('备用弹匣',d.magazines),statItem('操控性',d.ergonomics)];
  }
  const available=stats.filter(s=>!s.empty);
  return compact?available.slice(0,3):available;
}
function purposeSummary(g,d){
  const role=equipmentRole(g,d);
  if(role==='booster')return BOOSTER_DESCRIPTIONS[g.en]||'为整支小队提供持续生效的任务增益。';
  if(role==='shield')return '防护型装备。护盾承受伤害后会等待一段时间再生；完全破裂时采用独立的恢复延迟。';
  if(role==='vehicle')return '载具型战略配备。重点参数是载具耐久、装甲、有限使用次数与再次呼叫所需时间。';
  if(role==='sentry')return '自动岗哨型战略配备。部署后自主索敌；重点关注耐久、弹药、射速、转向与冷却。';
  if(role==='emplacement')return '固定设施型战略配备。重点关注设施耐久、装甲、部署时间、持续时间与冷却。';
  if(role==='offensive')return '进攻型战略配备。呼叫时间决定落点响应速度，冷却时间决定下一次可用时机；伤害构成另列于下方。';
  if(role==='support')return '支援型战略配备。优先展示呼叫时间、冷却时间和使用次数；若附带武器，其伤害数据另列于下方。';
  if(role==='throwable')return '投掷物。直击与爆炸为不同伤害来源，爆炸伤害会随距离从内圈向最大半径衰减。';
  return '单兵武器。直击伤害、耐久伤害、射速与弹药容量分别描述对不同目标和持续作战能力的影响。';
}
function quickStatsHtml(g,d){
  const stats=purposeStats(g,d,true);
  if(!stats.length)return '<div class="quick-stats quick-empty"><div><small>详细数据</small><b>待核实</b></div></div>';
  return `<div class="quick-stats">${stats.map(s=>`<div class="${s.tone}"><small>${escapeHtml(s.label)}</small><b>${escapeHtml(s.value)}</b></div>`).join('')}</div>`;
}

function codexCard(g){
  const d=EQUIPMENT_DETAILS[g.id]||{},m=TYPE_META[g.type],category=codexCategoryFor(g),categoryMeta=CODEX_CATEGORY_BY_ID[category],selected=state.codex.selected===g.id;
  const categoryColor={red:'#ff5c45',blue:'#57a9ff',green:'#93c83e'}[categoryMeta?.tone]||m.color;
  return `<button class="codex-card ${selected?'selected':''}" data-detail="${g.id}" data-type="${g.type}" data-category="${category}" aria-expanded="${selected}" style="--cat-color:${categoryColor}">
    <div class="codex-image"><img loading="lazy" src="${escapeHtml(d.image||'')}" alt="${escapeHtml(g.zh)}"></div>
    <div class="codex-info"><div class="codex-meta-row"><span class="codex-type-tag">${escapeHtml(categoryMeta?.fullLabel||categoryMeta?.label||m.zh)}</span><span class="data-tag ${hasPurposeData(d)?'':'empty'}">${hasPurposeData(d)?'DETAIL':'BASIC'}</span></div><h3>${escapeHtml(g.zh)}</h3><div class="codex-en">${escapeHtml(g.en)}</div>${quickStatsHtml(g,d)}</div>
  </button>`;
}
function operationalStatsHtml(g,d){
  const stats=purposeStats(g,d,false);
  if(!stats.length)return '<div class="empty-detail">当前公开资料没有适用于这件装备的可靠专属数值，因此未用其他装备的字段代替。</div>';
  return `<div class="core-stats purpose-core-stats">${stats.map(s=>`<div class="core-stat ${s.tone}"><small>${escapeHtml(s.label)}</small><b>${escapeHtml(s.value)}</b></div>`).join('')}</div>`;
}
function inlineDetailHtml(g){
  const d=EQUIPMENT_DETAILS[g.id]||{},m=TYPE_META[g.type],w=wbById[g.warbond],attacks=d.attacks||[];
  const official=EQUIPMENT_DESCRIPTIONS_ZH[g.id]||'';
  return `<article class="codex-inline-detail" id="codexInlineDetail" data-inline-detail="${g.id}">
    <button class="inline-detail-close" data-close-inline aria-label="关闭装备详情">×</button>
    <div class="detail-hero"><div class="detail-visual ${g.type}"><img src="${escapeHtml(d.image||'')}" alt="${escapeHtml(g.zh)}"></div><div class="detail-title"><span class="kicker">${m.zh} // EQUIPMENT FILE</span><h2>${escapeHtml(g.zh)}</h2><div class="en">${escapeHtml(g.en)}</div><div class="detail-pills"><span>${escapeHtml(w.zh)}</span><span>${escapeHtml(w.date)}</span>${g.tags.map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div></div></div>
    <section class="detail-section official-description"><div class="detail-section-title"><h3>装备说明</h3><span>${d.descriptionSource==='playstation-blog'?'PLAYSTATION BLOG 译文':'军械库文本译文'}</span></div>${official?`<blockquote lang="zh-CN">${escapeHtml(official)}</blockquote>`:'<div class="empty-detail">该装备页面暂未提供可核实的中文说明。</div>'}<div class="purpose-summary"><b>用途说明</b><p>${escapeHtml(purposeSummary(g,d))}</p></div></section>
    <section class="detail-section"><div class="detail-section-title"><h3>用途专属参数</h3><span>${escapeHtml(equipmentRole(g,d).toUpperCase())} PROFILE</span></div>${operationalStatsHtml(g,d)}</section>
    ${attacks.length?`<section class="detail-section"><div class="detail-section-title"><h3>攻击与伤害构成</h3><span>${attacks.length} ATTACK PROFILES</span></div><div class="attack-list">${attacks.map(attackHtml).join('')}</div><p class="detail-source-note">结构化攻击数据与部署参数来自 Helldivers Wiki 的游戏数据模块。版本更新可能改变数值；爆炸伤害会随距离衰减。</p></section>`:''}
  </article>`;
}

function codexColumns(){
  // 列数由 codex.css 的响应式断点决定，不依赖 grid 实际渲染（避免受 archive-overlay 宽度过渡影响）
  const vw=window.innerWidth||document.documentElement.clientWidth||1180;
  if(vw<=700)return 2;
  if(vw<=1000)return 3;
  return 4;
}
function renderCodex(){
  const f=state.codex,q=f.search.trim().toLowerCase();
  const items=GEAR.filter(g=>released(g)&&(f.type==='all'||codexCategoryFor(g)===f.type)&&(f.warbond==='all'||g.warbond===f.warbond)&&(!f.statsOnly||hasPurposeData(EQUIPMENT_DETAILS[g.id]))&&(!q||`${g.zh} ${g.en} ${wbById[g.warbond]?.zh} ${wbById[g.warbond]?.en}`.toLowerCase().includes(q)));
  if(state.codex.selected&&!items.some(g=>g.id===state.codex.selected))state.codex.selected=null;
  const detailed=GEAR.filter(g=>hasPurposeData(EQUIPMENT_DETAILS[g.id])).length,images=GEAR.filter(g=>EQUIPMENT_DETAILS[g.id]?.image).length;
  $('#imageCoverage').textContent=`${images} / ${GEAR.length}`;
  $('#dataCoverage').textContent=`${detailed} / ${GEAR.length}`;
  $('#codexResultCount').innerHTML=`显示 <b>${items.length}</b> 件装备`;
  $$('.codex-category-button').forEach(button=>{const active=button.dataset.codexCategory===f.type;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active))});
  const html=[];
  const cols=codexColumns();
  const selIdx=state.codex.selected?items.findIndex(g=>g.id===state.codex.selected):-1;
  if(selIdx>=0){
    const rowEnd=Math.min(items.length-1,selIdx-(selIdx%cols)+cols-1);
    for(let i=0;i<items.length;i++){
      html.push(codexCard(items[i]));
      if(i===rowEnd)html.push(inlineDetailHtml(items[selIdx]));
    }
  }else{
    for(const g of items)html.push(codexCard(g));
  }
  $('#codexGrid').innerHTML=html.join('')||'<div class="empty-detail">没有符合当前筛选条件的装备。</div>';
}
function openDetail(id){
  state.codex.selected=state.codex.selected===id?null:id;
  renderCodex();
  if(state.codex.selected)requestAnimationFrame(()=>$('#codexInlineDetail')?.scrollIntoView({behavior:'smooth',block:'nearest'}));
}
function closeDetail(){if(state.codex.selected){state.codex.selected=null;renderCodex();}}

$('#codexGrid').addEventListener('click',event=>{
  if(event.target.closest('[data-close-inline]')){event.preventDefault();event.stopImmediatePropagation();closeDetail();}
});
$('#codexCategories').addEventListener('click',event=>{
  const button=event.target.closest('[data-codex-category]');if(!button)return;
  state.codex.type=button.dataset.codexCategory;
  renderCodex();
});
const statsOnlyText=$('#statsOnly')?.parentElement;
if(statsOnlyText)statsOnlyText.lastChild.textContent='只看有详细数据';
const note=$('.codex-note p');
if(note)note.textContent='图鉴会按装备实际用途选择字段：枪械显示弹药与伤害，爆炸物显示爆炸范围，护盾显示容量与恢复，战略配备显示呼叫、冷却与次数，载具和岗哨显示各自的耐久或部署参数。';
const legend=$('.codex-legend');
if(legend)legend.innerHTML='<i class="direct"></i>攻击 <i class="durable"></i>耐久/防护 <i class="blast"></i>部署/范围';
const coverageLabels=$$('.codex-coverage span');
if(coverageLabels[1])coverageLabels[1].textContent='用途档案';
renderCodexCategories();
renderCodex();

// TOP 按钮：图鉴下滚后回到顶部
(function(){
  const btn=document.getElementById('codexTopBtn');
  const drawer=document.getElementById('archiveDrawer');
  const codexPanel=document.getElementById('codexPanel');
  if(!btn||!drawer||!codexPanel)return;
  function sync(){
    btn.classList.toggle('show',codexPanel.classList.contains('active')&&drawer.scrollTop>300);
  }
  drawer.addEventListener('scroll',sync,{passive:true});
  btn.addEventListener('click',()=>{
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    drawer.scrollTo({top:0,behavior:reduce?'auto':'smooth'});
  });
  new MutationObserver(sync).observe(codexPanel,{attributes:true,attributeFilter:['class']});
  sync();
})();
