import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const API = 'https://helldivers.wiki.gg/api.php';
const UA = 'SuperEarthArmory/2.0 (local fan project; image sources in SOURCES.md)';
const RUN_ID = process.argv[2] || new Date().toISOString().slice(0, 10);
const OUTPUT_ROOT = path.join(ROOT, 'assets', 'refreshed-images', RUN_ID);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const norm = value => String(value || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9]+/g, ' ').trim();

if(!/^\d{4}-\d{2}-\d{2}(?:-[a-z0-9-]+)?$/i.test(RUN_ID)){
  throw new Error(`Invalid run id: ${RUN_ID}`);
}

async function getJson(url, retries=4){
  for(let attempt=0;attempt<retries;attempt++){
    try{
      const response=await fetch(url,{headers:{'user-agent':UA}});
      if(!response.ok){
        const retryAfter=Number(response.headers.get('retry-after'));
        const error=new Error(`${response.status} ${response.statusText}`);
        error.retryAfter=Number.isFinite(retryAfter)?retryAfter:null;
        throw error;
      }
      return await response.json();
    }catch(error){
      if(attempt===retries-1)throw error;
      const delay=error.retryAfter!=null?Math.max(error.retryAfter*1000,2500):650*(attempt+1);
      await sleep(delay);
    }
  }
}

async function api(params){
  const url=new URL(API);
  Object.entries({action:'query',format:'json',formatversion:2,...params}).forEach(([key,value])=>{
    if(value!=null)url.searchParams.set(key,String(value));
  });
  return getJson(url);
}

async function loadProjectData(){
  const context={};
  vm.createContext(context);
  const dataSource=await fs.readFile(path.join(ROOT,'data.js'),'utf8');
  const enemySource=await fs.readFile(path.join(ROOT,'enemy-data.js'),'utf8');
  vm.runInContext(`${dataSource};globalThis.__GEAR=GEAR;`,context);
  vm.runInContext(`${enemySource};globalThis.__ENEMY_DATA=ENEMY_DATA;`,context);
  return {gear:context.__GEAR,enemies:context.__ENEMY_DATA};
}

async function listFiles(directory){
  const results=[];
  async function visit(current){
    for(const entry of await fs.readdir(current,{withFileTypes:true})){
      const target=path.join(current,entry.name);
      if(entry.isDirectory())await visit(target);
      else results.push(target);
    }
  }
  await visit(directory);
  return results;
}

const MANUAL_FILE_ALIASES={
  'SMG/FLAM-34 Stoker':'File:SMGFLAM-34 Stoker Primary Render.png',
  'SG-97 Sweeper':'File:SG-97 Shotgun Primary Render.png',
  'P-69 Veto':'File:P-69 Veto Secondary Render.png',
  'StA-X3 W.A.S.P. Launcher':'File:W.A.S.P. Launcher Stratagem Icon Background.svg',
  'AX/LAS-5 Rover':'File:Rover Stratagem Icon Background.svg',
  'AX/ARC-3 K-9':'File:K-9 Stratagem Icon Background.svg',
  'TD-110 Bastion MK XVI':'File:Bastion MK XVI Stratagem Icon Background.svg'
};

function chooseEquipmentImage(item,titles,page){
  if(MANUAL_FILE_ALIASES[item.en])return {fileTitle:MANUAL_FILE_ALIASES[item.en],pageImage:null};
  let fileTitle=null;
  if(item.type==='stratagem'){
    const candidates=titles.filter(title=>/Stratagem Icon(?: Background)?\.svg$/i.test(title));
    const ranked=candidates.map(title=>({title,score:similarity(item.en,title)})).sort((a,b)=>b.score-a.score);
    fileTitle=ranked[0]?.score>=.9?ranked[0].title:null;
  }else if(item.type==='booster'){
    const candidates=titles.filter(title=>/Booster Icon\.svg$/i.test(title));
    const ranked=candidates.map(title=>({title,score:similarity(item.en,title)})).sort((a,b)=>b.score-a.score);
    fileTitle=ranked[0]?.score>=.9?ranked[0].title:null;
  }else{
    const typeLabel=item.type[0].toUpperCase()+item.type.slice(1);
    fileTitle=titles.find(title=>new RegExp(`\\b${typeLabel} Render\\.(png|webp|jpe?g)$`,'i').test(title))
      ||titles.find(title=>/\b(Primary|Secondary|Throwable|Support) Render\.(png|webp|jpe?g)$/i.test(title))
      ||titles.find(title=>/\bRender\.(png|webp|jpe?g)$/i.test(title));
  }
  return {fileTitle,pageImage:null};
}

function chooseEnemyImage(item,titles,page){
  const candidates=titles.filter(title=>/ENEMY.*(RENDER|PORTRAIT|ICON)|(?:RENDER|PORTRAIT|ICON).*ENEMY/i.test(title));
  const scored=candidates.map(title=>({title,score:similarity(item.en,title)})).sort((a,b)=>b.score-a.score);
  const fileTitle=scored[0]?.score>=.7?scored[0].title:null;
  return {fileTitle,pageImage:null};
}

async function discoverPageImage(item,kind){
  let continuation=null;
  let page=null;
  const titles=[];
  do{
    const result=await api({
      prop:'images|pageimages',
      titles:item.en,
      redirects:'1',
      imlimit:'max',
      piprop:'original|thumbnail|name',
      pithumbsize:'1280',
      ...(continuation||{})
    });
    page=result.query?.pages?.[0]||page;
    titles.push(...(result.query?.pages?.[0]?.images||[]).map(image=>image.title));
    continuation=result.continue?{continue:result.continue.continue,imcontinue:result.continue.imcontinue}:null;
  }while(continuation?.imcontinue);
  const selected=kind==='equipment'?chooseEquipmentImage(item,titles,page):chooseEnemyImage(item,titles,page);
  return {...selected,pageTitle:page?.title||item.en,requestedTitle:item.en};
}

async function mapPool(items,worker,concurrency=6){
  const results=new Array(items.length);
  let cursor=0;
  const workers=Array.from({length:concurrency},async()=>{
    while(cursor<items.length){
      const index=cursor++;
      try{results[index]=await worker(items[index],index)}
      catch(error){results[index]={error:error.message}}
      await sleep(45);
    }
  });
  await Promise.all(workers);
  return results;
}

function itemWords(value){
  return norm(value)
    .replace(/^FILE /,'')
    .replace(/ (SVG|PNG|WEBP|JPE?G)$/,'')
    .replace(/ STRATAGEM ICON( BACKGROUND)?$/,'')
    .replace(/ BOOSTER ICON$/,'')
    .replace(/ ENEMY (RENDER|PORTRAIT|ICON)$/,'')
    .replace(/ (PRIMARY|SECONDARY|THROWABLE|SUPPORT) RENDER$/,'')
    .split(' ')
    .filter(word=>word.length>1&&word!=='EXOSUIT');
}

function similarity(left,right){
  const a=itemWords(left),b=itemWords(right);
  if(!a.length||!b.length)return 0;
  const intersection=a.filter(word=>b.includes(word)).length;
  const extra=b.filter(word=>!a.includes(word)).length;
  return intersection/Math.max(a.length,1)-extra*.25;
}

async function fillEquipmentCategoryFallbacks(gear,discoveries){
  const missing=gear.map((item,index)=>({item,index,discovery:discoveries[index]})).filter(entry=>!entry.discovery?.fileTitle&&!entry.discovery?.pageImage);
  if(!missing.length)return;
  const category=await api({generator:'categorymembers',gcmtitle:'Category:Helldivers 2 - Icons',gcmtype:'file',gcmlimit:'500',prop:'imageinfo',iiprop:'url|mime|size|sha1',iiurlwidth:'1280'});
  const files=category.query?.pages||[];
  for(const {item,index} of missing){
    if(item.type==='stratagem'){
      const ranked=files.filter(file=>/Stratagem Icon Background\.svg$/i.test(file.title)).map(file=>({file,score:similarity(item.en,file.title)})).sort((a,b)=>b.score-a.score);
      if(ranked[0]?.score>=.52){
        discoveries[index].fileTitle=ranked[0].file.title;
        discoveries[index].fileInfo=categoryImageInfo(ranked[0].file);
      }
    }else if(item.type==='booster'){
      const words=norm(item.en).replace(/ BOOSTER$/,'');
      const found=files.find(file=>(norm(file.title).includes(words)||(words.includes('SAMPLE EXTRACT')&&norm(file.title).includes('SAMPLE EXTRACT')))&&/Booster Icon/i.test(file.title));
      if(found){discoveries[index].fileTitle=found.title;discoveries[index].fileInfo=categoryImageInfo(found);}
    }
  }
}

function categoryImageInfo(page){
  const info=page.imageinfo?.[0];
  return info?{url:info.thumburl||info.url,mime:info.thumbmime||info.mime,remoteBytes:info.thumbsize||info.size,remoteSha1:info.sha1||null}:null;
}

async function resolveFileInfo(discoveries){
  const titles=[...new Set(discoveries.map(item=>item?.fileTitle).filter(Boolean))];
  const infoByTitle=new Map();
  for(const discovery of discoveries){
    if(discovery?.fileTitle&&discovery.fileInfo)infoByTitle.set(norm(discovery.fileTitle),discovery.fileInfo);
  }
  const unresolvedTitles=titles.filter(title=>!infoByTitle.has(norm(title)));
  for(let index=0;index<unresolvedTitles.length;index+=40){
    const result=await api({prop:'imageinfo',iiprop:'url|mime|size|sha1',iiurlwidth:'1280',titles:unresolvedTitles.slice(index,index+40).join('|')});
    for(const page of result.query?.pages||[]){
      const info=page.imageinfo?.[0];
      if(info)infoByTitle.set(norm(page.title),{url:info.thumburl||info.url,mime:info.thumbmime||info.mime,remoteBytes:info.thumbsize||info.size,remoteSha1:info.sha1||null});
    }
  }
  return infoByTitle;
}

function inspectImage(buffer,mime=''){
  const textStart=buffer.subarray(0,256).toString('utf8').trimStart();
  if(buffer.length>=8&&buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {ext:'png',mime:'image/png'};
  if(buffer.length>=3&&buffer[0]===255&&buffer[1]===216&&buffer[2]===255)return {ext:'jpg',mime:'image/jpeg'};
  if(buffer.length>=12&&buffer.subarray(0,4).toString()==='RIFF'&&buffer.subarray(8,12).toString()==='WEBP')return {ext:'webp',mime:'image/webp'};
  if(buffer.length>=6&&/^GIF8[79]a$/.test(buffer.subarray(0,6).toString()))return {ext:'gif',mime:'image/gif'};
  if(/^(<\?xml[\s\S]*?)?<svg\b/i.test(textStart)||mime.includes('svg'))return {ext:'svg',mime:'image/svg+xml'};
  return null;
}

async function fetchImage(url,retries=3){
  for(let attempt=0;attempt<retries;attempt++){
    try{
      const response=await fetch(url,{headers:{'user-agent':UA}});
      if(!response.ok){
        const retryAfter=Number(response.headers.get('retry-after'));
        const error=new Error(`${response.status} ${response.statusText}`);
        error.retryAfter=Number.isFinite(retryAfter)?retryAfter:null;
        throw error;
      }
      const buffer=Buffer.from(await response.arrayBuffer());
      const inspected=inspectImage(buffer,response.headers.get('content-type')||'');
      if(!inspected)throw new Error('response is not a recognized image');
      if(buffer.length<256)throw new Error(`image is too small: ${buffer.length} bytes`);
      return {buffer,...inspected};
    }catch(error){
      if(attempt===retries-1)throw error;
      await sleep(error.retryAfter!=null?Math.max(error.retryAfter*1000,2500):700*(attempt+1));
    }
  }
}

async function writeWithoutReplacing(file,buffer){
  await fs.mkdir(path.dirname(file),{recursive:true});
  try{
    await fs.writeFile(file,buffer,{flag:'wx'});
    return false;
  }catch(error){
    if(error.code!=='EEXIST')throw error;
    const existing=await fs.readFile(file);
    if(!existing.equals(buffer))throw new Error(`existing file differs and was preserved: ${path.relative(ROOT,file)}`);
    return true;
  }
}

async function downloadEntry(item,kind,discovery,fileInfoByTitle){
  if(discovery?.error)return {id:item.id,status:'missing',reason:discovery.error};
  const fileInfo=discovery?.fileTitle?fileInfoByTitle.get(norm(discovery.fileTitle)):null;
  const sourceUrl=fileInfo?.url||discovery?.pageImage;
  if(!sourceUrl)return {id:item.id,status:'missing',reason:'no suitable page image found',sourcePage:discovery?.pageTitle||item.en};
  try{
    const downloaded=await fetchImage(sourceUrl);
    const category=kind==='equipment'?path.join('equipment',item.type):path.join('enemies',item.faction);
    const relative=path.join('assets','refreshed-images',RUN_ID,category,`${item.id}.${downloaded.ext}`).replaceAll('\\','/');
    const absolute=path.join(ROOT,relative);
    const resolved=path.resolve(absolute);
    if(!resolved.startsWith(path.resolve(OUTPUT_ROOT)+path.sep))throw new Error('resolved path escaped output root');
    const reused=await writeWithoutReplacing(absolute,downloaded.buffer);
    const sha256=crypto.createHash('sha256').update(downloaded.buffer).digest('hex');
    return {
      id:item.id,
      kind,
      category:kind==='equipment'?item.type:item.faction,
      zh:item.zh,
      en:item.en,
      status:'ok',
      sourcePage:`https://helldivers.wiki.gg/wiki/${encodeURIComponent(discovery?.pageTitle||item.en).replace(/%2F/g,'/')}`,
      fileTitle:discovery?.fileTitle||null,
      sourceUrl,
      localPath:relative,
      mime:downloaded.mime,
      bytes:downloaded.buffer.length,
      sha256,
      reused,
      remoteSha1:fileInfo?.remoteSha1||null
    };
  }catch(error){
    return {id:item.id,status:'missing',reason:error.message,sourcePage:discovery?.pageTitle||item.en,sourceUrl};
  }
}

async function validateManifest(entries){
  const errors=[];
  for(const entry of entries.filter(item=>item.status==='ok')){
    const file=path.join(ROOT,entry.localPath);
    const buffer=await fs.readFile(file);
    const sha256=crypto.createHash('sha256').update(buffer).digest('hex');
    if(buffer.length!==entry.bytes)errors.push(`${entry.id}: byte count changed`);
    if(sha256!==entry.sha256)errors.push(`${entry.id}: sha256 changed`);
    if(!inspectImage(buffer,entry.mime))errors.push(`${entry.id}: invalid image signature`);
    if(!path.resolve(file).startsWith(path.resolve(OUTPUT_ROOT)+path.sep))errors.push(`${entry.id}: path outside run directory`);
  }
  return errors;
}

function generatedMapSource(manifest){
  const equipment=Object.fromEntries(manifest.equipment.filter(item=>item.status==='ok').map(item=>[item.id,item.localPath]));
  const enemies=Object.fromEntries(manifest.enemies.filter(item=>item.status==='ok').map(item=>[`${item.category}:${item.id}`,item.localPath]));
  const payload={runId:manifest.runId,generatedAt:manifest.generatedAt,equipment,enemies};
  return `/* Generated by scripts/refresh-images.mjs. Existing image files are preserved. */\nconst REFRESHED_IMAGES = ${JSON.stringify(payload,null,2)};\nObject.entries(REFRESHED_IMAGES.equipment).forEach(([id,image])=>{if(EQUIPMENT_DETAILS[id])EQUIPMENT_DETAILS[id].image=image});\nENEMY_DATA.forEach(enemy=>{const image=REFRESHED_IMAGES.enemies[\`${'${enemy.faction}:${enemy.id}'}\`];if(image)enemy.image=image});\n`;
}

const {gear,enemies}=await loadProjectData();
const originalEquipmentFiles=(await listFiles(path.join(ROOT,'assets','equipment'))).filter(file=>path.extname(file).toLowerCase()!=='.txt');
await fs.mkdir(OUTPUT_ROOT,{recursive:true});
const previousManifestFile=path.join(OUTPUT_ROOT,'manifest.json');
let previousManifest=null;
try{previousManifest=JSON.parse(await fs.readFile(previousManifestFile,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;}
const previousEquipment=new Map((previousManifest?.equipment||[]).filter(item=>item.status==='ok').map(item=>[item.id,item]));
const previousEnemies=new Map((previousManifest?.enemies||[]).filter(item=>item.status==='ok').map(item=>[item.id,item]));
const pendingGear=gear.filter(item=>!previousEquipment.has(item.id));
const pendingEnemies=enemies.filter(item=>!previousEnemies.has(item.id));

console.log(`Discovering ${pendingGear.length} equipment page images...`);
const equipmentDiscoveries=await mapPool(pendingGear,item=>discoverPageImage(item,'equipment'),2);
await fillEquipmentCategoryFallbacks(pendingGear,equipmentDiscoveries);
console.log(`Discovering ${pendingEnemies.length} enemy page images...`);
const enemyDiscoveries=await mapPool(pendingEnemies,item=>discoverPageImage(item,'enemy'),2);
const allDiscoveries=[...equipmentDiscoveries,...enemyDiscoveries];
const fileInfoByTitle=await resolveFileInfo(allDiscoveries);

console.log('Downloading verified image responses without replacing existing files...');
const pendingEquipmentResults=await mapPool(pendingGear,(item,index)=>downloadEntry(item,'equipment',equipmentDiscoveries[index],fileInfoByTitle),2);
const pendingEnemyResults=await mapPool(pendingEnemies,(item,index)=>downloadEntry(item,'enemy',enemyDiscoveries[index],fileInfoByTitle),2);
const equipmentResultById=new Map(pendingEquipmentResults.map(item=>[item.id,item]));
const enemyResultById=new Map(pendingEnemyResults.map(item=>[item.id,item]));
const equipmentResults=gear.map(item=>previousEquipment.get(item.id)||equipmentResultById.get(item.id)||{id:item.id,status:'missing',reason:'no result'});
const enemyResults=enemies.map(item=>previousEnemies.get(item.id)||enemyResultById.get(item.id)||{id:item.id,status:'missing',reason:'no result'});
const generatedAt=new Date().toISOString();
const manifest={
  runId:RUN_ID,
  generatedAt,
  policy:{deleteExistingImages:false,replaceExistingImages:false,outputRoot:path.relative(ROOT,OUTPUT_ROOT).replaceAll('\\','/')},
  baseline:{existingEquipmentImages:originalEquipmentFiles.length,equipmentItems:gear.length,enemyItems:enemies.length},
  equipment:equipmentResults,
  enemies:enemyResults
};
const validationErrors=await validateManifest([...equipmentResults,...enemyResults]);
const equipmentFilesAfter=(await listFiles(path.join(ROOT,'assets','equipment'))).filter(file=>path.extname(file).toLowerCase()!=='.txt');
if(equipmentFilesAfter.length<originalEquipmentFiles.length)validationErrors.push('existing equipment image count decreased');
manifest.validation={errors:validationErrors,existingEquipmentImagesAfter:equipmentFilesAfter.length};

await fs.writeFile(path.join(OUTPUT_ROOT,'manifest.json'),JSON.stringify(manifest,null,2));
await fs.writeFile(path.join(ROOT,'refreshed-images.js'),generatedMapSource(manifest));

const summarize=entries=>({total:entries.length,downloaded:entries.filter(item=>item.status==='ok').length,missing:entries.filter(item=>item.status!=='ok').length,reused:entries.filter(item=>item.reused).length,bytes:entries.filter(item=>item.status==='ok').reduce((total,item)=>total+item.bytes,0)});
const summary={runId:RUN_ID,equipment:summarize(equipmentResults),enemies:summarize(enemyResults),existingEquipmentImagesBefore:originalEquipmentFiles.length,existingEquipmentImagesAfter:equipmentFilesAfter.length,validationErrors};
console.log(JSON.stringify(summary,null,2));
if(validationErrors.length||summary.equipment.missing||summary.enemies.missing)process.exitCode=1;
