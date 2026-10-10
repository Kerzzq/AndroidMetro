const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),babel=require('@babel/core');
const {upsertFavorite,moveFavorite}=require('../src/domain/favoritesModel');
const stations={ABA:'Abando',MOY:'Moyua',CAV:'Casco Viejo',SIN:'San Ignazio',BAR:'Barakaldo',ANS:'Ansio',STZ:'Santurtzi',LEI:'Leioa'};
const values=new Map([['metro_panels_config',JSON.stringify([{from:'ABA',to:'MOY'},{from:'MOY',to:'ABA'},{from:'BAR',to:''}])]]);
const storage={getItem:async k=>values.get(k)||null,setItem:async(k,v)=>{values.set(k,v)},removeItem:async k=>values.delete(k),multiGet:async ks=>ks.map(k=>[k,values.get(k)||null])};
let fetchImpl;
function load(file){const abs=path.join(__dirname,'..',file),m={exports:{}};const code=babel.transformFileSync(abs,{plugins:['@babel/plugin-transform-modules-commonjs'],babelrc:false,configFile:false}).code;vm.runInNewContext(code,{module:m,exports:m.exports,require:n=>n.includes('async-storage')?storage:n.endsWith('/data/stations')?{STATION_MAP:stations}:require(path.resolve(path.dirname(abs),n)),Date,Map,Promise,JSON,AbortController,console,fetch:(...a)=>fetchImpl(...a),setTimeout:(fn,ms)=>setTimeout(fn,ms===10000?5:ms),clearTimeout});return m.exports;}
(async()=>{
 const repo=load('src/services/favoritesRepository.js');let doc=await repo.loadFavorites();assert.equal(doc.favorites.length,3);assert.equal(JSON.parse(values.get('androidmetro_migration_backup_v1')).panels,values.get('metro_panels_config'));
 await Promise.all([repo.changeFavorites(d=>upsertFavorite(d,{id:'new1',from:'ABA',to:'LEI',name:'Trabajo'},stations)),repo.changeFavorites(d=>upsertFavorite(d,{id:'new2',from:'STZ',to:'MOY',name:''},stations))]);doc=await repo.loadFavorites();assert.equal(doc.favorites.length,5);
 await repo.changeInstance(2,{favoriteId:'legacy-0'});await repo.changeInstance(3,{favoriteId:'new1'});await repo.changeInstance(2,{favoriteId:'new2',view:'favorites'});assert.equal((await repo.loadInstance(3,doc)).favoriteId,'new1');
 const restarted=load('src/services/favoritesRepository.js');assert.equal((await restarted.loadFavorites()).favorites.length,5);assert.equal((await restarted.loadInstance(2,doc)).view,'favorites');
 const api=load('src/services/trainService.js'),route={from:'ABA',to:'MOY'};const row={timeRounded:'00:03',time:'2026-10-11T00:03:00',estimated:23,direction:'Plentzia',wagons:4};let calls=0;
 fetchImpl=async()=>{calls++;return{ok:true,json:async()=>({trains:Array.from({length:24},()=>row)})}};const pair=await Promise.all([api.queryTrains(route),api.queryTrains(route)]);assert.equal(calls,1);assert.equal(pair[0].trains.length,24);assert.equal((await api.loadCachedRoute(route)).trains.length,24);
 fetchImpl=async()=>({ok:false,status:500});assert.equal((await api.queryTrains({from:'MOY',to:'ABA'})).kind,'service');assert.equal((await api.loadCachedRoute({from:'MOY',to:'ABA'})).kind,'service');
 fetchImpl=async()=>{throw new TypeError('offline')};assert.equal((await api.queryTrains({from:'CAV',to:'SIN'})).kind,'network');
 fetchImpl=async()=>({ok:true,json:async()=>({})});assert.equal((await api.queryTrains({from:'BAR',to:'ANS'})).kind,'invalid_data');
 fetchImpl=async()=>({ok:true,json:async()=>({trains:[]})});assert.equal((await api.queryTrains({from:'STZ',to:'MOY'})).status,'empty');
 fetchImpl=async(url,{signal})=>new Promise((res,rej)=>signal.addEventListener('abort',()=>rej(new Error('abort'))));assert.equal((await api.queryTrains({from:'ABA',to:'LEI'})).kind,'timeout');
 // Simulated persisted failure after a previously successful route; cached rows survive.
 values.set('androidmetro_attempt_v1_ABA/MOY',JSON.stringify({status:'error',kind:'network',attemptedAt:Date.now()}));const cache=await api.loadCachedRoute(route);assert.equal(cache.status,'error');assert.equal(cache.trains.length,24);
 console.log('OK: persistencia tras recarga, copia legacy literal, escrituras concurrentes, widgets 2/3 independientes, 24 filas, deduplicación, vacío/HTTP500/red/formato/timeout y caché con error. Datos simulados, sin llamadas reales.');
})().catch(e=>{console.error(e);process.exitCode=1});
