import fs from 'node:fs';
import vm from 'node:vm';

const context = {
  console,
  Math: Object.create(Math),
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  location: { hash: '', pathname: '/', search: '' },
  history: { replaceState() {} },
  navigator: {},
  document: { querySelector: () => null, querySelectorAll: () => [] },
  setTimeout,
  clearTimeout
};
vm.createContext(context);
for (const file of ['data.js', 'equipment-details.js', 'stratagem-ratings.js', 'app.js']) {
  let source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
  if (file === 'app.js') source = source.replace('mountArchivePanels();loadState();bindEvents();init();', '');
  vm.runInContext(source, context, { filename: file });
}

const result = vm.runInContext(`(() => {
  const high = GEAR.find(g => g.type === 'stratagem');
  const low = GEAR.find(g => g.type === 'stratagem' && g.id !== high.id);
  state.missionTarget = 'terminids';
  state.weightOverrides = { terminids: { [high.id]: 100, [low.id]: 1 } };
  const counts = { high: 0, low: 0 };
  const draws = 100000;
  for (let i = 0; i < draws; i++) {
    const picked = weightedPick([high, low], 'terminids');
    counts[picked.id === high.id ? 'high' : 'low']++;
  }
  return { draws, highId: high.id, lowId: low.id, highCount: counts.high, lowCount: counts.low, ratio: counts.high / counts.low };
})()`, context);

const expectedHighShare = 100 / 101;
const observedHighShare = result.highCount / result.draws;
const pass = observedHighShare > 0.985 && observedHighShare < 0.995 && result.ratio > 65;
console.log(JSON.stringify({ ...result, expectedHighShare, observedHighShare, pass }, null, 2));
if (!pass) process.exit(1);
