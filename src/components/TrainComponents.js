import React, {useEffect,useState} from 'react';
import {ActivityIndicator,FlatList,StatusBar,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {STATION_MAP} from '../data/stations';
import {errorMessage} from '../domain/trainModel';
export const C = { bg: '#011228', surface: '#12283F', line: '#28435D', text: '#F5FAFF', muted: '#B7CADD', accent: '#60D7EF', warning: '#FFD391' };
export const routeName = f => `${STATION_MAP[f.from] || f.from || 'Sin origen'} → ${STATION_MAP[f.to] || f.to || 'Sin destino'}`;
export function Button({ text, label = text, onPress, disabled, primary = false }) {
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
export function RouteHeading({ favorite, full = false, names = STATION_MAP }) {
  return <View>
    {favorite.name ? <Text style={s.alias} numberOfLines={full ? undefined : 2}>{favorite.name}</Text> : null}
    <Text style={s.route}>{names[favorite.from] || favorite.from || 'Sin origen'}</Text>
    <Text style={s.route}>→ {names[favorite.to] || favorite.to || 'Sin destino'}</Text>
  </View>;
}
export function TrainRow({ train, settings, first }) {
  return <View style={s.train}>
    <Text style={[s.trainTime, first && s.firstTime]}>{train.time}</Text>
    <View style={s.trainInfo}>
      <Text style={s.destination}>Hacia {train.destination}</Text>
      {settings?.showWagons && train.wagons ? <Text style={s.secondary}>{train.wagons} vagones</Text> : null}
      {settings?.timeDisplayMode === 'minutes' && train.minutesAtQuery !== null ? <Text style={s.secondary}>{train.minutesAtQuery} min al consultar</Text> : null}
    </View>
  </View>;
}
export function DataStatus({ entry, now }) {
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
export function TrainDetail({ route, entry, settings, onClose, onRefresh, names = STATION_MAP, mapRoute = false }) {
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{setNow(Date.now());const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
  return <View style={s.screen}><StatusBar barStyle="light-content" />
    <View style={s.header}><Text style={[s.title,s.headerTitle]}>Próximos trenes</Text><Button text="Volver" onPress={onClose} /></View>
    <FlatList data={entry?.data?.trains||[]} keyExtractor={(_,i)=>String(i)} contentContainerStyle={s.body}
      ListHeaderComponent={<View><RouteHeading favorite={route} full names={names} /><DataStatus entry={entry} now={now} /><View style={s.detailActions}><Text style={s.secondary}>Todos los resultados del servicio{entry?.data?.trains ? ' · '+entry.data.trains.length : ''}</Text><Button text="Refrescar" disabled={entry?.loading} onPress={onRefresh} /></View></View>}
      renderItem={({item,index})=><TrainRow train={item} settings={settings} first={index===0} />}
      ListFooterComponent={<Text style={s.hint}>{mapRoute?'El mapa resalta la conexión física; no garantiza tren directo. ':''}La dirección indica el destino anunciado del tren. Las horas y, si están activados, los minutos corresponden a la consulta indicada.</Text>} />
  </View>;
}
export const s = StyleSheet.create({
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
