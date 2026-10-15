const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const { routeProblem } = require('../src/domain/favoritesModel');
const { normalizeResponse } = require('../src/domain/trainModel');
const map = { ABA: 'Abando', MOY: 'Moyua' };
assert.ok(routeProblem({from:'toString',to:'MOY'},map));
assert.ok(routeProblem({from:'ABA',to:'__proto__'},map));
assert.equal(routeProblem({from:'ABA',to:'MOY'},map),null);
for(const timeRounded of ['99:99','24:00','12:60','-1:20','1:02']) {
  assert.throws(()=>normalizeResponse({trains:[{timeRounded,direction:'Plentzia'}]},1),/invalid_data/);
}
for(const timeRounded of ['00:00','09:02','23:59']) {
  assert.equal(normalizeResponse({trains:[{timeRounded,direction:'Plentzia'}]},1).trains[0].time,timeRounded);
}
function load(file,mocks){
  const abs=path.join(__dirname,'..',file),m={exports:{}};
  const code=babel.transformFileSync(abs,{plugins:[require.resolve('@babel/plugin-transform-react-jsx'),require.resolve('@babel/plugin-transform-modules-commonjs')],babelrc:false,configFile:false}).code;
  vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>mocks[n]||require(path.resolve(path.dirname(abs),n)),Map,Promise,JSON,console});
  return m.exports;
}
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r});return{resolve,promise}};
const tick=()=>new Promise(r=>setImmediate(r));
(async()=>{
  let raw;
  const storage={getItem:async()=>raw,setItem:async()=>{throw Error('Preferences must not be overwritten')}};
  const repo=load('src/services/favoritesRepository.js',{'@react-native-async-storage/async-storage':storage,'../data/stations':{STATION_MAP:map}});
  for(raw of ['null','[]','123','"oops"','{',null]){
    const settings=await repo.loadSettings();assert.equal(settings.showWagons,true);assert.equal(settings.timeDisplayMode,'clock');
  }
  raw='{"showWagons":false,"timeDisplayMode":"minutes"}';
  const prefs=await repo.loadSettings();assert.equal(prefs.showWagons,false);assert.equal(prefs.timeDisplayMode,'minutes');
  // Pause an old snapshot in storage: a newer selector render must win.
  let state={favoriteId:'a',view:'trains'},hold=null,loads=0;
  const doc={revision:1,favorites:[{id:'a',from:'ABA',to:'MOY'}]};
  const mocks={react:{createElement:(type,props)=>({type,props})},'react-native-android-widget':{},'../data/stations':{STATION_MAP:map},'./MetroWidget':()=>null,
    '../services/favoritesRepository':{loadFavorites:async()=>doc,loadInstance:async()=>({...state}),loadSettings:async()=>({})},
    '../services/trainService':{loadCachedRoute:async()=>{loads++;if(hold){const pending=hold;hold=null;return pending.promise}return null},queryTrains:async()=>({status:'empty',trains:[]})}};
  const runtime=load('src/widgets/widgetRuntime.js',mocks),draws=[],info={widgetId:2};
  hold=deferred();const pending=hold;
  const old=runtime.refreshWidget(info,v=>draws.push(v.props),false);await tick();
  state={favoriteId:'a',view:'favorites'};
  await runtime.refreshWidget(info,v=>draws.push(v.props),false);
  const count=draws.length;pending.resolve(null);await old;
  assert.equal(draws.length,count,'old cached snapshot cannot overwrite a newer render');
  assert.equal(draws.at(-1).state.view,'favorites');
  // A generation may also change during the post-network snapshot.
  let queryDone=deferred(),calls=0;
  mocks['../services/trainService'].queryTrains=()=>queryDone.promise;
  const stalePost=deferred();
  mocks['../services/trainService'].loadCachedRoute=async()=>{calls++;return calls===2?stalePost.promise:null};
  state={favoriteId:'a',view:'trains'};
  const older=runtime.refreshWidget(info,v=>draws.push(v.props),true);await tick();queryDone.resolve({status:'empty',trains:[]});await tick();
  state={favoriteId:'a',view:'favorites'};await runtime.refreshWidget(info,v=>draws.push(v.props),false);
  const after=draws.length;stalePost.resolve(null);await older;
  assert.equal(draws.length,after,'generation is checked after the post-network snapshot');
  assert.equal(draws.at(-1).state.view,'favorites');
  console.log('PASS: null/malformed preferences preserved, own station IDs, valid clock values, stale widget snapshots before/after network.');
})().catch(error=>{console.error(error);process.exitCode=1});
