const { upsertFavorite } = require('../domain/favoritesModel');
const { errorMessage } = require('../domain/trainModel');
const { STATION_MAP } = require('../data/stations');
const { stations } = require('../domain/mapModel');
async function saveMapFavorite({ route, name, repository, service, syncWidgets, makeId = () => `fav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}` }) {
  if (!stations[route?.from] || !stations[route?.to]) throw new Error('Revisa las estaciones del mapa.');
  const draft = { from: route.from, to: route.to, name: name || '', id: makeId() };
  // Precheck for feedback; recheck inside the existing serial repository transaction.
  upsertFavorite(await repository.loadFavorites(), draft, STATION_MAP);
  const result = await service.queryTrains(draft);
  if (result.status === 'error') throw new Error(`${errorMessage(result.kind)} No se ha podido validar el trayecto. Tu borrador se conserva.`);
  await repository.changeFavorites(doc => upsertFavorite(doc, draft, STATION_MAP));
  let widgetWarning = false;
  try { await syncWidgets(); } catch { widgetWarning = true; }
  return { favorite: draft, widgetWarning };
}
module.exports = { saveMapFavorite };
