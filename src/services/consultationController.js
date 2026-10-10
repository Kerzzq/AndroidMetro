// UI-only coordinator. Shared storage, API and widget selections stay unchanged.
const keyOf = route => `${route.from}/${route.to}`;
function createConsultationController({ repository, service, onChange, now = Date.now }) {
  let active = false, generation = 0, running = 0;
  const waiters = [];
  async function acquire() {
    if (running < 3) { running++; return; }
    await new Promise(resolve => waiters.push(resolve));
  }
  function release() {
    const next = waiters.shift();
    if (next) next(); // Transfer the reserved slot; no momentary fourth request.
    else running--;
  }
  let state = { document: null, settings: null, entries: {}, loading: true, refreshing: false, error: '' };
  function publish(patch, token) {
    if (!active || token !== generation) return false;
    state = { ...state, ...patch }; onChange(state); return true;
  }
  function entry(id, value, token) {
    return publish({ entries: { ...state.entries, [id]: value } }, token);
  }
  async function fetchRoute(favorite, token) {
    if (!active || token !== generation) return;
    const key = keyOf(favorite);
    await acquire();
    if (!active || token !== generation) { release(); return; }
    let result;
    try { result = await service.queryTrains(favorite); }
    catch { result = { status: 'error', kind: 'network' }; }
    finally { release(); }
    // A response for an edited/deleted route or an inactive screen must not render.
    if (!active || token !== generation || state.entries[favorite.id]?.key !== key) return;
    const previous = state.entries[favorite.id]?.data;
    const data = result.status === 'error' ? { ...previous, ...result } : result;
    entry(favorite.id, { key, data, loading: false }, token);
  }
  async function pool(favorites, token) {
    let cursor = 0;
    await Promise.all(Array.from({ length: Math.min(3, favorites.length) }, async () => {
      while (active && token === generation && cursor < favorites.length) {
        const favorite = favorites[cursor++];
        await fetchRoute(favorite, token);
      }
    }));
  }
  async function start(force = false) {
    active = true; const token = ++generation;
    publish({ loading: true, error: '', refreshing: false }, token);
    try {
      const [document, settings] = await Promise.all([repository.loadFavorites(), repository.loadSettings()]);
      const cached = await Promise.all(document.favorites.map(f => service.loadCachedRoute(f)));
      if (!active || token !== generation) return;
      const entries = {}, pending = [];
      document.favorites.forEach((f, index) => {
        const key = keyOf(f), data = cached[index];
        const needsQuery = force || !data || data.status === 'error' || now() - data.fetchedAt >= 30000;
        entries[f.id] = { key, data, loading: needsQuery };
        if (needsQuery) pending.push(f);
      });
      publish({ document, settings, entries, loading: false, refreshing: pending.length > 0 }, token);
      await pool(pending, token);
      publish({ refreshing: false }, token);
    } catch {
      publish({ loading: false, refreshing: false, error: 'No se pudieron cargar tus trayectos. Vuelve a intentar.' }, token);
    }
  }
  async function refresh(id) {
    const favorite = state.document?.favorites.find(f => f.id === id);
    if (!active || !favorite || state.entries[id]?.loading) return;
    const token = generation;
    entry(id, { ...state.entries[id], loading: true }, token);
    await fetchRoute(favorite, token);
  }
  return { start, refresh, stop() { active = false; generation++; }, getState: () => state };
}
module.exports = { createConsultationController };
