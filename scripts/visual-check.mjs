import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';

let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, '');
html = html.replace(/<link href="https:\/\/fonts[^>]*>\s*/g, '');

// 注入：load 后读 loadout-card 的计算样式 + 触发一次 roll 后截图前状态
const probe = `<script>
window.addEventListener('load', function(){
  var card = document.querySelector('.loadout-card');
  var anim = card ? getComputedStyle(card).animationName : null;
  // 触发 roll，让卡片填充内容，便于视觉检查
  try { roll(); } catch(e) {}
  setTimeout(function(){
    var c2 = document.querySelector('.loadout-card');
    var cs = c2 ? getComputedStyle(c2) : null;
    var anims = c2 ? c2.getAnimations() : [];
    var a = anims[0];
    var el = document.createElement('pre');
    el.id = 'VISUAL_RESULT';
    el.textContent = JSON.stringify({
      animationName: anim,
      cardCount: document.querySelectorAll('.loadout-card').length,
      finalOpacity: cs ? cs.opacity : null,
      finalTransform: cs ? cs.transform : null,
      playState: a ? a.playState : null,
      animCurrentTime: a && a.currentTime != null ? Math.round(a.currentTime) : null
    });
    document.body.appendChild(el);
  }, 1200);
});
</script>`;
html = html.replace('</body>', probe + '\n</body>');

const tmp = path.join(root, 'visual-check.html');
fs.writeFileSync(tmp, html);
const url = pathToFileURL(tmp).href;

// dump-dom 读动画样式
let stdout = '';
try {
  stdout = execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=6000', '--dump-dom', url], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
} catch (e) { stdout = e.stdout || ''; }
const m = stdout.match(/<pre id="VISUAL_RESULT">([\s\S]*?)<\/pre>/);
console.log(m ? m[1] : 'VISUAL_RESULT_NOT_FOUND');

// 截图（roll 后的最终状态）
const shot = path.join(root, 'visual-shot-1920x1032.png');
try {
  execFileSync(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=6000', '--window-size=1920,1032', `--screenshot=${shot}`, url], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
  console.log('SHOT_SAVED ' + shot);
} catch (e) { console.log('SHOT_FAILED ' + (e.status || e.message)); }

fs.unlinkSync(tmp);
