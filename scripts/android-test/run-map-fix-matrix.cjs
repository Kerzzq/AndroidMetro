const {execFileSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),adb=path.join(process.env.ANDROID_HOME,'platform-tools/adb.exe');
const dir=process.env.MAPA_EVIDENCE_DIR;const shell=(...args)=>execFileSync(adb,['-s','emulator-5556','shell',...args],{encoding:'utf8'});
const ui=(...args)=>execFileSync(process.execPath,[path.join(__dirname,'verify-map-ui.cjs'),...args],{encoding:'utf8'});
function bounds(name,kind){const out=execFileSync(process.execPath,[path.join(__dirname,'verify-map-insets.cjs'),name,kind],{encoding:'utf8'});fs.appendFileSync(dir+'/matrix.log',out+'\n');}
for(const nav of ['threebutton','gestural'])for(const font of ['1.0','1.5'])for(const rotation of ['0','1']) {
 const name=`${nav}-${font}-${rotation==='0'?'vertical':'horizontal'}`;
 if(process.env.MAPA_CASES&&!process.env.MAPA_CASES.split(',').includes(name))continue;
 console.log('Start '+name);
 shell('cmd','overlay','enable-exclusive','--category','com.android.internal.systemui.navbar.'+nav);
 shell('am','force-stop','com.metrobilbao.widget.pruebas');shell('settings','put','system','font_scale',font);
 shell('am','start','-n','com.metrobilbao.widget.pruebas/.MainActivity');
 ui('settled-home');shell('wm','user-rotation','lock',rotation);
 const deadline=Date.now()+10000;while(!shell('dumpsys','window','displays').includes('mRotation='+rotation+' mDeferredRotationPauseCount')){if(Date.now()>deadline)throw Error('Rotation did not settle '+name);}


 ui('settled-home');ui('click','Mapa');ui('dump');bounds(name+'-vacio','map');
 ui('route','STZ','MOY');bounds(name+'-seleccion','map');
 // Real API, never mock data. Record exact visible results and query timestamp.
 ui('query',name+'-api');

 bounds(name+'-resultados','results');ui('click','Volver');
 ui('click','Guardar trayecto como favorito');bounds(name+'-guardar','save');ui('click','Volver');
 ui('click','Origen: Santurtzi. Cambiar por nombre');bounds(name+'-selector','picker');ui('click','Volver');
 console.log('PASS '+name+' empty, selected, real query, results, save, picker');
}
