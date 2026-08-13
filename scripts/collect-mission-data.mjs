import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

// 采集 Helldivers Wiki 的主任务数据并下载任务图标到 assets/missions/。
// 数据来源：Missions Cargo 表 + 各任务页 {{Infobox Mission}}；难度梯度来自 Difficulty 页。
// 本脚本只下载图标与输出原始字段，最终中文任务数据由 mission-data.js 手工维护。
const ROOT = path.resolve(import.meta.dirname, '..');
const API = 'https://helldivers.wiki.gg/api.php';
const WIKI = 'https://helldivers.wiki.gg/wiki/';
const UA = 'SuperEarthArmory/3.0 (local fan project; attribution in SOURCES.md)';
const OUT_DIR = path.join(ROOT, 'assets', 'missions');
const MAIN_FACTIONS = new Set(['Any', 'Terminid', 'Automaton', 'Illuminate']);

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function api(params) {
  const u = new URL(API);
  Object.entries({ action: 'query', format: 'json', formatversion: '2', ...params })
    .forEach(([k, v]) => { if (v != null) u.searchParams.set(k, String(v)); });
  const r = await fetch(u, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText}`);
  return r.json();
}
async function cargoQuery(tables, fields, where, limit = 500) {
  const u = new URL(API);
  const p = { action: 'cargoquery', format: 'json', formatversion: '2', tables, fields, limit: String(limit) };
  if (where) p.where = where;
  Object.entries(p).forEach(([k, v]) => u.searchParams.set(k, v));
  const r = await fetch(u, { headers: { 'user-agent': UA } });
  const j = await r.json();
  return (j.cargoquery || []).map(x => x.title);
}
async function raw(title) {
  const u = `${WIKI}${encodeURIComponent(title)}?action=raw`;
  const r = await fetch(u, { headers: { 'user-agent': UA } });
  if (!r.ok) return '';
  return r.text();
}
const slug = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const strip = v => String(v || '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi, '')
  .replace(/<[^>]+>/g, '')
  .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g, '$1')
  .replace(/\[\[([^\]]+)\]\]/g, '$1')
  .replace(/''+/g, '')
  .replace(/\{\{[^{}]*\}\}/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

function infoboxField(text, name) {
  const m = text.match(new RegExp(`\\|\\s*${name}\\s*=\\s*([^\\n|]*)(?:\\n|$)`));
  return m ? strip(m[1]) : '';
}

async function imageUrl(title) {
  if (!title) return null;
  const j = await api({ prop: 'imageinfo', iiprop: 'url', titles: `File:${title}` });
  const page = (j.query?.pages || [])[0];
  return page?.imageinfo?.[0]?.url || null;
}

async function download(url, file) {
  const r = await fetch(url, { headers: { 'user-agent': UA } });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  await fs.promises.writeFile(file, Buffer.from(await r.arrayBuffer()));
}

function extractObjectives(text) {
  // 取目标步骤章节：=== 或 ## 标题 + 其下 bullet 行
  const lines = text.split(/\r?\n/);
  const out = [];
  let current = null;
  for (const line of lines) {
    const h = line.match(/^={2,4}\s*(.+?)\s*={2,4}$/);
    if (h) { current = { title: strip(h[1]), steps: [] }; out.push(current); continue; }
    if (line.startsWith('*') && current) {
      const step = strip(line.replace(/^\*+/, ''));
      if (step) current.steps.push(step);
    }
  }
  return out;
}

async function main() {
  await fs.promises.mkdir(OUT_DIR, { recursive: true });
  const rows = await cargoQuery('Missions', '_pageName,faction,image,min_difficulty,max_difficulty');
  const missions = rows.filter(r => MAIN_FACTIONS.has(r.faction));
  const result = [];
  for (let i = 0; i < missions.length; i++) {
    const m = missions[i];
    const text = await raw(m._pageName);
    const briefing = (text.match(/\{\{Quote\|([\s\S]*?)\}\}/) || [])[1];
    const timeLimit = infoboxField(text, 'time_limit_main');
    const title = infoboxField(text, 'title') || m._pageName;
    const factionMap = { Any: 'any', Terminid: 'terminids', Automaton: 'automatons', Illuminate: 'illuminate' };
    const entry = {
      id: slug(m._pageName),
      pageName: m._pageName,
      en: title,
      faction: factionMap[m.faction] || m.faction.toLowerCase(),
      factionRaw: m.faction,
      minDifficulty: m['min difficulty'] || '',
      maxDifficulty: m['max difficulty'] || '',
      timeLimit,
      briefing: strip(briefing || ''),
      imageTitle: m.image || infoboxField(text, 'image_main'),
      objectives: extractObjectives(text),
    };
    // 下载图标
    let image = null;
    try {
      const url = await imageUrl(entry.imageTitle);
      if (url) {
        const ext = (new URL(url).pathname.match(/\.(svg|png|webp|jpe?g)$/i)?.[1] || 'svg').toLowerCase();
        const rel = `assets/missions/${entry.id}.${ext}`;
        await download(url, path.join(ROOT, rel));
        image = rel;
      }
    } catch (e) {
      console.warn(`image failed: ${entry.en}: ${e.message}`);
    }
    entry.image = image;
    result.push(entry);
    process.stdout.write(`\r[${i + 1}/${missions.length}] ${entry.en}`);
    await sleep(60);
  }
  process.stdout.write('\n');
  // 输出原始数据（供手工整理 mission-data.js）
  const outPath = process.argv[2];
  if (outPath) await fs.promises.writeFile(outPath, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ total: result.length, withImage: result.filter(x => x.image).length }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
