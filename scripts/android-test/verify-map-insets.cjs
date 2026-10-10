// Inspect real native control bounds against Android's visible system bars.
// Run on the emulator only, with a stable map/modal; records reproducible JSON.
const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const adb=path.join(process.env.ANDROID_HOME||'C:/Users/W11/AMetro/sdk','platform-tools/adb.exe');
const run=args=>execFileSync(adb,['-s','emulator-5556',...args],{encoding:'utf8'});
const dir=process.env.MAPA_EVIDENCE_DIR||'C:/Users/W11/AMetro/evidencias/mapa-fix';
fs.mkdirSync(dir,{recursive:true});
const name=process.argv[2],kind=process.argv[3]||'map';
let fresh='';for(let attempt=0;attempt<3;attempt++){fresh=run(['shell','uiautomator','dump','/sdcard/metro-ui.xml']);if(fresh.includes('dumped to:'))break;}if(!fresh.includes('dumped to:'))throw Error('No fresh native UI dump');
const xml=run(['shell','cat','/sdcard/metro-ui.xml']),windows=run(['shell','dumpsys','window']);
const bars=[...windows.matchAll(/InsetsSource id=\S+ type=(navigationBars|statusBars|ime) frame=\[(\d+),(\d+)\]\[(\d+),(\d+)\] (?:visibleFrame=\[\d+,\d+\]\[\d+,\d+\] )?visible=true/g)].map(m=>({type:m[1],bounds:m.slice(2).map(Number)}));
const uniqueBars=[...new Map(bars.map(b=>[JSON.stringify(b),b])).values()].filter(b=>b.bounds[2]>b.bounds[0]&&b.bounds[3]>b.bounds[1]);
if(!uniqueBars.some(b=>b.type==='navigationBars'))throw Error('Missing native navigation-bar measurement');
const nodes=[...xml.matchAll(/<node\b[^>]*>/g)].map(m=>Object.fromEntries([...m[0].matchAll(/([\w-]+)="([^"]*)"/g)].map(a=>[a[1],a[2]])));
const expected=kind==='map'?['Volver','Borrar origen y destino','Intercambiar origen y destino','Cambiar origen en el mapa','Cambiar destino en el mapa','Consultar','Guardar trayecto como favorito','Ampliar mapa','Alejar mapa','Ver mapa completo']:kind==='save'?['Volver','Alias opcional','Guardar favorito']:kind==='results'?['Volver','Refrescar']:kind==='save-action'?['Volver','Guardar favorito']:['Volver','Buscar estación'];
const density=Number(run(['shell','wm','density']).match(/(?:Override|Physical) density: (\d+)/g).at(-1).match(/\d+/)[0]);
const controls=expected.map(label=>{
 const node=nodes.find(n=>n['content-desc']===label)||nodes.find(n=>n.text===label);
 if(!node)throw Error('Missing control: '+label);
 const b=node.bounds.match(/\d+/g).map(Number);
 const overlap=uniqueBars.filter(({bounds:r})=>Math.min(b[2],r[2])>Math.max(b[0],r[0])&&Math.min(b[3],r[3])>Math.max(b[1],r[1]));
 const dp=[(b[2]-b[0])*160/density,(b[3]-b[1])*160/density];
 return {label,bounds:b,dp,enabled:node.enabled==='true',overlap};
});
const failures=controls.filter(c=>c.overlap.length||c.dp.some(d=>d<47.5));
const record={at:new Date().toISOString(),name,kind,device:'emulator-5556',simulated:false,fontScale:run(['shell','settings','get','system','font_scale']).trim(),density,systemBars:uniqueBars,controls,passed:!failures.length};
fs.writeFileSync(path.join(dir,name+'-bounds.json'),JSON.stringify(record,null,2));fs.writeFileSync(path.join(dir,name+'.xml'),xml);
run(['shell','screencap','-p','/sdcard/metro-screen.png']);run(['pull','/sdcard/metro-screen.png',path.join(dir,name+'.png')]);
console.log(JSON.stringify({name,passed:record.passed,controls:controls.map(c=>({label:c.label,bounds:c.bounds,overlap:c.overlap.length})),failures},null,2));
if(failures.length)process.exitCode=1;
