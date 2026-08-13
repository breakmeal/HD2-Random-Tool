import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// 加载 data.js 到隔离上下文
const root = path.resolve(import.meta.dirname, '..');
const context = {};
vm.createContext(context);
vm.runInContext(`${fs.readFileSync(path.join(root, 'data.js'), 'utf8')};globalThis.__d={GEAR,WARBONDS};`, context);
const { GEAR, WARBONDS } = context.__d;

const wbById = Object.fromEntries(WARBONDS.map(w => [w.id, w]));

// 与 app.js 一致的新索引
const gearByWarbond = {};
for (const g of GEAR) (gearByWarbond[g.warbond] = gearByWarbond[g.warbond] || []).push(g);
const gearSearchKey = {};
for (const g of GEAR) { const w = wbById[g.warbond]; gearSearchKey[g.id] = `${g.zh} ${g.en} ${w.zh} ${w.en}`.toLowerCase(); }

function makeEnabled(disabledIds) {
  const enabled = {};
  for (const g of GEAR) enabled[g.id] = !disabledIds.has(g.id);
  return enabled;
}
const allEnabled = makeEnabled(new Set());
const disabled30 = new Set(GEAR.filter(() => Math.random() < 0.15).map(g => g.id));
const enabled30 = makeEnabled(disabled30);

// 旧逻辑（GEAR.filter 版），返回语义结果
function computeOld(f, enabled) {
  const q = f.search.trim().toLowerCase();
  const selected = f.warbond === 'all' ? null : wbById[f.warbond];
  const scope = selected ? [selected] : WARBONDS;
  const matches = (g, w) => (f.type === 'all' || g.type === f.type) && (!f.enabledOnly || enabled[g.id]) && (!q || `${g.zh} ${g.en} ${w.zh} ${w.en}`.toLowerCase().includes(q));
  const rowIds = [];
  for (const w of scope) for (const g of GEAR.filter(g => g.warbond === w.id && matches(g, w))) rowIds.push(g.id);
  const navCounts = WARBONDS.map(w => GEAR.filter(g => g.warbond === w.id).length);
  const total = scope.flatMap(w => GEAR.filter(g => g.warbond === w.id)).length;
  const activeCount = scope.flatMap(w => GEAR.filter(g => g.warbond === w.id && enabled[g.id])).length;
  return { rowIds, navCounts, total, activeCount };
}

// 新逻辑（索引版），返回语义结果
function computeNew(f, enabled) {
  const q = f.search.trim().toLowerCase();
  const selected = f.warbond === 'all' ? null : wbById[f.warbond];
  const scope = selected ? [selected] : WARBONDS;
  const matches = g => (f.type === 'all' || g.type === f.type) && (!f.enabledOnly || enabled[g.id]) && (!q || gearSearchKey[g.id].includes(q));
  const rowIds = [];
  for (const w of scope) { const items = gearByWarbond[w.id] || []; for (const g of items) if (matches(g)) rowIds.push(g.id); }
  const navCounts = WARBONDS.map(w => (gearByWarbond[w.id] || []).length);
  let total = 0, activeCount = 0;
  for (const w of scope) { const items = gearByWarbond[w.id] || []; total += items.length; for (const g of items) if (enabled[g.id]) activeCount++; }
  return { rowIds, navCounts, total, activeCount };
}

const filtersList = [
  { search: '', type: 'all', warbond: 'all', enabledOnly: false },
  { search: '轨道', type: 'all', warbond: 'all', enabledOnly: false },
  { search: 'liberator', type: 'all', warbond: 'all', enabledOnly: false },
  { search: '', type: 'stratagem', warbond: 'all', enabledOnly: false },
  { search: '', type: 'all', warbond: 'polar', enabledOnly: false },
  { search: '', type: 'all', warbond: 'all', enabledOnly: true },
  { search: '炮', type: 'stratagem', warbond: 'all', enabledOnly: true },
  { search: '支援', type: 'stratagem', warbond: 'cutting', enabledOnly: true },
];

let mismatch = 0, checked = 0;
for (const enabled of [allEnabled, enabled30]) {
  for (const f of filtersList) {
    checked++;
    const o = computeOld(f, enabled);
    const n = computeNew(f, enabled);
    const eq = JSON.stringify(o.rowIds) === JSON.stringify(n.rowIds)
      && JSON.stringify(o.navCounts) === JSON.stringify(n.navCounts)
      && o.total === n.total && o.activeCount === n.activeCount;
    if (!eq) {
      mismatch++;
      console.log('MISMATCH', JSON.stringify(f),
        'rows', o.rowIds.length, 'vs', n.rowIds.length,
        'total', o.total, 'vs', n.total,
        'active', o.activeCount, 'vs', n.activeCount);
    }
  }
}
console.log(`语义等价：${checked} 组 filters/enabled，不一致 ${mismatch} 组`);

// 性能：统计旧逻辑一次全量 renderArmory 的 GEAR.filter 调用次数，新逻辑的元素访问次数
let oldFilterCalls = 0;
{
  const f = { search: '', type: 'all', warbond: 'all', enabledOnly: false };
  const q = f.search.trim().toLowerCase();
  const scope = WARBONDS;
  const matches = (g, w) => true;
  const filter = pred => { oldFilterCalls++; return GEAR.filter(pred); };
  for (const w of scope) filter(g => g.warbond === w.id && matches(g, w));
  WARBONDS.map(w => filter(g => g.warbond === w.id).length);
  scope.flatMap(w => filter(g => g.warbond === w.id));
  scope.flatMap(w => filter(g => g.warbond === w.id && allEnabled[g.id]));
}
let newVisits = 0;
{
  const f = { search: '', type: 'all', warbond: 'all', enabledOnly: false };
  const scope = WARBONDS;
  const matches = g => { newVisits++; return (f.type === 'all' || g.type === f.type) && (!f.enabledOnly || allEnabled[g.id]); };
  for (const w of scope) { const items = gearByWarbond[w.id] || []; for (const g of items) if (matches(g)) {} }
  for (const w of scope) { const items = gearByWarbond[w.id] || []; for (const g of items) { newVisits++; if (allEnabled[g.id]) {} } }
}
console.log(`性能：旧 GEAR.filter 调用 ${oldFilterCalls} 次（每次全量 ${GEAR.length} 件）；新元素访问 ${newVisits} 次`);
