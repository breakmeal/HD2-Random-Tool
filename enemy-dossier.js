/* Independent enemy drawer. It deliberately does not reuse equipment codex state. */
const enemyState = { faction:'terminids', search:'', selected:null };
const enemyOverlay = $('#enemyOverlay');
const enemyGrid = $('#enemyGrid');
const enemyFactions = $('#enemyFactions');
const enemyStatus = $('#enemyStatus');
const experienceShell = $('#experienceShell');
const enemyPortal = $('#enemyDossierBtn');
const earthStageReturn = $('#earthStageReturn');
const enemyFocus = $('#enemyFocus');
const enemyFocusContent = $('#enemyFocusContent');
const enemyDrawer = $('.enemy-drawer',enemyOverlay);
let enemyReturnFocus = null;
let enemyDetailReturnFocus = null;

const ENEMY_IMAGE_VIEW={
  'terminids:scavenger':{scale:1.24,y:'-14%'},
  'terminids:pouncer':{scale:1.16,y:'-2%'},
  'terminids:bile-spitter':{scale:1.12,y:'-6%'},
  'terminids:hunter':{scale:1.06,y:'-7%'},
  'terminids:bile-warrior':{scale:1.05,y:'-6%'},
  'terminids:dragonroach':{scale:1.04,y:'-4%'},
  'automatons:gunship':{scale:1.08,y:'-7%'},
  'illuminate:watcher':{scale:1.08,y:'-11%'}
};

function enemyImageStyle(faction,id){
  const view=ENEMY_IMAGE_VIEW[`${faction}:${id}`]||{scale:1,y:'0%'};
  return `--enemy-scale:${view.scale};--enemy-y:${view.y}`;
}

function enemyImageFallback(event){
  const image=event.target;
  if(!image.matches('.enemy-image')||image.dataset.failed) return;
  image.dataset.failed='true';
  image.hidden=true;
  image.parentElement.classList.add('missing');
}

function factionEnemyCount(faction){return ENEMY_DATA.filter(e=>e.faction===faction.id).length}
function renderEnemyFactionTabs(){
  enemyFactions.innerHTML=ENEMY_FACTIONS.map(faction=>`<button class="enemy-faction-tab ${enemyState.faction===faction.id?'active':''}" role="tab" aria-selected="${enemyState.faction===faction.id}" data-enemy-faction="${faction.id}" style="--faction-color:${faction.color}"><b>${escapeHtml(faction.zh)}</b><small>${escapeHtml(faction.en)} · ${factionEnemyCount(faction)} FILES</small></button>`).join('');
}

function renderEnemyGrid(){
  const faction=ENEMY_FACTIONS.find(item=>item.id===enemyState.faction)||ENEMY_FACTIONS[0];
  const query=enemyState.search.trim().toLowerCase();
  const all=ENEMY_DATA.filter(e=>e.faction===faction.id);
  const match=e=>!query||`${e.zh} ${e.en} ${e.summary} ${e.weakness}`.toLowerCase().includes(query);
  const groups=[{zh:null,enemies:all.filter(e=>!e.subfaction&&match(e))}];
  for(const sf of (faction.subfactions||[]))groups.push({zh:sf.zh,enemies:all.filter(e=>e.subfaction===sf.id&&match(e))});
  const shown=groups.reduce((n,g)=>n+g.enemies.length,0);
  enemyStatus.innerHTML=`<span>显示 <b>${shown}</b> / ${all.length} 个敌人条目</span><span class="faction-note">${escapeHtml(faction.note)}</span>`;
  const anyMatch=groups.some(g=>g.enemies.some(e=>e.id===enemyState.selected));
  if(enemyState.selected&&!anyMatch)closeEnemyDetail(false);
  let index=0;
  const html=[];
  for(const group of groups){
    if(!group.enemies.length)continue;
    if(group.zh)html.push(`<div class="enemy-subfaction-head"><b>${escapeHtml(group.zh)}</b><small>${group.enemies.length} 个条目</small></div>`);
    const sorted=[...group.enemies].sort((a,b)=>(a.armor??99)-(b.armor??99)||String(a.zh).localeCompare(String(b.zh),'zh'));
    for(const enemy of sorted)html.push(enemyCardHtml(enemy,index++,faction));
  }
  enemyGrid.innerHTML=html.length?html.join(''):`<div class="enemy-empty">没有匹配的敌人条目。请尝试中文名或英文名。</div>`;
  enemyGrid.insertAdjacentHTML('beforeend','<p class="enemy-note">血量与部位弱点按 Helldivers Wiki 当前公开资料整理；显示“待核实”表示页面没有足够稳定的统一数值，不代表零血量。</p>');
}

function enemyCardHtml(enemy,index,faction){
  const full=ENEMY_DATA.find(item=>item.id===enemy.id&&item.faction===faction.id);
  return `<button class="enemy-card" type="button" data-enemy-id="${escapeHtml(enemy.id)}" aria-label="查看${escapeHtml(enemy.zh)}详细档案" style="--faction-color:${faction.color};${enemyImageStyle(faction.id,enemy.id)}">
    <div class="enemy-card-visual"><span class="enemy-index">${String(index+1).padStart(2,'0')}</span>${enemy.armor!=null?`<span class="enemy-armor-badge">护甲 ${enemy.armor}</span>`:''}<img class="enemy-image" loading="lazy" src="${escapeHtml(full?.image||'')}" alt="${escapeHtml(enemy.zh)}" /></div>
    <div class="enemy-card-caption"><h3>${escapeHtml(enemy.zh)}</h3><span>${escapeHtml(enemy.en)}</span><i>打开档案</i></div>
  </button>`;
}

function openEnemyDetail(id,trigger){
  const faction=ENEMY_FACTIONS.find(item=>item.id===enemyState.faction)||ENEMY_FACTIONS[0];
  const full=ENEMY_DATA.find(item=>item.id===id&&item.faction===faction.id);
  if(!full)return;
  enemyState.selected=id;
  enemyDetailReturnFocus=trigger||document.activeElement;
  enemyFocus.style.setProperty('--faction-color',faction.color);
  const subTag=full.subfactionZh?` · ${escapeHtml(full.subfactionZh)}`:'';
  enemyFocusContent.innerHTML=`<div class="enemy-focus-layout" style="${enemyImageStyle(faction.id,id)}">
    <div class="enemy-focus-visual"><span>${escapeHtml(faction.zh)} // ${escapeHtml(faction.en)}${subTag}</span><img class="enemy-image" src="${escapeHtml(full.image||'')}" alt="${escapeHtml(full.zh)}"></div>
    <div class="enemy-focus-body"><div class="enemy-focus-heading"><small>${full.subfactionZh?escapeHtml(full.subfactionZh)+' · ':''}敌方单位档案</small><h2 id="enemyFocusTitle">${escapeHtml(full.zh)}</h2><p>${escapeHtml(full.en)}</p></div>
      <div class="enemy-health"><small>生命值</small><b>${escapeHtml(full.health||'待核实')}</b></div>
      <div class="enemy-health"><small>护甲等级</small><b>${full.armor!=null?escapeHtml(full.armor):'待核实'}</b></div>
      <div class="enemy-fact"><small>弱点</small><p>${escapeHtml(full.weakness)}</p></div>
      <div class="enemy-fact"><small>战场识别</small><p>${escapeHtml(full.summary)}</p></div>
      <a class="enemy-card-source" href="${escapeHtml(full.source||faction.source)}" target="_blank" rel="noreferrer">查看 Helldivers Wiki 来源 ↗</a>
    </div></div>`;
  enemyDrawer.inert=true;
  enemyFocus.classList.add('open');
  enemyFocus.setAttribute('aria-hidden','false');
  requestAnimationFrame(()=>$('.enemy-focus-close',enemyFocus)?.focus({preventScroll:true}));
}

function closeEnemyDetail(restoreFocus=true){
  if(!enemyFocus.classList.contains('open'))return;
  enemyState.selected=null;
  enemyFocus.classList.remove('open');
  enemyFocus.setAttribute('aria-hidden','true');
  enemyDrawer.inert=false;
  const target=enemyDetailReturnFocus;
  enemyDetailReturnFocus=null;
  if(restoreFocus&&target?.isConnected)target.focus({preventScroll:true});
}

function openEnemyDossier(){
  if(enemyOverlay.classList.contains('open')) return;
  enemyReturnFocus=document.activeElement;
  renderEnemyFactionTabs();
  renderEnemyGrid();
  experienceShell.classList.add('enemy-mode');
  enemyOverlay.classList.add('open');
  enemyOverlay.setAttribute('aria-hidden','false');
  enemyPortal.setAttribute('aria-expanded','true');
  document.body.classList.add('enemy-mode-active');
  requestAnimationFrame(()=>$('.enemy-close',enemyOverlay)?.focus({preventScroll:true}));
}
function closeEnemyDossier(){
  if(!enemyOverlay.classList.contains('open')) return;
  closeEnemyDetail(false);
  experienceShell.classList.remove('enemy-mode');
  enemyOverlay.classList.remove('open');
  enemyOverlay.setAttribute('aria-hidden','true');
  enemyPortal.setAttribute('aria-expanded','false');
  document.body.classList.remove('enemy-mode-active');
  const focusTarget=enemyReturnFocus?.isConnected?enemyReturnFocus:enemyPortal;
  enemyReturnFocus=null;
  focusTarget?.focus({preventScroll:true});
}

enemyPortal.addEventListener('click',openEnemyDossier);
earthStageReturn.addEventListener('click',closeEnemyDossier);
enemyOverlay.addEventListener('click',event=>{
  if(event.target.closest('[data-close-enemy-detail]')){closeEnemyDetail();return;}
  const card=event.target.closest('[data-enemy-id]');
  if(card){openEnemyDetail(card.dataset.enemyId,card);return;}
  if(event.target.closest('[data-close-enemy]')) closeEnemyDossier();
  const tab=event.target.closest('[data-enemy-faction]');
  if(tab){closeEnemyDetail(false);enemyState.faction=tab.dataset.enemyFaction;renderEnemyFactionTabs();renderEnemyGrid();}
});
$('#enemySearch').addEventListener('input',event=>{closeEnemyDetail(false);enemyState.search=event.target.value;renderEnemyGrid()});
enemyGrid.addEventListener('error',enemyImageFallback,true);
enemyFocus.addEventListener('error',enemyImageFallback,true);
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(enemyFocus.classList.contains('open'))closeEnemyDetail();else if(enemyOverlay.classList.contains('open'))closeEnemyDossier()});
