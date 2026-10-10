const assert = require('node:assert/strict');
const { createConsultationController } = require('../src/services/consultationController');
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
const tick = () => new Promise(resolve => setImmediate(resolve));
const favorite = (id, from = id, to = 'MOY') => ({ id, from, to, name: '' });
const good = (from, at = 100000) => ({ status: 'success', routeKey: `${from}/MOY`, fetchedAt: at, trains: [{ time: '12:30', destination: from, wagons: 4 }] });
function setup(favorites, cache = {}, query = async f => good(f.from)) {
  let document = { schemaVersion: 1, revision: 1, favorites }, emissions = [];
  const controller = createConsultationController({
    repository: { loadFavorites: async () => document, loadSettings: async () => ({ showWagons: true, timeDisplayMode: 'clock' }) },
    service: { loadCachedRoute: async f => cache[`${f.from}/${f.to}`] || null, queryTrains: query },
    now: () => 100000, onChange: state => emissions.push(state),
  });
  return { controller, emissions, document: doc => { document = doc; } };
}
(async () => {
  // A late request for A must not render under the favorite edited to B.
  const late = deferred();
  const edited = setup([favorite('one', 'A')], {}, f => f.from === 'A' ? late.promise : Promise.resolve(good('B')));
  const initial = edited.controller.start(); await tick();
  edited.document({ schemaVersion: 1, revision: 2, favorites: [favorite('one', 'B')] });
  await edited.controller.start(); late.resolve(good('A')); await initial;
  assert.equal(edited.controller.getState().entries.one.data.trains[0].destination, 'B');
  edited.document({ schemaVersion: 1, revision: 3, favorites: [] }); await edited.controller.start();
  assert.deepEqual(edited.controller.getState().entries, {});
  // After leaving the app, no late UI update or new queued network work.
  const stopped = deferred(); let calls = 0;
  const paused = setup(Array.from({ length: 10 }, (_, i) => favorite(String(i))), {}, () => { calls++; return stopped.promise; });
  const pending = paused.controller.start(); await tick(); assert.equal(calls, 3);
  paused.controller.stop(); const count = paused.emissions.length;
  stopped.resolve(good('0')); await pending;
  assert.equal(paused.emissions.length, count); assert.equal(calls, 3);
  // Recent cache suppresses resume polling. Explicit refresh still queries.
  let refreshes = 0;
  const recent = setup([favorite('one', 'A')], { 'A/MOY': good('A') }, async () => { refreshes++; return good('A'); });
  await recent.controller.start(); await recent.controller.start(); assert.equal(refreshes, 0);
  await recent.controller.refresh('one'); assert.equal(refreshes, 1);
  await recent.controller.start(true); assert.equal(refreshes, 2);
  // Offline result keeps only this route's cached rows; a valid empty clears them.
  let response = { status: 'error', kind: 'network' };
  const offline = setup([favorite('one', 'A')], { 'A/MOY': good('A', 1000) }, async () => response);
  await offline.controller.start();
  assert.equal(offline.controller.getState().entries.one.data.status, 'error');
  assert.equal(offline.controller.getState().entries.one.data.trains[0].destination, 'A');
  response = { status: 'empty', fetchedAt: 100000, trains: [] }; await offline.controller.refresh('one');
  assert.deepEqual(offline.controller.getState().entries.one.data.trains, []);
  // Ten favorites: at most three simultaneous requests, all rows retained.
  let concurrent = 0, maximum = 0;
  const all = setup(Array.from({ length: 10 }, (_, i) => favorite(String(i))), {}, async f => {
    maximum = Math.max(maximum, ++concurrent); await tick(); concurrent--;
    return { ...good(f.from), trains: Array.from({ length: 24 }, (_, i) => ({ time: '12:30', destination: String(i) })) };
  });
  await all.controller.start(); assert.equal(maximum, 3);
  assert.equal(Object.keys(all.controller.getState().entries).length, 10);
  assert.equal(all.controller.getState().entries['9'].data.trains.length, 24);
  assert.equal(all.controller.getState().refreshing, false);
  console.log('PASS: edits/deletion, stale responses, background pause, cache/resume, refresh, offline/empty, concurrency and all 24 rows (simulated).');
})().catch(error => { console.error(error); process.exitCode = 1; });
