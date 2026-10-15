import React from 'react';
import { getWidgetInfo, requestWidgetUpdateById } from 'react-native-android-widget';
import { loadFavorites, loadInstance, loadSettings } from '../services/favoritesRepository';
import { loadCachedRoute, queryTrains } from '../services/trainService';
import { routeKey, routeProblem } from '../domain/favoritesModel';
import { STATION_MAP } from '../data/stations';
import MetroWidget from './MetroWidget';
const generations = new Map();
export const WIDGET_NAME = 'MetroBilbaoWidget';
export async function widgetSnapshot(info) {
  const document = await loadFavorites();
  const [state, settings] = await Promise.all([loadInstance(info.widgetId, document), loadSettings()]);
  const favorite = document.favorites.find(f => f.id === state.favoriteId);
  const cached = favorite && !routeProblem(favorite, STATION_MAP) ? await loadCachedRoute(favorite) : null;
  return { info, favorites: document.favorites, state, settings, favorite, result: favorite && routeProblem(favorite, STATION_MAP) ? { status: 'error', kind: 'invalid_route' } : cached || { status: 'idle', trains: [] }, document };
}
export const representation = snapshot => <MetroWidget {...snapshot} />;
export async function refreshWidget(info, draw, network = true) {
  const token = (generations.get(info.widgetId) || 0) + 1;
  generations.set(info.widgetId, token);
  const snapshot = await widgetSnapshot(info);
  if (generations.get(info.widgetId) !== token) return;
  const route = snapshot.favorite;
  if (!network || !route || snapshot.state.view === 'favorites' || routeProblem(route, STATION_MAP)) { await draw(representation(snapshot)); return; }
  await draw(representation({ ...snapshot, result: { ...snapshot.result, status: 'loading' } }));
  const response = await queryTrains(route);
  if (generations.get(info.widgetId) !== token) return;
  const current = await widgetSnapshot(info);
  if (generations.get(info.widgetId) !== token) return;
  if (current.favorite?.id !== route.id || routeKey(current.favorite) !== routeKey(route) || current.document.revision !== snapshot.document.revision) { await draw(representation(current)); return; }
  current.result = response.status === 'error' ? { ...current.result, ...response } : response;
  await draw(representation(current));
}
export async function syncWidgets() {
  const infos = await getWidgetInfo(WIDGET_NAME);
  await Promise.all(infos.map(async info => {
    const snapshot = await widgetSnapshot(info);
    const draw = component => requestWidgetUpdateById({ widgetName: WIDGET_NAME, widgetId: info.widgetId, renderWidget: () => component });
    await refreshWidget(info, draw, snapshot.result.status === 'idle');
  }));
}
