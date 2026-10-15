const MAX_FAVORITES = 10;
const routeKey = r => `${r.from}/${r.to}`;
const normalizeSearch = text => String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
function migratePanels(panels) {
  if (!Array.isArray(panels)) throw new Error('Los trayectos anteriores no tienen un formato válido. Se han conservado sin cambios.');
  const seen = new Set();
  const favorites = [];
  panels.forEach((p, index) => {
    if (!p || typeof p !== 'object') return;
    const from = typeof p.from === 'string' ? p.from : '';
    const to = typeof p.to === 'string' ? p.to : '';
    if (!from && !to) return;
    const key = `${from}/${to}`;
    if (seen.has(key)) return;
    seen.add(key);
    favorites.push({ id: `legacy-${index}`, from, to, name: '' });
  });
  return { schemaVersion: 1, revision: 1, favorites };
}
function validateDocument(doc) {
  if (!doc || doc.schemaVersion !== 1 || !Number.isInteger(doc.revision) || doc.revision < 1 || !Array.isArray(doc.favorites) || doc.favorites.length > MAX_FAVORITES) throw new Error('Configuración de favoritos no reconocida. No se ha sobrescrito.');
  const ids = new Set();
  for (const f of doc.favorites) {
    if (!f || typeof f.id !== 'string' || ids.has(f.id) || typeof f.from !== 'string' || typeof f.to !== 'string' || typeof f.name !== 'string') throw new Error('Configuración de favoritos dañada. Los datos se han conservado.');
    ids.add(f.id);
  }
  return doc;
}
function routeProblem(f, stationMap) {
  if (!f?.from || !f?.to) return 'Completa origen y destino.';
  if (!Object.hasOwn(stationMap, f.from) || !Object.hasOwn(stationMap, f.to)) return 'Revisa las estaciones de este trayecto.';
  if (f.from === f.to) return 'Origen y destino deben ser diferentes.';
  return null;
}
function upsertFavorite(doc, draft, stationMap) {
  const problem = routeProblem(draft, stationMap);
  if (problem) throw new Error(problem);
  if (doc.favorites.some(f => f.id !== draft.id && routeKey(f) === routeKey(draft))) throw new Error('Ya tienes este trayecto en favoritos.');
  const index = doc.favorites.findIndex(f => f.id === draft.id);
  if (index < 0 && doc.favorites.length >= MAX_FAVORITES) throw new Error('Puedes guardar hasta 10 favoritos.');
  const favorite = { id: draft.id, from: draft.from, to: draft.to, name: String(draft.name || '').trim().slice(0, 80) };
  const favorites = [...doc.favorites];
  if (index < 0) favorites.push(favorite); else favorites[index] = favorite;
  return { ...doc, revision: doc.revision + 1, favorites };
}
function moveFavorite(doc, id, direction) {
  const favorites = [...doc.favorites];
  const index = favorites.findIndex(f => f.id === id), target = index + direction;
  if (index < 0 || target < 0 || target >= favorites.length) return doc;
  [favorites[index], favorites[target]] = [favorites[target], favorites[index]];
  return { ...doc, revision: doc.revision + 1, favorites };
}
function removeFavorite(doc, id) { return { ...doc, revision: doc.revision + 1, favorites: doc.favorites.filter(f => f.id !== id) }; }
function reconcileInstance(doc, instance, stationMap) {
  const selected = doc.favorites.find(f => f.id === instance?.favoriteId) || doc.favorites.find(f => !routeProblem(f, stationMap)) || doc.favorites[0];
  return { favoriteId: selected?.id || null, view: instance?.view === 'favorites' ? 'favorites' : 'trains' };
}
module.exports = { MAX_FAVORITES, routeKey, normalizeSearch, migratePanels, validateDocument, routeProblem, upsertFavorite, moveFavorite, removeFavorite, reconcileInstance };
