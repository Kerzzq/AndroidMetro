import AsyncStorage from '@react-native-async-storage/async-storage';
import { STATION_MAP } from '../data/stations';
import { routeKey, routeProblem } from '../domain/favoritesModel';
import { normalizeResponse } from '../domain/trainModel';
const inFlight = new Map();
const recent = new Map();
const cacheKey = r => `androidmetro_trains_v1_${routeKey(r)}`;
export async function loadCachedRoute(route) {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(route));
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (cached.routeKey !== routeKey(route) || !Number.isFinite(cached.fetchedAt) || !Array.isArray(cached.trains)) return null;
    return cached;
  } catch { return null; }
}
export function queryTrains(route) {
  if (routeProblem(route, STATION_MAP)) return Promise.resolve({ status: 'error', kind: 'invalid_route' });
  const key = routeKey(route);
  if (inFlight.has(key)) return inFlight.get(key);
  const last = recent.get(key);
  if (last && Date.now() - last.at < 2500) return Promise.resolve(last.result);
  const task = (async () => {
    const controller = new AbortController();
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 10000);
    let result;
    try {
      const response = await fetch(`https://api.metrobilbao.eus/metro/real-time/${route.from}/${route.to}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36' },
      });
      if (!response.ok) result = { status: 'error', kind: 'service', httpStatus: response.status };
      else {
        try { result = { ...normalizeResponse(await response.json(), Date.now()), routeKey: key }; }
        catch { result = { status: 'error', kind: 'invalid_data' }; }
      }
    } catch { result = { status: 'error', kind: timedOut ? 'timeout' : 'network' }; }
    finally { clearTimeout(timeout); }
    if (result.status !== 'error') {
      try { await AsyncStorage.setItem(cacheKey(route), JSON.stringify(result)); } catch { result.cacheWarning = true; }
    }
    recent.set(key, { at: Date.now(), result });
    return result;
  })();
  inFlight.set(key, task);
  task.finally(() => inFlight.delete(key));
  return task;
}

// Temporary compatibility for the recovered screen; removed with the new UI.
export async function getNextTrains(from,to) {
 const result=await queryTrains({from,to});
 return (result.trains || []).map(t=>({...t,minutesLeft:t.minutesAtQuery,wagons:t.wagons ? `${t.wagons} vagones` : ''}));
}
