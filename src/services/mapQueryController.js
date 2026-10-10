// Temporary queries, without creating a fictitious persisted favourite.
const keyOf = r => r?.from && r?.to ? `${r.from}/${r.to}` : null;
function createMapQueryController({ service, onChange }) {
  let route = null, generation = 0, active = true;
  let entry = { key: null, data: null, loading: false };
  const publish = next => { entry = next; onChange(entry); };
  function select(next) {
    generation++; route = next ? { from: next.from, to: next.to } : null;
    publish({ key: keyOf(route), data: null, loading: false });
  }
  async function query() {
    if (!active || !entry.key || entry.loading) return;
    const token = ++generation, snapshot = { ...route }, key = entry.key;
    const current = () => active && token === generation && key === entry.key;
    publish({ ...entry, loading: true });
    try {
      const cached = await service.loadCachedRoute(snapshot);
      if (!current()) return;
      if (!entry.data && cached?.routeKey === key) publish({ ...entry, data: cached });
      const result = await service.queryTrains(snapshot);
      if (!current()) return;
      const data = result.status === 'error' ? { ...entry.data, ...result, routeKey: key } : result;
      publish({ key, data, loading: false });
    } catch {
      if (current()) publish({ key, data: { ...entry.data, status: 'error', kind: 'network', routeKey: key }, loading: false });
    }
  }
  return { select, query, activate() { active = true; }, stop() { active = false; generation++; publish({ ...entry, loading: false }); }, getState: () => entry };
}
module.exports = { createMapQueryController };
