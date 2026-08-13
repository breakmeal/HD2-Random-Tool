import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

// 一次性 A/B 对照 / 回退诊断工具：构造 normal 与 defer 两个版本的 index.html 并对比 DCL 分布。
// 当前 index.html 已落地 defer，本工具的 normal-vs-defer 假设不再成立，仅在回退诊断时使用。
const root = path.resolve(import.meta.dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

let base = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
base = base.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
base = base.replace(/<link href="https:\/\/fonts[^>]*>\s*/g, '');

const headProbe = '<script>window.__t0=performance.now();</script>';
const bodyProbe = `<script>
var __scriptExec = performance.now() - window.__t0;
window.addEventListener('load', function(){
  var nav = performance.getEntriesByType('navigation')[0];
  var dcl = nav ? Math.round(nav.domContentLoadedEventEnd - nav.startTime) : null;
  var hasArmory = document.getElementById('warbondList').innerHTML.indexOf('gear-row') !== -1;
  var hasCodex = document.getElementById('codexGrid').innerHTML.indexOf('codex-card') !== -1;
  var el = document.createElement('pre');
  el.id = 'BENCH_RESULT';
  el.textContent = JSON.stringify({ dcl: dcl, scriptExec: Math.round(__scriptExec), hasArmory: hasArmory, hasCodex: hasCodex });
  document.body.appendChild(el);
});
</script>`;

const normalHtml = base.replace('<title>超级地球 · 随机军备终端</title>', '<title>超级地球 · 随机军备终端</title>' + headProbe).replace('</body>', bodyProbe + '\n</body>');
const deferHtml = base.replace(/<script src="([^"]+\.js)"><\/script>/g, '<script src="$1" defer></script>').replace('<title>超级地球 · 随机军备终端</title>', '<title>超级地球 · 随机军备终端</title>' + headProbe).replace('</body>', bodyProbe + '\n</body>');

function measureOnce(html) {
  const tmp = path.join(root, 'bench-once.html');
  fs.writeFileSync(tmp, html);
  const url = pathToFileURL(tmp).href;
  let stdout = '';
  try {
    stdout = execFileSync(EDGE, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--dump-dom', url
    ], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch (e) {
    stdout = e.stdout || '';
  }
  fs.unlinkSync(tmp);
  const m = stdout.match(/<pre id="BENCH_RESULT">([\s\S]*?)<\/pre>/);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { return null; }
}

// 预热
measureOnce(normalHtml);
measureOnce(deferHtml);

const normal = [], defer = [];
let normalOk = 0, deferOk = 0;
const ROUNDS = 15;
for (let i = 0; i < ROUNDS; i++) {
  const a = measureOnce(normalHtml);
  const b = measureOnce(deferHtml);
  if (a && a.dcl != null && a.hasArmory && a.hasCodex) { normal.push(a.dcl); normalOk++; }
  if (b && b.dcl != null && b.hasArmory && b.hasCodex) { defer.push(b.dcl); deferOk++; }
}
if (normal.length > 1) normal.shift();
if (defer.length > 1) defer.shift();

function stats(arr) {
  const s = [...arr].sort((x, y) => x - y);
  const mid = Math.floor(s.length / 2), p90 = Math.floor(s.length * 0.9);
  const avg = Math.round(s.reduce((x, y) => x + y, 0) / s.length);
  return { n: s.length, min: s[0], median: s[mid] ?? null, p90: s[p90] ?? null, avg, all: s };
}

// 顺带统计 scriptExec（首次测量的一对值）
const se = measureOnce(normalHtml);
console.log(JSON.stringify({ normal: stats(normal), defer: stats(defer), functional: { normalOk, deferOk }, scriptExecSample: se ? se.scriptExec : null }));
