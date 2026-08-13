import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts[^>]*>\s*/g, '');

const probe = `<style>.archive-overlay{transition:none!important}.archive-drawer>.panel.active{animation:none!important}</style>
<script>
window.addEventListener('load', function(){
  try { activatePanel('codex'); state.codex.type = 'red-orbital'; renderCodex(); } catch(e) {}
  setTimeout(function(){
    function tops(selId){
      // 打开详情前清空，再打开指定详情
      state.codex.selected = null; renderCodex();
      openDetail(selId);
      var grid = document.getElementById('codexGrid');
      var cards = Array.from(grid.querySelectorAll('.codex-card'));
      var detail = grid.querySelector('.codex-inline-detail');
      var rows = cards.map(function(c){ return Math.round(c.getBoundingClientRect().top); });
      var rowTops = Array.from(new Set(rows));
      // 每行卡片数
      var groups = rowTops.map(function(t){ return rows.filter(function(r){ return r===t; }).length; });
      var selIdx = cards.findIndex(function(c){ return c.dataset.detail === selId; });
      var detailTop = detail ? Math.round(detail.getBoundingClientRect().top) : -1;
      return { sel: selId, selIdx: selIdx, colCount: (typeof codexColumns==='function')?codexColumns():-1, rows: groups, detailTop: detailTop, cardTops: rows };
    }
    var r1 = tops('stratagem-orbital-precision-strike');       // 第一行第一个
    var r2 = tops('stratagem-orbital-gatling-barrage');        // 第一行第二个
    var r5 = tops('stratagem-orbital-walking-barrage');        // 第二行第一个(selIdx=5, 第二行)
    var r12 = tops('stratagem-orbital-ems-strike');            // 最后一个
    var el = document.createElement('pre');
    el.id = 'VERIFY_RESULT';
    el.textContent = JSON.stringify({ r1: r1, r2: r2, r5: r5, r12: r12 });
    document.body.appendChild(el);
  }, 500);
});
</script>`;
html = html.replace('</body>', probe + '\n</body>');

const tmp = path.join(root, 'verify-codex-layout.html');
fs.writeFileSync(tmp, html);
const url = pathToFileURL(tmp).href;

let stdout = '';
try {
  stdout = execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=8000', '--window-size=1600,1000', '--dump-dom', url], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
} catch (e) { stdout = e.stdout || ''; console.error('edge exit error:', e.status); }

const m = stdout.match(/<pre id="VERIFY_RESULT">([\s\S]*?)<\/pre>/);
console.log(m ? m[1] : 'VERIFY_RESULT_NOT_FOUND');

fs.unlinkSync(tmp);
