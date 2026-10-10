// Requires the test-only MetroGesture dex jar at /data/local/tmp/metro-gesture.jar.
const {execFileSync}=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const adb=path.join(process.env.ANDROID_HOME,'platform-tools/adb.exe'),dir=process.env.MAPA_EVIDENCE_DIR;
const run=args=>execFileSync(adb,['-s','emulator-5556',...args],{encoding:'utf8'});
const ui=(...args)=>execFileSync(process.execPath,[path.join(__dirname,'verify-map-ui.cjs'),...args],{encoding:'utf8'});
const cases=[
 {name:'zoom-in-derecho',x:540,y:1250,start:100,end:240,lift:1},
 {name:'zoom-in-izquierdo',x:440,y:1400,start:80,end:190,lift:0},
 {name:'zoom-out-derecho',x:620,y:1100,start:230,end:110,lift:1},
 {name:'zoom-out-izquierdo',x:440,y:1450,start:190,end:90,lift:0},
 {name:'centro-movil',x:490,y:1200,start:110,end:250,lift:1,dx:80,dy:90},
 {name:'cancelacion',x:520,y:1300,start:100,end:220,lift:0,mode:'cancel'},
 {name:'pinch-nuevo-tras-cancelar',x:600,y:1300,start:140,end:250,lift:0},
 {name:'pan-antes-pinch',x:500,y:1250,start:100,end:230,lift:1,mode:'pan-first'}
];
for(const c of cases){
 if(c.name.startsWith('zoom-in'))ui('click','Ver mapa completo');
 const prefix='gesto-'+c.name;
 const args=[c.x,c.y,c.start,c.end,c.lift,prefix,c.mode||'normal',c.dx||0,c.dy||0].map(String);
 console.log(run(['shell','CLASSPATH=/data/local/tmp/metro-gesture.jar','app_process','/data/local/tmp','MetroGesture',...args]).trim());
 for(const phase of ['dos','uno','cero'])run(['pull','/sdcard/'+prefix+'-'+phase+'.png',dir]);
 c.prefix=prefix;
}
fs.writeFileSync(dir+'/gestos-casos.json',JSON.stringify({device:'emulator-5556',input:'Android MotionEvents injected by shell; no physical fingers',holdMilliseconds:350,cases},null,2));
