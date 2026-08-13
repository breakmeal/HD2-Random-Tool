import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const context={};vm.createContext(context);
vm.runInContext(`${fs.readFileSync(path.join(root,'data.js'),'utf8')};globalThis.gear=GEAR;`,context);
vm.runInContext(`${fs.readFileSync(path.join(root,'equipment-details.js'),'utf8')};globalThis.details=EQUIPMENT_DETAILS;`,context);
const gear=context.gear,details=context.details,errors=[];
const ids=new Set();
for(const g of gear){
  if(ids.has(g.id))errors.push(`duplicate id: ${g.id}`);ids.add(g.id);
  if(!details[g.id])errors.push(`missing detail: ${g.en}`);
  else if(!details[g.id].image||!fs.existsSync(path.join(root,details[g.id].image)))errors.push(`missing image: ${g.en}`);
}
for(const id of Object.keys(details))if(!ids.has(id))errors.push(`orphan detail: ${id}`);
const summary={gear:gear.length,images:gear.filter(g=>details[g.id]?.image).length,verified:gear.filter(g=>details[g.id]?.verified).length,attacks:gear.reduce((n,g)=>n+(details[g.id]?.attacks?.length||0),0),errors};
console.log(JSON.stringify(summary,null,2));
if(errors.length)process.exitCode=1;
