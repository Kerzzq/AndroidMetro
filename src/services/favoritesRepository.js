import AsyncStorage from '@react-native-async-storage/async-storage';
import { STATION_MAP } from '../data/stations';
import { migratePanels, validateDocument, reconcileInstance } from '../domain/favoritesModel';
const DOCUMENT_KEY = 'androidmetro_favorites_v1';
const instanceKey = id => `androidmetro_widget_${id}_v1`;
let queue = Promise.resolve();
function serial(operation) {
  const task = queue.then(operation);
  queue = task.catch(() => {});
  return task;
}
async function readDocument() {
  const raw = await AsyncStorage.getItem(DOCUMENT_KEY);
  if (raw !== null) return validateDocument(JSON.parse(raw));
  const [legacy, secondary, settings] = await AsyncStorage.multiGet(['metro_panels_config', 'widget_panels_config', 'metro_widget_settings']);
  // Preserve literal old values before writing the new schema. Never remove old keys.
  await AsyncStorage.setItem('androidmetro_migration_backup_v1', JSON.stringify({ panels: legacy[1], secondaryPanels: secondary[1], settings: settings[1] }));
  const document = migratePanels(JSON.parse(legacy[1] || secondary[1] || '[]'));
  await AsyncStorage.setItem(DOCUMENT_KEY, JSON.stringify(document));
  return document;
}
export const loadFavorites = () => serial(readDocument);
export const changeFavorites = operation => serial(async () => {
  const next = validateDocument(operation(await readDocument()));
  await AsyncStorage.setItem(DOCUMENT_KEY, JSON.stringify(next));
  return next;
});
export const loadInstance = (id, doc) => serial(async () => {
  const raw = await AsyncStorage.getItem(instanceKey(id));
  let saved = {};
  try { saved = raw ? JSON.parse(raw) : {}; } catch { /* Only disposable widget selection is repaired. */ }
  const state = reconcileInstance(doc, saved, STATION_MAP);
  if (!raw || JSON.stringify(saved) !== JSON.stringify(state)) await AsyncStorage.setItem(instanceKey(id), JSON.stringify(state));
  return state;
});
export const changeInstance = (id, patch) => serial(async () => {
  const doc = await readDocument();
  const raw = await AsyncStorage.getItem(instanceKey(id));
  let saved = {};
  try { saved = raw ? JSON.parse(raw) : {}; } catch { /* Recover selection only. */ }
  const state = reconcileInstance(doc, { ...saved, ...patch }, STATION_MAP);
  await AsyncStorage.setItem(instanceKey(id), JSON.stringify(state));
  return state;
});
export const deleteInstance = id => serial(() => AsyncStorage.removeItem(instanceKey(id)));
export async function loadSettings() {
  const raw = await AsyncStorage.getItem('metro_widget_settings');
  let settings = {};
  try { settings = raw ? JSON.parse(raw) : {}; } catch { /* Does not overwrite malformed legacy preferences. */ }
  return { showWagons: settings.showWagons !== false, timeDisplayMode: settings.timeDisplayMode === 'minutes' ? 'minutes' : 'clock' };
}
export const saveSettings = settings => serial(() => AsyncStorage.setItem('metro_widget_settings', JSON.stringify(settings)));
