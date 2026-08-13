import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 移除 Google Fonts 联网引用，避免 headless 等待外部网络
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts[^>]*>\s*/g, '');

const smokeScript = `
<script>
document.addEventListener('DOMContentLoaded', function(){
(function(){
  const out = { steps: [] };
  function assert(name, cond, extra){ out.steps.push({ name, pass: !!cond, extra: extra || '' }); }
  try {
    const grid = document.getElementById('codexGrid');
    const cards = grid ? (grid.innerHTML.match(/codex-card/g) || []).length : -1;
    assert('initial-render', grid && cards > 0, 'cards=' + cards);

    assert('categories-rendered', document.getElementById('codexCategories').innerHTML.includes('codex-category-button'));
    assert('logo-localized', document.querySelector('.brand-mark img')?.getAttribute('src') === 'assets/ui/helldivers-2-logo-white.webp');
    assert('default-faction-terminids', state.missionTarget === 'terminids' && document.querySelector('#missionTarget input:checked')?.value === 'terminids');
    assert('old-score-removed', !document.getElementById('warbondList').innerHTML.includes('stratagem-score') && !document.getElementById('loadoutGrid').innerHTML.includes('分'));
    activatePanel('weights');
    const weightRows = document.querySelectorAll('#weightList .weight-row');
    assert('weights-panel-rendered', weightRows.length === GEAR.filter(g => g.type === 'stratagem' && released(g)).length, 'rows=' + weightRows.length);
    const weightTarget = weightRows[0]?.dataset.weightId;
    const initialWeight = weightTarget ? weightFor(GEAR.find(g => g.id === weightTarget), 'terminids') : 0;
    if (weightTarget) setWeight(weightTarget, initialWeight === 100 ? 99 : initialWeight + 1);
    const savedWeights = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').weights || {};
    assert('weight-persists', weightTarget && savedWeights.terminids?.[weightTarget] === weightFor(GEAR.find(g => g.id === weightTarget), 'terminids'));
    const beforeRollFaction = state.missionTarget;
    state.options.oneBackpack = true; state.options.oneSupport = false; state.options.includeBooster = true;
    const generated = generate();
    assert('weighted-roll-keeps-faction', generated?.length === 8 && state.missionTarget === beforeRollFaction);
    activatePanel('roulette');

    const id = (typeof GEAR !== 'undefined' && GEAR[0]) ? GEAR[0].id : null;
    if (id) {
      openDetail(id);
      assert('open-set-selected', state.codex.selected === id, 'selected=' + state.codex.selected);
      assert('open-render-inline', grid.innerHTML.includes('codex-inline-detail'));
    } else {
      assert('open', false, 'GEAR empty');
    }

    closeDetail();
    assert('close-cleared', state.codex.selected === null, 'selected=' + state.codex.selected);

    // 军械库路径：搜索 + 只看启用
    const armoryList = document.getElementById('warbondList');
    state.filters.search = '轨道';
    state.filters.warbond = 'all';
    state.filters.type = 'all';
    state.filters.enabledOnly = false;
    renderArmory();
    const expectedOrbital = GEAR.filter(g => (g.zh + ' ' + g.en + ' ' + wbById[g.warbond].zh + ' ' + wbById[g.warbond].en).toLowerCase().includes('轨道')).length;
    const orbitalRows = (armoryList.innerHTML.match(/class="gear-row/g) || []).length;
    assert('armory-search-count', orbitalRows === expectedOrbital && orbitalRows > 0, 'rows=' + orbitalRows + ' expected=' + expectedOrbital);

    state.filters.search = '';
    state.filters.enabledOnly = true;
    const victimId = GEAR[0].id;
    state.enabled[victimId] = false;
    renderArmory();
    const victimGone = armoryList.innerHTML.indexOf('data-gear="' + victimId + '"') === -1;
    assert('armory-enabled-only-hides-disabled', victimGone, 'victim=' + victimId);
    state.enabled[victimId] = true;
    state.filters.enabledOnly = false;
    renderArmory();
    state.weightOverrides = {};
    state.missionTarget = 'terminids';
    renderLoadout();
  } catch (e) {
    out.error = e.name + ': ' + e.message;
  }
  const el = document.createElement('pre');
  el.id = 'SMOKE_RESULT';
  el.textContent = JSON.stringify(out);
  document.body.appendChild(el);
})();
});
</script>
`;

html = html.replace('</body>', smokeScript + '\n</body>');

const tmp = path.join(root, 'smoke-test.html');
fs.writeFileSync(tmp, html);

const url = pathToFileURL(tmp).href;
let stdout = '';
try {
  stdout = execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--virtual-time-budget=3000', '--dump-dom', url
  ], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
} catch (e) {
  stdout = e.stdout || '';
  console.error('edge exit error:', e.status);
}

const m = stdout.match(/<pre id="SMOKE_RESULT">([\s\S]*?)<\/pre>/);
if (!m) {
  console.log('SMOKE_RESULT_NOT_FOUND');
  // 输出 DOM 尾部便于排查
  console.log('tail:', stdout.slice(-800));
} else {
  console.log(m[1]);
}

fs.unlinkSync(tmp);
