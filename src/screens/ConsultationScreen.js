import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, FlatList, Modal, RefreshControl, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ConfigScreen from './ConfigScreen';
import MapScreen from './MapScreen';
import { STATION_MAP } from '../data/stations';
import { C, s, Button, RouteHeading, TrainRow, DataStatus, TrainDetail, routeName } from '../components/TrainComponents';
import * as repository from '../services/favoritesRepository';
import * as service from '../services/trainService';
import { createConsultationController } from '../services/consultationController';
import { syncWidgets } from '../widgets/widgetRuntime';

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
      {selected ? <TrainDetail route={selected} entry={selectedEntry} settings={state.settings} onClose={() => setDetailId(null)} onRefresh={() => controller.refresh(selected.id)} /> : null}
    </Modal>
    <Modal visible={mapVisible} animationType="slide" onRequestClose={() => setMapVisible(false)}><MapScreen visible={mapVisible} onClose={() => setMapVisible(false)} /></Modal>
    <Modal visible={manager} animationType="slide" onRequestClose={() => { if (!managerBusy) setManager(false); }}>
      {manager ? <ConfigScreen onClose={() => setManager(false)} onBusyChange={setManagerBusy} /> : null}
    </Modal>
  </View>;
}
