/* 任务档案：与敌人档案并行，复用分屏机制但维护独立 missionState。 */
const missionState = { faction: 'terminids', search: '', selected: null };
const missionOverlay = $('#missionOverlay');
const missionGrid = $('#missionGrid');
const missionFactions = $('#missionFactions');
const missionStatus = $('#missionStatus');
const missionDifficultyBar = $('#missionDifficultyBar');
const missionFocus = $('#missionFocus');
const missionFocusContent = $('#missionFocusContent');
const missionDrawer = $('.mission-drawer', missionOverlay);
const missionPortal = $('#missionDossierBtn');
let missionReturnFocus = null;
let missionDetailReturnFocus = null;

function missionFactionById(id){ return MISSION_FACTIONS.find(f => f.id === id) || MISSION_FACTIONS[0]; }
function missionDifficultyRange(m){
  return m.minDifficulty === m.maxDifficulty ? `仅 ${m.minDifficulty} 级` : `${m.minDifficulty}–${m.maxDifficulty} 级`;
}
function missionTime(m){ return m.timeMinutes ? `${m.timeMinutes} 分钟` : '—'; }

function missionImageFallback(event){
  const image = event.target;
  if(!image.matches('.mission-image') || image.dataset.failed) return;
  image.dataset.failed = 'true';
  image.hidden = true;
  image.parentElement.classList.add('missing');
}

function renderMissionFactionTabs(){
  missionFactions.innerHTML = MISSION_FACTIONS.map(faction => {
    const count = MISSIONS.filter(m => m.faction === faction.id).length;
    return `<button class="mission-faction-tab ${missionState.faction===faction.id?'active':''}" role="tab" aria-selected="${missionState.faction===faction.id}" data-mission-faction="${faction.id}" style="--faction-color:${faction.color}"><b>${escapeHtml(faction.zh)}</b><small>${escapeHtml(faction.en)} · ${count} MISSIONS</small></button>`;
  }).join('');
}

function renderMissionDifficultyBar(){
  missionDifficultyBar.innerHTML = MISSION_DIFFICULTIES.map(d =>
    `<span class="mission-diff-chip ${d.level>=7?'high':''}" title="主目标 ${d.main} · ${escapeHtml(d.note)}"><b>${d.level}</b>${escapeHtml(d.zh)}<small>${d.reward}</small></span>`
  ).join('');
}

function renderMissionGrid(){
  const faction = missionFactionById(missionState.faction);
  const query = missionState.search.trim().toLowerCase();
  const items = MISSIONS.filter(m => m.faction === faction.id && (!query || `${m.zh} ${m.en}`.toLowerCase().includes(query)));
  missionStatus.innerHTML = `<span>显示 <b>${items.length}</b> / ${MISSIONS.filter(m=>m.faction===faction.id).length} 个主任务</span><span class="faction-note">${escapeHtml(faction.note)}</span>`;
  if(missionState.selected && !items.some(m => m.id === missionState.selected)) closeMissionDetail(false);
  missionGrid.innerHTML = items.length
    ? items.map((m, i) => missionCardHtml(m, i, faction)).join('')
    : `<div class="mission-empty">没有匹配的任务条目。请尝试中文名或英文名。</div>`;
  missionGrid.insertAdjacentHTML('beforeend', '<p class="mission-note">难度范围、时限与目标来自 Helldivers Wiki；「难度差异」汇总了该任务随难度变化的公开说明，完整梯度见上方难度条。</p>');
}

function missionCardHtml(mission, index, faction){
  return `<button class="mission-card" type="button" data-mission-id="${escapeHtml(mission.id)}" aria-label="查看${escapeHtml(mission.zh)}详情" style="--faction-color:${faction.color}">
    <div class="mission-card-visual"><span class="mission-diff-badge">${escapeHtml(missionDifficultyRange(mission))}</span><img class="mission-image" loading="lazy" src="${escapeHtml(mission.image)}" alt="${escapeHtml(mission.zh)}" /></div>
    <div class="mission-card-caption"><h3>${escapeHtml(mission.zh)}</h3><span>${escapeHtml(mission.en)}</span><i>打开任务档案</i></div>
  </button>`;
}

function openMissionDetail(id, trigger){
  const faction = missionFactionById(missionState.faction);
  const mission = MISSIONS.find(m => m.id === id && m.faction === faction.id);
  if(!mission) return;
  missionState.selected = id;
  missionDetailReturnFocus = trigger || document.activeElement;
  missionFocus.style.setProperty('--faction-color', faction.color);
  missionFocusContent.innerHTML = `<div class="mission-focus-layout">
    <div class="mission-focus-visual"><span>${escapeHtml(faction.zh)} // ${escapeHtml(faction.en)}</span><img class="mission-image" src="${escapeHtml(mission.image)}" alt="${escapeHtml(mission.zh)}"></div>
    <div class="mission-focus-body">
      <div class="mission-focus-heading"><small>主任务档案 // MAIN OBJECTIVE</small><h2 id="missionFocusTitle">${escapeHtml(mission.zh)}</h2><p>${escapeHtml(mission.en)}</p></div>
      <div class="mission-meta">
        <span class="mission-meta-item">难度范围<b>${escapeHtml(missionDifficultyRange(mission))}</b></span>
        <span class="mission-meta-item">时限<b>${escapeHtml(missionTime(mission))}</b></span>
      </div>
      <div class="mission-fact"><small>目标说明</small><p>${escapeHtml(mission.briefing)}</p></div>
      <div class="mission-fact difficulty"><small>难度差异</small><p>${escapeHtml(mission.difficultyNote)}</p></div>
      <a class="mission-card-source" href="https://helldivers.wiki.gg/wiki/Missions" target="_blank" rel="noreferrer">查看 Helldivers Wiki 任务目录 ↗</a>
    </div></div>`;
  missionDrawer.inert = true;
  missionFocus.classList.add('open');
  missionFocus.setAttribute('aria-hidden','false');
  requestAnimationFrame(() => $('.mission-focus-close', missionFocus)?.focus({ preventScroll: true }));
}

function closeMissionDetail(restoreFocus = true){
  if(!missionFocus.classList.contains('open')) return;
  missionState.selected = null;
  missionFocus.classList.remove('open');
  missionFocus.setAttribute('aria-hidden','true');
  missionDrawer.inert = false;
  const target = missionDetailReturnFocus;
  missionDetailReturnFocus = null;
  if(restoreFocus && target?.isConnected) target.focus({ preventScroll: true });
}

function openMissionDossier(){
  if(missionOverlay.classList.contains('open')) return;
  missionReturnFocus = document.activeElement;
  renderMissionFactionTabs();
  renderMissionDifficultyBar();
  renderMissionGrid();
  experienceShell.classList.add('mission-mode');
  missionOverlay.classList.add('open');
  missionOverlay.setAttribute('aria-hidden','false');
  missionPortal.setAttribute('aria-expanded','true');
  document.body.classList.add('mission-mode-active');
  requestAnimationFrame(() => $('.mission-close', missionOverlay)?.focus({ preventScroll: true }));
}
function closeMissionDossier(){
  if(!missionOverlay.classList.contains('open')) return;
  closeMissionDetail(false);
  experienceShell.classList.remove('mission-mode');
  missionOverlay.classList.remove('open');
  missionOverlay.setAttribute('aria-hidden','true');
  missionPortal.setAttribute('aria-expanded','false');
  document.body.classList.remove('mission-mode-active');
  const focusTarget = missionReturnFocus?.isConnected ? missionReturnFocus : missionPortal;
  missionReturnFocus = null;
  focusTarget?.focus({ preventScroll: true });
}

missionPortal.addEventListener('click', openMissionDossier);
earthStageReturn.addEventListener('click', closeMissionDossier);
missionOverlay.addEventListener('click', event => {
  if(event.target.closest('[data-close-mission-detail]')){ closeMissionDetail(); return; }
  const card = event.target.closest('[data-mission-id]');
  if(card){ openMissionDetail(card.dataset.missionId, card); return; }
  if(event.target.closest('[data-close-mission]')) closeMissionDossier();
  const tab = event.target.closest('[data-mission-faction]');
  if(tab){ closeMissionDetail(false); missionState.faction = tab.dataset.missionFaction; renderMissionFactionTabs(); renderMissionGrid(); }
});
$('#missionSearch').addEventListener('input', event => { closeMissionDetail(false); missionState.search = event.target.value; renderMissionGrid(); });
missionGrid.addEventListener('error', missionImageFallback, true);
missionFocus.addEventListener('error', missionImageFallback, true);
document.addEventListener('keydown', event => {
  if(event.key !== 'Escape') return;
  if(missionFocus.classList.contains('open')) closeMissionDetail();
  else if(missionOverlay.classList.contains('open')) closeMissionDossier();
});
