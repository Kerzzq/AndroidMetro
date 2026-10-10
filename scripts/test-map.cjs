const assert=require('assert/strict');
const {data,stations,physicalRoute,selectStation,hitStations}=require('../src/domain/mapModel');
const {STATION_MAP}=require('../src/data/stations');
assert.equal(data.stations.length,42);assert.equal(data.edges.length,41);
assert.equal(stations.MOY.displayName,'Eliptikoa');assert.equal(stations.DEU.displayName,'Deusto');
for(const s of data.stations){assert(STATION_MAP[s.id]);assert.equal(s.id,s.apiCode);assert(s.lines.every(l=>l==='L1'||l==='L2'));}
assert(!stations.ZZC);assert(!data.sequences.L3);
for(const e of data.edges){assert(e.kind==='track'&&e.topologyValidated);assert(stations[e.from]&&stations[e.to]);}
for(const a of data.stations)for(const b of data.stations)if(a.id!==b.id){const path=physicalRoute(a.id,b.id);assert(path.length);assert(!path.some(e=>e.lines.includes('L3')));}
assert.equal(physicalRoute('STZ','PLE').filter(e=>e.from==='GUR'&&e.to==='SIN').length,1);
assert.deepEqual(physicalRoute('ZZC','MOY'),[]);
let state={from:null,to:null,editing:'from'};state=selectStation(state,'STZ');state=selectStation(state,'PLE');assert.equal(state.from,'STZ');assert.equal(state.to,'PLE');
assert(selectStation({...state,editing:'from'},'PLE').error);
assert.equal(hitStations(stations.STZ.x,stations.STZ.y,1,0,0)[0].id,'STZ');
assert(hitStations(stations.STZ.x*.15,stations.STZ.y*.15,.15,0,0).length>1);
console.log('PASS: 42 API codes unchanged, 41 validated L1/L2 edges, 1722 physical routes, selection and 48 dp ambiguous hit targets.');
