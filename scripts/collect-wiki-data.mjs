import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const API = 'https://helldivers.wiki.gg/api.php';
const RAW = 'https://helldivers.wiki.gg/wiki/';
const UA = 'SuperEarthArmory/1.0 (local fan project; data attribution in README)';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const norm = s => String(s || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9]+/g, ' ').trim();

async function getJson(url, retries=3){
  for(let i=0;i<retries;i++){
    try{
      const res=await fetch(url,{headers:{'user-agent':UA}});
      if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    }catch(e){if(i===retries-1)throw e;await sleep(800*(i+1))}
  }
}
async function download(url,file){
  const res=await fetch(url,{headers:{'user-agent':UA}});
  if(!res.ok)throw new Error(`${res.status} ${url}`);
  await fs.mkdir(path.dirname(file),{recursive:true});
  await fs.writeFile(file,Buffer.from(await res.arrayBuffer()));
}
async function rawJson(title){return getJson(`${RAW}${encodeURIComponent(title).replace(/%2F/g,'/')}?action=raw`)}
async function api(params){const u=new URL(API);Object.entries({action:'query',format:'json',formatversion:2,...params}).forEach(([k,v])=>u.searchParams.set(k,v));return getJson(u)}

const dataSource=await fs.readFile(path.join(ROOT,'data.js'),'utf8');
const context={};vm.createContext(context);vm.runInContext(`${dataSource};globalThis.__GEAR=GEAR;globalThis.__WARBONDS=WARBONDS;`,context);
const gear=context.__GEAR;

console.log('Downloading structured damage datasets…');
const [legacy,weaponsRaw,stratagemsRaw,statusRaw,newGearRaw]=await Promise.all([
  rawJson('Module:Decodedata-Weapons/data.json'),
  rawJson('Module:Decodedata-Attacks/weapons_data.json'),
  rawJson('Module:Decodedata-Attacks/stratagems_data.json'),
  rawJson('Module:Decodedata-Attacks/status_data.json'),
  rawJson('Module:Decodedata-Attacks/new_gear.json').catch(()=>({}))
]);

const mergeSections=(...sets)=>{
  const out={damage:{},explosion:{},projectile:{},beam:{},arc:{},spray:{},weapons:{},stratagems:{}};
  for(const set of sets)for(const key of Object.keys(out))Object.assign(out[key],set?.[key]||{});
  return out;
};
const attackData=mergeSections(weaponsRaw,stratagemsRaw,statusRaw,newGearRaw);
const legacyMap=Object.fromEntries(legacy.filter(x=>x.fullname).map(x=>[norm(x.fullname),x]));
const weaponEntries=Object.entries(attackData.weapons);
const stratagemEntries=Object.entries(attackData.stratagems);

function codeOf(s){return norm(s).split(' ')[0]||''}
function semanticWords(s){
  const codeWords=new Set(['A','AX','MLS','LAS','FAF','EAT','B','FLAM','MGX','LIFT','EXO','CQC','TD']);
  return norm(s).split(' ').filter(x=>x.length>2&&!/\d/.test(x)&&!codeWords.has(x)&&!['ORBITAL','EAGLE','STRATAGEM'].includes(x));
}
function findWeapon(g){
  const n=norm(g.en),code=codeOf(g.en);
  const exact=weaponEntries.find(([k,v])=>norm(k)===n||norm(v.name)===n);
  if(exact)return exact[1];
  if(code.length>=3){
    const byId=weaponEntries.filter(([k,v])=>norm(v.id)===code||codeOf(k)===code);
    if(byId.length===1)return byId[0][1];
  }
  const words=n.split(' ').filter(x=>x.length>2&&!/^\d+$/.test(x));
  let best=null,score=0;
  for(const [k,v] of weaponEntries){const vn=norm(v.name||k);const hit=words.filter(w=>vn.includes(w)).length/Math.max(words.length,1);if(hit>score){score=hit;best=v}}
  return score>=.74?best:null;
}
function findStratagem(g){
  if(g.type!=='stratagem')return null;
  const n=norm(g.en),code=codeOf(g.en);
  const exact=stratagemEntries.find(([k,v])=>norm(k)===n||norm(v.name)===n);
  if(exact)return exact[1];
  if(code.length>=3){
    const byId=stratagemEntries.filter(([k,v])=>norm(v.id)===code||codeOf(k)===code||norm(v.loadout_wep).startsWith(`${code} `));
    if(byId.length===1)return byId[0][1];
  }
  const words=semanticWords(g.en);
  let best=null,score=0;
  for(const [k,v] of stratagemEntries){const other=semanticWords(v.name||k);const intersection=words.filter(w=>other.includes(w)).length;const hit=intersection/Math.max(Math.min(words.length,other.length),1);if(hit>score){score=hit;best=v}}
  return score>=.72?best:null;
}
function damageFor(id){return attackData.damage[id]||attackData.damage[`${id}_dm`]||null}
function compactDamage(d){return d?{standard:d.dmg??null,durable:d.dmg2??null,penetration:d.ap1??null,penetrationAngle:[d.ap2,d.ap3,d.ap4].filter(v=>v!=null),demolition:d.demo??null,stagger:d.stun??null,push:d.push??null,element:d.element_name_sub||d.element_name||null}:null}
function resolveAttack(a){
  if(a.type==='projectile'){
    const p=attackData.projectile[a.name];const d=damageFor(p?.damage_id||a.name);
    return {name:a.name,kind:'projectile',damage:compactDamage(d),projectile:p?{pellets:p.pellets??1,velocity:p.velocity??null,caliber:p.caliber??null}:null};
  }
  if(a.type==='explosion'){
    const x=attackData.explosion[a.name];const d=damageFor(x?.damage_id||a.name);
    return {name:a.name,kind:'explosion',damage:compactDamage(d),radius:x?{inner:x.r1??null,outer:x.r2??null,max:x.r3??null}:null};
  }
  if(a.type==='beam'){
    const b=attackData.beam[a.name];return {name:a.name,kind:'beam',damage:compactDamage(damageFor(b?.damage_id||a.name)),range:b?.range??null};
  }
  if(a.type==='arc'){
    const arc=attackData.arc[a.name];return {name:a.name,kind:'arc',damage:compactDamage(damageFor(arc?.damage_id||a.name)),range:arc?.range??null,chains:arc?.splits??null};
  }
  if(a.type==='spray'){
    const spray=attackData.spray[a.name];return {name:a.name,kind:'spray',damage:compactDamage(damageFor(spray?.damage_id||a.name)),range:spray?.range??null};
  }
  if(a.type==='status'){
    const keys=[`${a.name}_dmg`,`${a.name}_dm`,a.name];const d=keys.map(damageFor).find(Boolean);
    return {name:a.name,kind:'status',damage:compactDamage(d)};
  }
  return {name:a.name,kind:a.type||'other'};
}
function finiteOrNull(value){return value==null||value===''||Number(value)===4294967295?null:Number(value)}
const OFFICIAL_DESCRIPTION_FALLBACKS={
  'LAS-58 Talon':{source:'armory',text:'An accurate, hard-hitting laser revolver with bespoke break action for heat sink swaps.'},
  'P-33 Missile Pistol':{source:'armory',text:"A pistol firing guided, jet-propelled ammunition. Its lock-on feature ensures high accuracy, but the weapon must be reloaded after every round fired."},
  'Flexible Reinforcement Budget':{source:'armory',text:"Reduce time until new reinforcements are granted once they've been depleted."},
  'CQC-73 Entrenchment Tool':{source:'playstation-blog',text:'The CQC-73 Entrenchment Tool is available for the regular loadout as a secondary weapon.'},
  'B/FLAM-80 Cremator':{source:'playstation-blog',text:'A heavy support flamethrower that sprays a continuous column of flame, fed by its massive backpack fuel tank.'},
  'MGX-42 Bullet Storm':{source:'playstation-blog',text:'A disposable multi-barrel machine gun using caseless ammunition. Each call-in provides two weapons that can be discarded when empty.'}
};
function buildDetails(g,pageText=''){
  const stratagem=findStratagem(g);
  const stratagemStats=parseStratagemStats(pageText);
  const weapon=findWeapon(g)||((stratagem?.loadout_wep&&weaponEntries.find(([k,v])=>norm(k)===norm(stratagem.loadout_wep)||norm(v.name)===norm(stratagem.loadout_wep))?.[1])||null);
  const old=legacyMap[norm(g.en)];
  const sourceAttacks=[...(weapon?.attacks||[]),...(stratagem?.attacks||[])];
  const seen=new Set();
  const attacks=sourceAttacks.map(resolveAttack).filter(a=>{
    const key=`${a.kind}:${a.name}`;
    if(seen.has(key))return false;
    seen.add(key);return a.damage||a.radius||a.kind==='status';
  });
  if(!attacks.length&&old){
    attacks.push({name:g.en,kind:'projectile',damage:{standard:old.damage??null,durable:old.durable??null,penetration:old.ap??null,demolition:old.demo??null,stagger:old.stun??null,push:old.push??null}});
    if(old.xdamage!=null&&old.xdamage!==0)attacks.push({name:`${g.en} explosion`,kind:'explosion',damage:{standard:old.xdamage,durable:old.xdurable??null,penetration:old.xap??null,demolition:old.xdemo??null,stagger:old.xstun??null,push:old.xpush??null}});
  }
  const pageDescription=extractOfficialDescription(pageText);
  const fallback=OFFICIAL_DESCRIPTION_FALLBACKS[g.en];
  const officialDescription=stratagem?.description||pageDescription||fallback?.text||null;
  const shieldSource=[weapon,stratagem].find(x=>x?.shield!=null);
  const operational=!!(stratagem||shieldSource||officialDescription);
  return {
    officialDescription,
    descriptionSource:stratagem?.description||pageDescription?'armory':fallback?.source||null,
    capacity:weapon?.cap??old?.cap??old?.rounds??null,
    magazines:weapon?.mags??old?.mags??null,
    rpm:weapon?.rpm??old?.rpm??null,
    recoil:old?.recoil??null,
    ergonomics:weapon?.ergonomics??null,
    fireModes:weapon?.fire_modes??null,
    deployment:stratagem?{
      callTime:finiteOrNull(stratagemStats.call_time),
      callTimeUpgraded:finiteOrNull(stratagemStats.call_time_upgraded),
      cooldown:finiteOrNull(stratagem.cooldown??stratagemStats.cooldown),
      rearmTime:finiteOrNull(stratagemStats.rearm_time),
      uses:Number(stratagem.uses)===4294967295?'∞':stratagem.uses??stratagemStats.uses??null,
      health:finiteOrNull(stratagem.health??stratagemStats.sentry_health),
      armor:finiteOrNull(stratagem.armor),
      lifetime:finiteOrNull(stratagem.lifetime),
      bombs:finiteOrNull(stratagem.num_bombs),
      salvos:finiteOrNull(stratagem.num_salvos),
      sentryRpm:finiteOrNull(stratagemStats.sentry_rpm),
      sentryAmmo:finiteOrNull(stratagemStats.sentry_ammo),
      sentryTurnRate:finiteOrNull(stratagemStats.sentry_turn_rate)
    }:null,
    shield:shieldSource?{
      capacity:finiteOrNull(shieldSource.shield),
      radius:finiteOrNull(shieldSource.shieldradius),
      rechargeDelay:finiteOrNull(shieldSource.shielddelay),
      brokenRechargeDelay:finiteOrNull(shieldSource.shieldbreakdelay),
      regeneration:finiteOrNull(shieldSource.shieldregen)
    }:null,
    attacks,
    verified:!!(weapon||old),
    operational
  };
}

function stripWiki(value){
  return String(value||'')
    .replace(/<!--[\s\S]*?-->/g,'')
    .replace(/<ref\b[^>]*>[\s\S]*?<\/ref>/gi,'')
    .replace(/<[^>]+>/g,'')
    .replace(/\[\[[^\]|]+\|([^\]]+)\]\]/g,'$1')
    .replace(/\[\[([^\]]+)\]\]/g,'$1')
    .replace(/''+/g,'')
    .replace(/\{\{(?:sic|nowrap|small)\|([^{}]+)\}\}/gi,'$1')
    .replace(/\{\{[^{}]*\}\}/g,'')
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/\s+/g,' ')
    .trim();
}
function extractOfficialDescription(wikitext){
  for(const match of wikitext.matchAll(/\{\{Quote\|([\s\S]*?)\}\}/gi)){
    if(!/\bdescription\b/i.test(match[1]))continue;
    const body=match[1].replace(/\|(?:\[\[[^\]]+\]\]\s*)?[^|{}]*description\s*$/i,'');
    const quote=stripWiki(body);if(quote)return quote;
  }
  return null;
}

function parseStratagemStats(wikitext){
  const start=wikitext.search(/\{\{Stratagem Stats Table\b/i);if(start<0)return {};
  const end=wikitext.indexOf('\n}}',start);const block=wikitext.slice(start,end<0?start+5000:end);
  const result={};
  for(const line of block.split(/\r?\n/)){
    const m=line.match(/^\s*\|\s*([a-z_]+)\s*=\s*(.*?)\s*$/i);if(m)result[m[1].toLowerCase()]=stripWiki(m[2]);
  }
  return result;
}

console.log('Discovering images from equipment pages…');
const imageCandidates=new Map();
const pageTexts=new Map();
for(let i=0;i<gear.length;i+=20){
  const batch=gear.slice(i,i+20);const result=await api({prop:'images|revisions',imlimit:'500',rvprop:'content',rvslots:'main',redirects:'1',titles:batch.map(g=>g.en).join('|')});
  for(const page of result.query?.pages||[]){
    const pageNorm=norm(page.title);let g=batch.find(x=>norm(x.en)===pageNorm);
    if(!g){const code=codeOf(page.title);g=batch.find(x=>code.length>=3&&codeOf(x.en)===code)}
    if(!g)continue;
    const pageText=page.revisions?.[0]?.slots?.main?.content;
    if(pageText)pageTexts.set(g.id,pageText);
    const titles=(page.images||[]).map(x=>x.title).filter(x=>!x.includes('Background'));
    let selected;
    if(g.type==='stratagem')selected=titles.find(x=>/Stratagem Icon\.svg$/i.test(x));
    else if(g.type==='booster')selected=titles.find(x=>/Booster Icon\.svg$/i.test(x));
    else selected=titles.find(x=>/\b(Primary|Secondary|Throwable) Render\.(png|webp)$/i.test(x))||titles.find(x=>/\bRender\.(png|webp)$/i.test(x));
    if(selected)imageCandidates.set(g.id,selected);
  }
  await sleep(80);
}

// The icon category reliably contains boosters and is useful when a booster page lacks an image list.
const category=await api({generator:'categorymembers',gcmtitle:'Category:Helldivers 2 - Icons',gcmtype:'file',gcmlimit:'500',prop:'imageinfo',iiprop:'url'});
const categoryFiles=(category.query?.pages||[]).filter(p=>p.imageinfo?.[0]?.url);
const manualFileAliases={
  'SMG/FLAM-34 Stoker':'File:SMGFLAM-34 Stoker Primary Render.png',
  'SG-97 Sweeper':'File:SG-97 Shotgun Primary Render.png',
  'P-69 Veto':'File:P-69 Veto Secondary Render.png',
  'StA-X3 W.A.S.P. Launcher':'File:W.A.S.P. Launcher Stratagem Icon Background.svg',
  'AX/LAS-5 Rover':'File:Rover Stratagem Icon Background.svg',
  'AX/ARC-3 K-9':'File:K-9 Stratagem Icon Background.svg',
  'TD-110 Bastion MK XVI':'File:Bastion MK XVI Stratagem Icon Background.svg'
};
for(const g of gear)if(manualFileAliases[g.en])imageCandidates.set(g.id,manualFileAliases[g.en]);
function itemWords(s){
  return norm(s).replace(/^FILE /,'').replace(/ STRATAGEM ICON( BACKGROUND)? SVG$/,'').split(' ').filter(w=>w.length>1&&!/^\d/.test(w)&&!['EXOSUIT'].includes(w));
}
function similarity(a,b){
  const aa=itemWords(a),bb=itemWords(b);if(!aa.length||!bb.length)return 0;
  const intersection=aa.filter(x=>bb.includes(x)).length;
  return (2*intersection)/(aa.length+bb.length);
}
for(const g of gear.filter(x=>x.type==='stratagem'&&!imageCandidates.has(x.id))){
  const files=categoryFiles.filter(p=>/Stratagem Icon Background\.svg$/i.test(p.title));
  const ranked=files.map(p=>({p,score:similarity(g.en,p.title)})).sort((a,b)=>b.score-a.score);
  if(ranked[0]?.score>=.52)imageCandidates.set(g.id,ranked[0].p.title);
}
for(const g of gear.filter(x=>x.type==='booster'&&!imageCandidates.has(x.id))){
  const words=norm(g.en).replace(/ BOOSTER$/,'');
  const found=categoryFiles.find(p=>(norm(p.title).includes(words)||(words.includes('SAMPLE EXTRACT')&&norm(p.title).includes('SAMPLE EXTRACT')))&&/Booster Icon/i.test(p.title));if(found)imageCandidates.set(g.id,found.title);
}

// Pages with large navigation templates require image-list continuation. Query the small
// set still missing one by one so that each actual render remains visible in the first page.
for(const g of gear.filter(x=>x.type!=='stratagem'&&!imageCandidates.has(x.id))){
  const result=await api({prop:'images',imlimit:'500',redirects:'1',titles:g.en});
  const titles=(result.query?.pages?.[0]?.images||[]).map(x=>x.title).filter(x=>!x.includes('Background'));
  const selected=g.type==='booster'
    ? titles.find(x=>/Booster Icon\.svg$/i.test(x))
    : titles.find(x=>/\b(Primary|Secondary|Throwable|Support) Render\.(png|webp)$/i.test(x))||titles.find(x=>/\bRender\.(png|webp)$/i.test(x));
  if(selected)imageCandidates.set(g.id,selected);
  await sleep(60);
}

const uniqueTitles=[...new Set(imageCandidates.values())];const titleToUrl=new Map();
for(let i=0;i<uniqueTitles.length;i+=40){
  const result=await api({prop:'imageinfo',iiprop:'url',titles:uniqueTitles.slice(i,i+40).join('|')});
  for(const p of result.query?.pages||[])if(p.imageinfo?.[0]?.url)titleToUrl.set(p.title,p.imageinfo[0].url);
}

console.log(`Downloading ${titleToUrl.size} discovered equipment images…`);
const imageMap={};let cursor=0;
const workers=Array.from({length:8},async()=>{
  while(cursor<gear.length){
    const g=gear[cursor++],title=imageCandidates.get(g.id),url=titleToUrl.get(title);if(!url)continue;
    const ext=(new URL(url).pathname.match(/\.(svg|png|webp|jpe?g)$/i)?.[1]||'png').toLowerCase();
    const rel=`assets/equipment/${g.type}/${g.id}.${ext}`;try{await download(url,path.join(ROOT,rel));imageMap[g.id]=rel.replaceAll('\\','/')}catch(e){console.warn(`image failed: ${g.en}: ${e.message}`)}
  }
});
await Promise.all(workers);

const details=Object.fromEntries(gear.map(g=>[g.id,{...buildDetails(g,pageTexts.get(g.id)||''),image:imageMap[g.id]||null}]));
const output=`/* Generated from helldivers.wiki.gg on ${new Date().toISOString()}. See README for attribution. */\nconst EQUIPMENT_DETAILS = ${JSON.stringify(details,null,2)};\n`;
await fs.writeFile(path.join(ROOT,'equipment-details.js'),output);
const missingImages=gear.filter(g=>!imageMap[g.id]).map(g=>`${g.type}|${g.en}`);
const verified=gear.filter(g=>details[g.id].verified).length;
await fs.writeFile(path.join(ROOT,'assets','equipment','missing-images.txt'),missingImages.join('\n'));
console.log(JSON.stringify({gear:gear.length,images:Object.keys(imageMap).length,missingImages:missingImages.length,verifiedDetails:verified},null,2));
