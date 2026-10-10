import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Modal, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfigScreen from './ConfigScreen';
import MapScreen from './MapScreen';
import { STATION_MAP } from '../data/stations';
import { errorMessage } from '../domain/trainModel';
import * as repository from '../services/favoritesRepository';
import * as service from '../services/trainService';
import { createConsultationController } from '../services/consultationController';
import { syncWidgets } from '../widgets/widgetRuntime';

const C = { bg: '#011228', surface: '#12283F', line: '#28435D', text: '#F5FAFF', muted: '#B7CADD', accent: '#60D7EF', warning: '#FFD391' };
const routeName = f => `${STATION_MAP[f.from] || f.from || 'Sin origen'} → ${STATION_MAP[f.to] || f.to || 'Sin destino'}`;
function Button({ text, label = text, onPress, disabled, primary = false }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[s.button, primary && s.primary, disabled && s.disabled]}><Text style={[s.buttonText, primary && { color: C.bg }]}>{text}</Text></TouchableOpacity>;
}
function queryTime(timestamp) {
  if (!Number.isFinite(timestamp)) return null;
  const format = { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' };
  const dateFormat = { timeZone: 'Europe/Madrid', day: '2-digit', month: '2-digit' };
  const date = new Date(timestamp);
  const sameDay = date.toLocaleDateString('es-ES', dateFormat) === new Date().toLocaleDateString('es-ES', dateFormat);
  return `${sameDay ? '' : date.toLocaleDateString('es-ES', dateFormat) + ' · '}${date.toLocaleTimeString('es-ES', format)}`;
}
function RouteHeading({ favorite, full = false }) {
  return <View>
    {favorite.name ? <Text style={s.alias} numberOfLines={full ? undefined : 2}>{favorite.name}</Text> : null}
    <Text style={s.route}>{STATION_MAP[favorite.from] || favorite.from || 'Sin origen'}</Text>
    <Text style={s.route}>→ {STATION_MAP[favorite.to] || favorite.to || 'Sin destino'}</Text>
  </View>;
}
function TrainRow({ train, settings, first }) {
  return <View style={s.train}>
    <Text style={[s.trainTime, first && s.firstTime]}>{train.time}</Text>
    <View style={s.trainInfo}>
      <Text style={s.destination}>Hacia {train.destination}</Text>
      {settings?.showWagons && train.wagons ? <Text style={s.secondary}>{train.wagons} vagones</Text> : null}
      {settings?.timeDisplayMode === 'minutes' && train.minutesAtQuery !== null ? <Text style={s.secondary}>{train.minutesAtQuery} min al consultar</Text> : null}
    </View>
  </View>;
}
function DataStatus({ entry, now }) {
  const data = entry?.data, timestamp = queryTime(data?.fetchedAt);
  const old = data?.fetchedAt && now - data.fetchedAt >= 120000;
  return <View accessibilityLiveRegion="polite" style={s.status}>
    {timestamp ? <Text style={s.secondary}>Consulta · {timestamp} · hora de Bilbao</Text> : null}
    {entry?.loading ? <View style={s.loadingRow}><ActivityIndicator size="small" color={C.accent} /><Text style={s.secondary}>Actualizando…</Text></View> : null}
    {data?.status === 'error' ? <Text style={s.warning}>{errorMessage(data.kind)}</Text> : null}
    {data?.fetchedAt && (old || data.status === 'error') ? <Text style={s.warning}>Datos de una consulta anterior. Actualiza antes de viajar.</Text> : null}
    {data?.cacheWarning ? <Text style={s.warning}>Consulta recibida; no se pudo guardar para usarla sin conexión.</Text> : null}
    {data?.status === 'empty' && !entry?.loading ? <Text style={s.secondary}>No hay próximos trenes para este trayecto en esta consulta.</Text> : null}
    {!data && !entry?.loading ? <Text style={s.secondary}>Todavía no hay una consulta. Pulsa refrescar.</Text> : null}
  </View>;
}
export default function ConsultationScreen() {
  const [state, setState] = useState({ document: null, settings: null, entries: {}, loading: true, refreshing: false, error: '' });
  const [mapVisible, setMapVisible] = useState(false);
  const [manager, setManager] = useState(false), [detailId, setDetailId] = useState(null);
  const [managerBusy, setManagerBusy] = useState(false), [displayTime, setDisplayTime] = useState(Date.now());
  const controllerRef = useRef(null);
  if (!controllerRef.current) controllerRef.current = createConsultationController({ repository, service, onChange: setState });
  const controller = controllerRef.current;
  useEffect(() => {
    if (manager || mapVisible) return;
    let previous = AppState.currentState;
    let ageTimer;
    function resume() {
      clearInterval(ageTimer);
      setDisplayTime(Date.now());
      // Repaint age only: no API polling, and no timer while in the background.
      ageTimer = setInterval(() => setDisplayTime(Date.now()), 30000);
      controller.start();
    }
    resume();
    // Restore the existing widget actions after Android force-stop, as the old home did.
    syncWidgets().catch(() => {});
    const subscription = AppState.addEventListener('change', next => {
      if (next === 'active' && previous !== 'active') resume();
      else if (next !== 'active') { clearInterval(ageTimer); controller.stop(); }
      previous = next;
    });
    return () => { subscription.remove(); clearInterval(ageTimer); controller.stop(); };
  }, [manager, mapVisible, controller]);
  const favorites = state.document?.favorites || [];
  const selected = favorites.find(f => f.id === detailId);
  const selectedEntry = selected ? state.entries[selected.id] : null;
  function openManager() { setDetailId(null); setManagerBusy(false); setManager(true); }
  return <View style={s.screen}>
    <StatusBar barStyle="light-content" />
    <View style={s.header}><View style={s.headerTitle}><Text style={s.title}>Tu próximo metro</Text><Text style={s.secondary}>Tus trayectos de Metro Bilbao</Text></View><Button text="Mapa" onPress={() => setMapVisible(true)} /><Button text="Gestionar" onPress={openManager} /></View>
    {state.error ? <View style={s.feedback}><Text style={s.warning}>{state.error}</Text><Button text="Reintentar" onPress={() => controller.start(true)} /></View> : null}
    {state.loading && !state.document ? <ActivityIndicator size="large" color={C.accent} style={s.initialLoading} /> : null}
    <FlatList data={favorites} keyExtractor={f => f.id} contentContainerStyle={s.body}
      refreshControl={<RefreshControl refreshing={state.refreshing} onRefresh={() => controller.start(true)} tintColor={C.accent} colors={[C.accent]} />}
      ListHeaderComponent={favorites.length ? <Text style={s.hint}>Desliza hacia abajo para actualizar tus trayectos.</Text> : null}
      ListEmptyComponent={state.document ? <View style={s.card}><Text style={s.route}>¿Cuál es tu trayecto habitual?</Text><Text style={s.paragraph}>Guarda origen y destino para ver aquí los próximos trenes cada vez que abras la app.</Text><Button text="Añadir mi primer trayecto" primary onPress={openManager} /><Text style={s.hint}>También podrás consultarlo desde el widget si lo añades a tu pantalla de inicio.</Text></View> : null}
      renderItem={({ item: favorite }) => {
        const entry = state.entries[favorite.id], trains = entry?.data?.trains || [];
        return <View style={s.card}>
          <RouteHeading favorite={favorite} />
          <DataStatus entry={entry} now={displayTime} />
          {trains.slice(0, 3).map((train, index) => <TrainRow key={index} train={train} settings={state.settings} first={index === 0} />)}
          <View style={s.actions}>
            <Button text={entry?.loading ? 'Consultando…' : 'Refrescar'} label={`Refrescar ${routeName(favorite)}`} disabled={entry?.loading} onPress={() => controller.refresh(favorite.id)} />
            <Button text={trains.length ? `Ver ${trains.length > 3 ? 'los ' : ''}${trains.length} trenes` : 'Ver trayecto'} label={`Ver todos los trenes de ${routeName(favorite)}`} onPress={() => setDetailId(favorite.id)} />
          </View>
        </View>;
      }}
      ListFooterComponent={favorites.length ? <Text style={s.hint}>Horas previstas del servicio. Cada tarjeta indica cuándo se consultó. En Gestionar puedes añadir, editar y ordenar tus favoritos y acceder a las opciones del widget.</Text> : null} />
    <Modal visible={!!selected && !manager} animationType="slide" onRequestClose={() => setDetailId(null)}>
      <View style={s.screen}>
        <View style={s.header}><Text style={[s.title, s.headerTitle]}>Próximos trenes</Text><Button text="Volver" onPress={() => setDetailId(null)} /></View>
        {selected ? <FlatList data={selectedEntry?.data?.trains || []} keyExtractor={(_, i) => String(i)} contentContainerStyle={s.body}
          ListHeaderComponent={<View><RouteHeading favorite={selected} full /><DataStatus entry={selectedEntry} now={displayTime} /><View style={s.detailActions}><Text style={s.secondary}>Todos los resultados del servicio</Text><Button text="Refrescar" label={`Refrescar ${routeName(selected)}`} disabled={selectedEntry?.loading} onPress={() => controller.refresh(selected.id)} /></View></View>}
          renderItem={({ item, index }) => <TrainRow train={item} settings={state.settings} first={index === 0} />}
          ListFooterComponent={<Text style={s.hint}>La dirección indica el destino anunciado del tren. Las horas y, si están activados, los minutos corresponden a la consulta indicada.</Text>} /> : null}
      </View>
    </Modal>
    <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}><MapScreen onClose={() => setMapVisible(false)} /></Modal>
    <Modal visible={manager} animationType="slide" onRequestClose={() => { if (!managerBusy) setManager(false); }}>
      {manager ? <ConfigScreen onClose={() => setManager(false)} onBusyChange={setManagerBusy} /> : null}
    </Modal>
  </View>;
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg, paddingTop: (StatusBar.currentHeight || 24) + 8, paddingBottom: 24 },
  header: { paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  headerTitle: { flex: 1 }, title: { color: C.text, fontSize: 23, fontWeight: '700' },
  body: { padding: 16, paddingBottom: 40, gap: 16 }, card: { backgroundColor: C.surface, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.line },
  alias: { color: C.accent, fontSize: 15, marginBottom: 8 }, route: { color: C.text, fontSize: 20, fontWeight: '600' },
  secondary: { color: C.muted, fontSize: 14, marginTop: 4 }, hint: { color: C.muted, fontSize: 14 }, paragraph: { color: C.text, fontSize: 16, marginVertical: 16 },
  train: { flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.line },
  trainTime: { color: C.text, fontSize: 23, fontWeight: '600', fontVariant: ['tabular-nums'] }, firstTime: { color: C.accent, fontSize: 27, fontWeight: '700' },
  trainInfo: { flex: 1, minWidth: 110 }, destination: { color: C.text, fontSize: 16 },
  status: { marginTop: 8, marginBottom: 12, gap: 4 }, loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, warning: { color: C.warning, fontSize: 14 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4, marginTop: 4 },
  detailActions: { marginVertical: 12, gap: 4 }, button: { minHeight: 48, minWidth: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  buttonText: { color: C.accent, fontSize: 15, fontWeight: '600' }, primary: { backgroundColor: C.accent }, disabled: { opacity: .45 }, feedback: { padding: 16 }, initialLoading: { marginTop: 24 },
});
