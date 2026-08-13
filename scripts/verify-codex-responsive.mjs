import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

// 断言：选中 selId 后，所选行(rowStart..rowEnd)的卡片 top 一致，详情在行下方
const checkJs = `
function checkCase(selId, category){
  if (category) { state.codex.type = category; }
  state.codex.selected = null; renderCodex();
  openDetail(selId);
  var grid = document.getElementById('codexGrid');
  var cards = Array.from(grid.querySelectorAll('.codex-card'));
  var detail = grid.querySelector('.codex-inline-detail');
  var cols = (typeof codexColumns==='function') ? codexColumns() : -1;
  var selIdx = cards.findIndex(function(c){ return c.dataset.detail === selId; });
  if (selIdx < 0) return { sel: selId, selIdx: -1, note: 'not-in-list' };
  var rowStart = selIdx - (selIdx % cols);
  var rowEnd = Math.min(cards.length - 1, rowStart + cols - 1);
  var tops = cards.map(function(c){ return Math.round(c.getBoundingClientRect().top); });
  var rowTops = tops.slice(rowStart, rowEnd + 1);
  var rowAllSame = rowTops.every(function(t){ return t === rowTops[0]; });
  var detailTop = detail ? Math.round(detail.getBoundingClientRect().top) : -1;
  var rowBottom = Math.round(cards[rowStart].getBoundingClientRect().bottom);
  var detailBelow = detailTop >= rowBottom - 1;
  return { sel: selId, cols: cols, selIdx: selIdx, rowStart: rowStart, rowEnd: rowEnd, rowAllSame: rowAllSame, detailBelow: detailBelow, totalCards: cards.length };
}
window.__runChecks = function(){
  var results = {};
  // 轨道战备 12 件：选第一个、第二个、第6个(第二行首)、最后一个
  results.orbital_first = checkCase('stratagem-orbital-precision-strike', 'red-orbital');
  results.orbital_second = checkCase('stratagem-orbital-gatling-barrage', 'red-orbital');
  results.orbital_row2 = checkCase('stratagem-orbital-walking-barrage', 'red-orbital');
  results.orbital_last = checkCase('stratagem-orbital-ems-strike', 'red-orbital');
  // 筛选变化：全部(199)里选一个主武器，再切到主武器分类看是否重排正确
  results.all_first = checkCase('primary-ar-23-liberator', 'all');
  results.primary_first = checkCase('primary-ar-23-liberator', 'primary');
  var el = document.createElement('pre');
  el.id = 'RESP_RESULT';
  el.textContent = JSON.stringify(results);
  document.body.appendChild(el);
};
`;

const probe = `<style>.archive-overlay{transition:none!important}.archive-drawer>.panel.active{animation:none!important}</style>
<script>
window.addEventListener('load', function(){
  try { activatePanel('codex'); } catch(e) {}
  setTimeout(function(){ try { window.__runChecks(); } catch(e){} }, 400);
});
</script>`;

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts[^>]*>\s*/g, '');
html = html.replace('</body>', `<script>${checkJs}</script>${probe}\n</body>`);

const tmp = path.join(root, 'verify-responsive.html');
fs.writeFileSync(tmp, html);
const url = pathToFileURL(tmp).href;

for (const width of [1600, 900, 600]) {
  let stdout = '';
  try {
    stdout = execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=8000', `--window-size=${width},1000`, '--dump-dom', url], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) { stdout = e.stdout || ''; }
  const m = stdout.match(/<pre id="RESP_RESULT">([\s\S]*?)<\/pre>/);
  console.log(`WIDTH ${width}: ${m ? m[1] : 'NOT_FOUND'}`);
}

fs.unlinkSync(tmp);
