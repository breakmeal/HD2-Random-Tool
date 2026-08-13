import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

// 首屏基准（DCL + FCP + renderArmory 耗时）。
// 注意：defer 架构下 scriptExec 指标无效（body 末尾同步打点的时间不含 defer 脚本执行），已移除该字段。
// 移除 Google Fonts 联网引用，避免网络抖动污染基准
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts[^>]*>\s*/g, '');

// head 注入：FCP observer + 计时起点（在 data.js 之前）
const headInject = `<script>window.__perf={};new PerformanceObserver(function(l){for(var i=0;i<l.getEntries().length;i++){var e=l.getEntries()[i];if(e.name==='first-contentful-paint')window.__perf.fcp=e.startTime;}}).observe({type:'paint',buffered:true});</script>`;
html = html.replace('<title>超级地球 · 随机军备终端</title>', '<title>超级地球 · 随机军备终端</title>' + headInject);

// body 末尾注入：同步打点脚本执行时间，load 后收集其余指标
const benchScript = `<script>
window.__collect = function(){
  var r={};
  var nav=performance.getEntriesByType('navigation')[0];
  if(nav){r.domContentLoaded=Math.round(nav.domContentLoadedEventEnd-nav.startTime);r.loadEvent=Math.round(nav.loadEventEnd-nav.startTime);}
  r.fcp=(window.__perf&&window.__perf.fcp!=null)?Math.round(window.__perf.fcp):null;
  var N=100,t0=performance.now();
  for(var i=0;i<N;i++)renderArmory();
  var t1=performance.now();
  r.renderArmoryMs=Math.round((t1-t0)/N*1000)/1000;
  var el=document.createElement('pre');el.id='BENCH_RESULT';el.textContent=JSON.stringify(r);document.body.appendChild(el);
};
if(document.readyState==='complete'){window.__collect();}else{window.addEventListener('load',window.__collect);}
</script>`;
html = html.replace('</body>', benchScript + '\n</body>');

const tmp = path.join(root, 'bench-test.html');
fs.writeFileSync(tmp, html);

const url = pathToFileURL(tmp).href;
let stdout = '';
try {
  stdout = execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    '--dump-dom', url
  ], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
} catch (e) {
  stdout = e.stdout || '';
  console.error('edge exit error:', e.status);
}

const m = stdout.match(/<pre id="BENCH_RESULT">([\s\S]*?)<\/pre>/);
if (!m) {
  console.log('BENCH_RESULT_NOT_FOUND');
  console.log('tail:', stdout.slice(-800));
} else {
  console.log(m[1]);
}
fs.unlinkSync(tmp);
