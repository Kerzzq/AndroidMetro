'use strict';
const data=globalThis.METRO_DATA,core=globalThis.MetroMap,$=id=>document.getElementById(id);
const viewport=$('viewport');viewport.innerHTML=core.renderSVG(data);const svg=$('metro-map');
let selection={from:null,to:null,editing:'from',error:''};
let camera={scale:1,x:0,y:0},fitScale=1,pointers=new Map(),gesture=null,activeView='all';
const station=id=>data.stations.find(s=>s.id===id);
function clampCamera(){const w=viewport.clientWidth,h=viewport.clientHeight,sw=2420*camera.scale,sh=780*camera.scale;camera.x=sw<=w?(w-sw)/2:Math.min(60,Math.max(w-sw-60,camera.x));camera.y=sh<=h?(h-sh)/2:Math.min(60,Math.max(h-sh-60,camera.y));}
function paintCamera(){clampCamera();svg.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;svg.classList.toggle('overview',camera.scale<.8);$('zoom-level').textContent=Math.round(camera.scale/fitScale*100)+' %';$('scale-hint').textContent=camera.scale<.8?'Vista general · amplía para leer y tocar con precisión':'Detalle · objetivos táctiles de 48 px';svg.querySelectorAll('.hit').forEach(e=>e.setAttribute('r',24/camera.scale));}
function setView(view){activeView=view;document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('active',e.dataset.view===view));const w=viewport.clientWidth,h=viewport.clientHeight;
 if(view==='all'){fitScale=Math.min(w/2420,h/780);camera={scale:fitScale,x:0,y:0};}
 else{const center={bilbao:[1770,440],coast:[640,300],left:[820,530]}[view];const scale=Math.min(1.15,Math.max(.85,w/(view==='bilbao'?1250:1400)));camera={scale,x:w/2-center[0]*scale,y:h/2-center[1]*scale};}
 paintCamera();}
function focusPoint(x,y,scale=Math.max(.95,camera.scale)){camera={scale:Math.min(3,scale),x:viewport.clientWidth/2-x*scale,y:viewport.clientHeight/2-y*scale};activeView='detail';document.querySelectorAll('[data-view]').forEach(e=>e.classList.remove('active'));paintCamera();}
function zoom(factor,px=viewport.clientWidth/2,py=viewport.clientHeight/2){const s=Math.max(fitScale,Math.min(3,camera.scale*factor)),ratio=s/camera.scale;camera={scale:s,x:px-(px-camera.x)*ratio,y:py-(py-camera.y)*ratio};activeView='detail';document.querySelectorAll('[data-view]').forEach(e=>e.classList.remove('active'));paintCamera();}
function renderSelection(){
 const r=core.route(data,selection.from,selection.to);
 for(const key of ['from','to']){$(key+'-name').textContent=station(selection[key])?.displayName.replaceAll('/', ' / ')??'Elige una estación';$('edit-'+key).classList.toggle('active',selection.editing===key);$('edit-'+key).setAttribute('aria-pressed',String(selection.editing===key));$(key+'-select').value=selection[key]??'';}
 svg.querySelectorAll('.station').forEach(e=>{const id=e.dataset.station;e.classList.toggle('origin',selection.from===id);e.classList.toggle('destination',selection.to===id);e.classList.toggle('selected',!!r?.ids.includes(id)&&id!==selection.from&&id!==selection.to);e.setAttribute('aria-pressed',String(id===selection.from||id===selection.to));e.querySelector('.selection text').textContent=id===selection.from?'O':'D';});
 $('route').innerHTML=r?r.edges.map(e=>`<path class="route-halo" d="${core.edgePath(data,e)}"/><path class="route-core" d="${core.edgePath(data,e)}"/>`).join(''):'';
 $('status').classList.toggle('warning',!!selection.error||!!r&&!r.queryEligible);$('route-details').hidden=!r;
 if(selection.error){$('status').textContent=selection.error;}
 else if(r){$('status').textContent=`${station(selection.from).displayName} → ${station(selection.to).displayName} · ${r.edges.filter(e=>e.kind==='track').length} tramos de vía${r.transfers.length?' · transbordo entre operadores':''}`;}
 else{$('status').textContent=`Toca tu estación de ${selection.editing==='from'?'origen':'destino'}.`;}
 $('route-note').textContent=r?(r.queryEligible?'Recorrido esquemático de L1/L2. La consulta de próximos trenes se añadirá en la siguiente fase. Puede requerir cambio de tren.':'L3 / Euskotren: cobertura de trenes no validada. Puedes explorar este recorrido; no se puede consultar ni guardar.'):(selection.from&&!station(selection.from).queryEligible?'L3 / Euskotren: no hay consulta de trenes validada. Puedes explorar y cambiar la selección.':`Selecciona O o D para corregir una estación. Las pulsaciones cambian ${selection.editing==='from'?'el origen':'el destino'}.`);
 if(r){const left=r.ids.some(id=>data.sequences.L2.slice(0,11).includes(id)),coast=r.ids.some(id=>data.sequences.L1.slice(0,17).includes(id));if(left&&coast)$('route-note').textContent+=' Entre ramales L1/L2: cambio de línea en San Ignazio.';}
 $('route-stations').textContent=r?r.ids.map(id=>`${station(id).displayName} (${station(id).lines.join('/')})`).join(' → '):'';
}
function choose(id){selection=core.select(selection,id);$('nearby').hidden=true;renderSelection();}
for(const key of ['from','to']){$('edit-'+key).onclick=()=>{selection.editing=key;selection.error='';renderSelection();};const select=$(key+'-select');for(const s of [...data.stations].sort((a,b)=>a.displayName.localeCompare(b.displayName,'es'))){const option=document.createElement('option');option.value=s.id;option.textContent=`${s.displayName}${s.appName!==s.displayName?' · '+s.appName:''} · ${s.lines.join('/')} ${s.queryEligible?'':'· L3 sin trenes validados'}`;select.append(option);}select.onchange=()=>{selection.editing=key;if(select.value){choose(select.value);const s=station(select.value);focusPoint(s.x,s.y);}else{selection[key]=null;renderSelection();}};}
$('reset').onclick=()=>{selection={from:null,to:null,editing:'from',error:''};$('nearby').hidden=true;renderSelection();};$('swap').onclick=()=>{[selection.from,selection.to]=[selection.to,selection.from];selection.error='';if(!selection.from)selection.editing='from';else if(!selection.to)selection.editing='to';renderSelection();};
$('theme').onclick=()=>{const dark=document.body.classList.toggle('dark');svg.classList.toggle('dark',dark);$('theme').textContent=dark?'Tema claro':'Tema oscuro';$('theme').setAttribute('aria-pressed',String(dark));};
document.querySelectorAll('[data-view]').forEach(e=>e.onclick=()=>setView(e.dataset.view));$('plus').onclick=()=>zoom(1.35);$('minus').onclick=()=>zoom(1/1.35);$('close-nearby').onclick=()=>{$('nearby').hidden=true;};
function point(e){const r=viewport.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
function tap(p){const candidates=data.stations.map(s=>({s,d:Math.hypot(s.x*camera.scale+camera.x-p.x,s.y*camera.scale+camera.y-p.y)})).filter(c=>c.d<=24).sort((a,b)=>a.d-b.d);
 if(candidates.length===1){choose(candidates[0].s.id);if(camera.scale<.8)focusPoint(candidates[0].s.x,candidates[0].s.y);}
 else if(candidates.length>1){$('nearby-options').replaceChildren();for(const {s}of candidates){const b=document.createElement('button');b.textContent=`${s.displayName} · ${s.lines.join('/')}`;b.onclick=()=>choose(s.id);$('nearby-options').append(b);}$('nearby').hidden=false;focusPoint((p.x-camera.x)/camera.scale,(p.y-camera.y)/camera.scale);$('nearby').scrollIntoView({block:'nearest'});}
 else if(camera.scale<.8)focusPoint((p.x-camera.x)/camera.scale,(p.y-camera.y)/camera.scale);
}
function rebaseGesture(){const ps=[...pointers.values()];gesture={camera:{...camera},start:ps[0],moved:gesture?.moved??false,pinched:gesture?.pinched||ps.length>1};if(ps.length>=2){gesture.mid={x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2};gesture.distance=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);}}
viewport.addEventListener('pointerdown',e=>{if(e.button!==0&&e.pointerType==='mouse')return;pointers.set(e.pointerId,point(e));viewport.setPointerCapture(e.pointerId);if(pointers.size===1)gesture=null;rebaseGesture();});
viewport.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,point(e));const ps=[...pointers.values()],g=gesture;if(ps.length>=2){g.moved=true;const mid={x:(ps[0].x+ps[1].x)/2,y:(ps[0].y+ps[1].y)/2},dist=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y),s=Math.max(fitScale,Math.min(3,g.camera.scale*dist/Math.max(1,g.distance))),ratio=s/g.camera.scale;camera={scale:s,x:mid.x-(g.mid.x-g.camera.x)*ratio,y:mid.y-(g.mid.y-g.camera.y)*ratio};}
 else{const dx=ps[0].x-g.start.x,dy=ps[0].y-g.start.y;if(Math.hypot(dx,dy)>7)g.moved=true;if(g.moved)camera={...g.camera,x:g.camera.x+dx,y:g.camera.y+dy};}if(g.moved){viewport.classList.add('dragging');paintCamera();}});
function endPointer(e,cancelled){if(!pointers.has(e.pointerId))return;const g=gesture,p=point(e);pointers.delete(e.pointerId);if(pointers.size){rebaseGesture();return;}viewport.classList.remove('dragging');if(!cancelled&&!g.moved&&!g.pinched)tap(p);gesture=null;}
viewport.addEventListener('pointerup',e=>endPointer(e,false));viewport.addEventListener('pointercancel',e=>endPointer(e,true));
viewport.addEventListener('wheel',e=>{e.preventDefault();const p=point(e);zoom(Math.exp(-e.deltaY*.002),p.x,p.y);},{passive:false});
viewport.addEventListener('keydown',e=>{const id=e.target.closest('[data-station]')?.dataset.station;if(id&&(e.key==='Enter'||e.key===' ')){e.preventDefault();choose(id);const s=station(id);focusPoint(s.x,s.y);return;}if(e.key==='+'||e.key==='='){e.preventDefault();zoom(1.35);}if(e.key==='-'){e.preventDefault();zoom(1/1.35);}const shift={ArrowLeft:[70,0],ArrowRight:[-70,0],ArrowUp:[0,70],ArrowDown:[0,-70]}[e.key];if(shift){e.preventDefault();camera.x+=shift[0];camera.y+=shift[1];paintCamera();}});
svg.addEventListener('focusin',e=>{const s=station(e.target.closest('[data-station]')?.dataset.station);if(s&&!pointers.size)focusPoint(s.x,s.y);});
new ResizeObserver(()=>{fitScale=Math.min(viewport.clientWidth/2420,viewport.clientHeight/780);if(activeView==='all')setView('all');else paintCamera();}).observe(viewport);
setView('all');renderSelection();
// Sólo lectura para comprobaciones reproducibles del prototipo.
globalThis.prototypeState=()=>({selection:{...selection},camera:{...camera},fitScale});
