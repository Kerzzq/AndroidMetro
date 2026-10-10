const data = require('../data/metroMap.json');
const stations = Object.fromEntries(data.stations.map(s => [s.id, s]));
function physicalRoute(from, to) {
  if (!stations[from] || !stations[to] || from === to) return [];
  const queue = [{ id: from, edges: [] }], seen = new Set([from]);
  while (queue.length) {
    const step = queue.shift();
    if (step.id === to) return step.edges;
    for (const edge of data.edges) {
      if (!edge.topologyValidated || edge.kind !== 'track') continue;
      const next = edge.from === step.id ? edge.to : edge.bidirectional && edge.to === step.id ? edge.from : null;
      if (next && !seen.has(next)) { seen.add(next); queue.push({ id: next, edges: [...step.edges, edge] }); }
    }
  }
  return [];
}
function selectStation(state, id) {
  if (!stations[id]) return state;
  const target = state.editing;
  if (state[target === 'from' ? 'to' : 'from'] === id) return { ...state, error: 'Origen y destino deben ser diferentes.' };
  return { ...state, [target]: id, editing: target === 'from' && !state.to ? 'to' : target, error: '' };
}
// A fixed 48 dp target after camera transform; ambiguous targets open a native list.
function hitStations(x, y, scale, tx, ty) {
  return data.stations.map(s => ({ station: s, distance: Math.hypot(s.x * scale + tx - x, s.y * scale + ty - y) }))
    .filter(hit => hit.distance <= 24).sort((a, b) => a.distance - b.distance).map(hit => hit.station);
}
module.exports = { data, stations, physicalRoute, selectStation, hitStations };
