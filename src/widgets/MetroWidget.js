import React from 'react';
import { PixelRatio } from 'react-native';
import { FlexWidget, TextWidget, ListWidget } from 'react-native-android-widget';
import { STATION_MAP } from '../data/stations';
import { errorMessage } from '../domain/trainModel';
const C = { bg: '#011228', surface: '#12283F', text: '#F5FAFF', muted: '#B7CADD', accent: '#60D7EF', line: '#28435D', warning: '#FFD18B' };
const timeOf = at => at ? new Date(at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—';
const queryDate = at => at ? new Date(at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '';
function Label({ text, size = 14, color = C.text, bold = false, ...props }) {
  return <TextWidget text={String(text)} style={{ fontSize: size, color, fontWeight: bold ? 'bold' : 'normal', ...props.style }} maxLines={props.maxLines} truncate="END" />;
}
function RouteNames({ route, size = 14 }) {
  return <FlexWidget style={{ flexDirection: 'column', width: 'match_parent' }}>
    <Label text={STATION_MAP[route.from] || route.from || 'Elige origen'} size={size} bold />
    <Label text={`→ ${STATION_MAP[route.to] || route.to || 'Elige destino'}`} size={size} />
  </FlexWidget>;
}
function TrainRow({ train, settings, fetchedAt }) {
  const date = train.serviceTime?.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  const dateLabel = date && `${date[3]}/${date[2]}` !== queryDate(fetchedAt) ? `${date[3]}/${date[2]} · ` : '';
  const extra = [settings.timeDisplayMode === 'minutes' && train.minutesAtQuery !== null ? `${train.minutesAtQuery} min al consultar` : '', settings.showWagons && train.wagons ? `${train.wagons} vagones` : ''].filter(Boolean).join(' · ');
  return <FlexWidget style={{ flexDirection: 'column', width: 'match_parent', paddingVertical: 11, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: C.line }} accessibilityLabel={`${dateLabel}${train.time}, hacia ${train.destination}${extra ? ', '+extra : ''}`}>
    <FlexWidget style={{ flexDirection: 'row', alignItems: 'center', width: 'match_parent' }}>
      <TextWidget text={train.time} style={{ fontSize: 25, color: C.text, fontWeight: 'bold', marginRight: 14 }} />
      <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
        <Label text={`Hacia ${train.destination}`} size={15} maxLines={3} />
        {dateLabel ? <Label text={dateLabel.replace(' · ', '')} size={12} color={C.muted} /> : null}
      </FlexWidget>
    </FlexWidget>
    {extra ? <Label text={extra} size={12} color={C.muted} style={{ marginTop: 5 }} /> : null}
  </FlexWidget>;
}
export default function MetroWidget({ info, favorites = [], state = {}, favorite, settings = {}, result = {} }) {
  const selector = state.view === 'favorites';
  const width = Math.floor(info?.width || 320), height = Math.floor(info?.height || 400);
  const scale = Math.max(1, PixelRatio.getFontScale() || 1);
  const headerHeight = Math.ceil((selector || !favorite ? 45 : 57 + (favorite.name ? 18 : 0)) * scale) + 8;
  const footerHeight = Math.ceil(46 * scale);
  const listHeight = Math.max(24, height - headerHeight - footerHeight - 28);
  const rows = result.trains || [];
  const status = result.status || 'idle';
  const banner = selector ? `${favorites.length} favoritos · toca para elegir` : status === 'loading' ? 'Actualizando…' : status === 'error' ? (rows.length ? 'Sin actualizar · consulta anterior' : errorMessage(result.kind)) : status === 'empty' ? 'Sin próximas salidas' : rows.length ? `${rows.length} trenes · desliza para ver todos` : 'Configura tus favoritos en la app';
  const timestamp = result.fetchedAt ? `${queryDate(result.fetchedAt)} ${timeOf(result.fetchedAt)}` : '—';
  return <FlexWidget style={{ width: 'match_parent', height: 'match_parent', flexDirection: 'column', padding: 12, backgroundColor: C.bg, borderRadius: 22 }} accessibilityLabel="Metro Bilbao, consulta de favoritos">
    <FlexWidget style={{ flexDirection: 'row', width: 'match_parent', height: headerHeight, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: C.line }}>
      <FlexWidget style={{ flex: 1, flexDirection: 'column', paddingRight: 8, paddingVertical: 4 }} clickAction={selector ? 'CLOSE_SELECTOR' : favorites.length ? 'OPEN_SELECTOR' : 'OPEN_APP'} accessibilityLabel={selector ? 'Cerrar selector sin cambiar trayecto' : 'Abrir selector de favoritos'}>
        {selector ? <Label text="Tus favoritos" size={18} bold /> : favorite ? <RouteNames route={favorite} /> : <Label text="Metro Bilbao" size={18} bold />}
        {!selector && favorite?.name ? <Label text={favorite.name} size={12} color={C.accent} maxLines={1} /> : null}
        {selector ? <Label text="Volver sin cambiar" size={12} color={C.accent} /> : null}
      </FlexWidget>
      <FlexWidget style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }} clickAction={selector ? 'CLOSE_SELECTOR' : 'REFRESH'} accessibilityLabel={selector ? 'Cerrar selector' : 'Actualizar trenes'}>
        <Label text={selector ? '×' : '↻'} size={25} color={C.accent} />
      </FlexWidget>
    </FlexWidget>
    <FlexWidget style={{ width: 'match_parent', height: listHeight, marginTop: 8 }}>
      {selector && favorites.length ? <ListWidget style={{ width: width - 24, height: listHeight }}>
        {favorites.map(f => <FlexWidget key={f.id} style={{ width: 'match_parent', flexDirection: 'column', paddingVertical: 14, paddingHorizontal: 12, backgroundColor: f.id === state.favoriteId ? C.surface : C.bg, borderBottomWidth: 1, borderBottomColor: C.line }} clickAction="SELECT_FAVORITE" clickActionData={{ favoriteId: f.id }} accessibilityLabel={`${f.id === state.favoriteId ? 'Seleccionado. ' : ''}${STATION_MAP[f.from] || f.from} a ${STATION_MAP[f.to] || f.to}${f.name ? ', '+f.name : ''}`}>
          <RouteNames route={f} size={16} />
          <Label text={`${f.id === state.favoriteId ? '✓ Seleccionado' : 'Elegir'}${f.name ? ' · '+f.name : ''}`} size={12} color={C.accent} maxLines={2} />
        </FlexWidget>)}
      </ListWidget> : !selector && rows.length ? <ListWidget style={{ width: width - 24, height: listHeight }}>
        {rows.map((t,i) => <TrainRow key={`${t.serviceTime}-${i}`} train={t} settings={settings} fetchedAt={result.fetchedAt} />)}
      </ListWidget> : <FlexWidget style={{ width: 'match_parent', height: 'match_parent', justifyContent: 'center', padding: 12 }}>
        <Label text={selector ? 'No tienes favoritos todavía.' : status === 'loading' ? 'Buscando próximos trenes…' : status === 'error' ? errorMessage(result.kind) : status === 'empty' ? 'El servicio no indica próximas salidas para este trayecto.' : 'Guarda un trayecto para empezar.'} size={16} color={status === 'error' ? C.warning : C.text} />
        <FlexWidget clickAction={favorite ? 'REFRESH' : 'OPEN_APP'} accessibilityLabel={favorite ? 'Reintentar consulta' : 'Configurar favoritos en la aplicación'} style={{ paddingVertical: 12 }}><Label text={favorite ? 'Toca para actualizar' : 'Abrir configuración'} size={14} color={C.accent} /></FlexWidget>
      </FlexWidget>}
    </FlexWidget>
    <FlexWidget style={{ width: 'match_parent', height: footerHeight, flexDirection: 'column', paddingTop: 7 }}>
      <Label text={banner} size={12} color={status === 'error' ? C.warning : C.muted} maxLines={1} />
      <Label text={`Consulta ${timestamp}`} size={12} color={C.muted} />
    </FlexWidget>
  </FlexWidget>;
}
