import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(import.meta.dirname, '..');
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8')
  .replace(/<link rel="preconnect"[^>]*>\s*/g, '')
  .replace(/<link href="https:\/\/fonts[^>]*>\s*/g, '');

const probe = `<style>.archive-overlay{transition:none!important}.archive-drawer>.panel.active{animation:none!important}</style>
<script>
document.addEventListener('DOMContentLoaded', async function(){
  const out = {};
  try {
    activatePanel('codex');
    await new Promise(resolve => setTimeout(resolve, 300));

    // 1) 图片溢出实测（DOM 边界，而非 CSS 规则存在性）
    const measure = (selector) => {
      const img = document.querySelector(selector);
      if (!img) return null;
      const box = img.parentElement.getBoundingClientRect();
      const r = img.getBoundingClientRect();
      return {
        overflowX: r.left < box.left - 0.5 || r.right > box.right + 0.5,
        overflowY: r.top < box.top - 0.5 || r.bottom > box.bottom + 0.5,
        w: Math.round(r.width), h: Math.round(r.height),
        boxW: Math.round(box.width), boxH: Math.round(box.height)
      };
    };
    state.codex.type = 'throwable'; renderCodex();
    out.throwable = measure('.codex-card[data-type="throwable"] .codex-image img');
    state.codex.type = 'red-orbital'; renderCodex();
    out.stratagem = measure('.codex-card[data-type="stratagem"] .codex-image img');
    state.codex.type = 'all';
    state.codex.selected = 'primary-r-36-eruptor';
    renderCodex();
    const firstAttack = document.querySelector('#codexInlineDetail .attack');
    out.attackHeading = firstAttack?.querySelector('.attack-head > b')?.textContent || null;
    out.attackCode = firstAttack?.querySelector('.attack-code')?.textContent || null;
    out.attackCodeFontSize = firstAttack ? getComputedStyle(firstAttack.querySelector('.attack-code')).fontSize : null;
    state.codex.selected = null;

    // 2) roll 时间序列观测
    const realRender = renderLoadout;
    const realSlot = renderLoadoutSlot;
    const realWait = wait;
    let fullRenders = 0;
    let slotUpdates = [];
    const delays = [];
    let sweepSnapshots = [];
    renderLoadout = function(...args) { fullRenders++; return realRender(...args); };
    renderLoadoutSlot = function(index, item, locked, justLocked) {
      slotUpdates.push({ index, locked, justLocked });
      return realSlot(index, item, locked, justLocked);
    };
    wait = async function(ms) {
      delays.push(ms);
      if (ms === 1100) {
        const grid = document.getElementById('loadoutGrid');
        sweepSnapshots.push({
          sweeping: grid.classList.contains('sweeping'),
          cardEmphasis: document.querySelectorAll('.loadout-card.fluid-emphasis').length,
          overlayAnimation: getComputedStyle(grid, '::after').animationName
        });
      }
    };

    await roll();
    out.fullRenders = fullRenders;
    const lockEvents = slotUpdates.filter(u => u.justLocked);
    out.lockOrder = lockEvents.map(u => u.index);
    const lastLock = lockEvents[lockEvents.length - 1];
    out.updatesAfterLastLock = lastLock ? slotUpdates.length - slotUpdates.lastIndexOf(lastLock) - 1 : -1;
    out.delayCount = delays.length;
    out.sweepCount = sweepSnapshots.length;
    out.sweepWasGridLevel = sweepSnapshots[0]?.sweeping || false;
    out.cardsWithDiscreteEmphasis = Math.max(0, ...sweepSnapshots.map(item => item.cardEmphasis));
    out.sweepAnimation = sweepSnapshots[0]?.overlayAnimation || null;
    out.buttonEnabled = !document.getElementById('rollBtn').disabled;
    out.finalCards = document.querySelectorAll('.loadout-card').length;
    out.completeClass = document.getElementById('loadoutGrid').classList.contains('roll-complete');
    out.finalAnimation = getComputedStyle(document.querySelector('.loadout-card')).animationName;

    // 3) 无强化剂场景
    slotUpdates = [];
    delays.length = 0;
    sweepSnapshots = [];
    state.options.includeBooster = false;
    await roll();
    out.noBoosterLockOrder = slotUpdates.filter(u => u.justLocked).map(u => u.index);
    out.noBoosterSweepCount = sweepSnapshots.length;
    out.noBoosterLabel = document.querySelector('.loadout-card[data-index="04"] .gear-cn')?.textContent;
    wait = realWait;
    renderLoadout = realRender;
    renderLoadoutSlot = realSlot;
  } catch (error) { out.error = error.name + ': ' + error.message; }
  const result = document.createElement('pre');
  result.id = 'VERIFY_RESULT';
  result.textContent = JSON.stringify(out);
  document.body.appendChild(result);
});
</script>`;
html = html.replace('</body>', probe + '\n</body>');
const temp = path.join(root, 'verify-codex-images-and-roll.html');
fs.writeFileSync(temp, html);
let stdout = '';
try {
  stdout = execFileSync(edge, ['--headless=new', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=5000', '--dump-dom', pathToFileURL(temp).href], { encoding: 'utf8', timeout: 60000, stdio: ['ignore', 'pipe', 'ignore'] });
} finally {
  fs.rmSync(temp, { force: true });
}
const match = stdout.match(/<pre id="VERIFY_RESULT">([\s\S]*?)<\/pre>/);
if (!match) throw new Error('VERIFY_RESULT_NOT_FOUND');
const result = JSON.parse(match[1].replaceAll('&quot;', '"').replaceAll('&amp;', '&'));
if (result.error) throw new Error(result.error);
const expectedOrder = [0, 1, 2, 3, 4, 5, 6, 7];
const expectedNoBooster = [0, 1, 2, 4, 5, 6, 7];
const pass =
  result.throwable && !result.throwable.overflowX && !result.throwable.overflowY &&
  result.stratagem && !result.stratagem.overflowX && !result.stratagem.overflowY &&
  result.attackHeading === '弹丸直击' &&
  result.attackCode === '15x100mm HIGH EXPLOSIVE_P' &&
  result.attackCodeFontSize === '9px' &&
  result.fullRenders === 10 &&
  JSON.stringify(result.lockOrder) === JSON.stringify(expectedOrder) &&
  result.updatesAfterLastLock === 0 &&
  result.delayCount === 19 &&
  result.sweepCount === 1 &&
  result.sweepWasGridLevel &&
  result.cardsWithDiscreteEmphasis === 0 &&
  result.sweepAnimation === 'loadout-diagonal-sweep' &&
  result.buttonEnabled &&
  result.finalCards === 8 &&
  result.completeClass &&
  result.finalAnimation === 'none' &&
  JSON.stringify(result.noBoosterLockOrder) === JSON.stringify(expectedNoBooster) &&
  result.noBoosterSweepCount === 1 &&
  result.noBoosterLabel === '本轮不抽取';
console.log(JSON.stringify({ ...result, pass }, null, 2));
if (!pass) process.exit(1);
