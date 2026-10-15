// Read-only security regression against the controlled emulator. Never logs PNGs
// or valid URI capabilities. A launcher rendering the widget is verified in UI.
const cp=require('node:child_process'),path=require('node:path'),fs=require('node:fs');
const adb=path.join(process.env.ANDROID_HOME||'C:/Users/W11/AMetro/sdk','platform-tools/adb.exe');
const widgetId=Number(process.argv[2]);
if(!Number.isInteger(widgetId)||widgetId<1)throw Error('Expected existing official widget ID.');
const base='content://com.metrobilbao.widget.rnwidget.imageprovider/';
const cases=[
  ['predictable filename',`widget_${widgetId}_mode_light.png`],
  ['forged capability',`widget_${widgetId}_mode_light.png?am_token=${'0'.repeat(64)}`],
  ['encoded traversal','..%2Fwidget_images_other%2Fprivate.png'],
];
const results=cases.map(([name,relative])=>{
  const result=cp.spawnSync(adb,['-s','emulator-5556','shell','content','read','--uri',base+relative],{maxBuffer:16*1024*1024});
  const error=(result.stderr||Buffer.alloc(0)).toString();
  const png=(result.stdout||Buffer.alloc(0)).subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const denied=error.includes('Image access denied.')&&!png;
  return{name,denied,exposedPng:png};
});
const report={at:new Date().toISOString(),device:'emulator-5556',package:'com.metrobilbao.widget',widgetId,results};
if(process.env.AMETRO_SECURITY_REPORT)fs.writeFileSync(process.env.AMETRO_SECURITY_REPORT,JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));
if(results.some(x=>!x.denied))process.exitCode=1;
