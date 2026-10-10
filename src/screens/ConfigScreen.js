import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, FlatList, ActivityIndicator, Alert, Switch, StatusBar, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { requestWidgetUpdateById } from 'react-native-android-widget';
import { STATIONS, STATION_MAP } from '../data/stations';
import { normalizeSearch, upsertFavorite, moveFavorite, removeFavorite, routeProblem } from '../domain/favoritesModel';
import { errorMessage } from '../domain/trainModel';
import { loadFavorites, changeFavorites, loadInstance, changeInstance, loadSettings, saveSettings } from '../services/favoritesRepository';
import { queryTrains } from '../services/trainService';
import { syncWidgets, refreshWidget } from '../widgets/widgetRuntime';
const C = { bg: '#011228', surface: '#12283F', line: '#28435D', text: '#F5FAFF', muted: '#B7CADD', accent: '#60D7EF', danger: '#FFAEAE' };
const routeName = f => `${STATION_MAP[f.from] || f.from || 'Sin origen'} → ${STATION_MAP[f.to] || f.to || 'Sin destino'}`;
function Button({ text, onPress, label = text, disabled, danger, primary, style }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={[styles.button, primary && styles.primary, disabled && { opacity: .4 }, style]}><Text style={[styles.buttonText, primary && { color: C.bg }, danger && { color: C.danger }]}>{text}</Text></TouchableOpacity>;
}
export default function ConfigScreen({ widgetInfo, setResult, renderWidget, onClose, onBusyChange }) {
  const [document, setDocument] = useState(null), [settings, setSettings] = useState(null);
  const [selectedId, setSelectedId] = useState(null), [editor, setEditor] = useState(null);
  const [stationField, setStationField] = useState(null), [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState(''), [formError, setFormError] = useState(''), [showSettings, setShowSettings] = useState(false);
  useEffect(() => { let mounted = true; (async () => {
    try {
      const [doc, prefs] = await Promise.all([loadFavorites(), loadSettings()]);
      const instance = widgetInfo ? await loadInstance(widgetInfo.widgetId, doc) : null;
      if (mounted) { setDocument(doc); setSettings(prefs); setSelectedId(instance?.favoriteId); }
      if (!widgetInfo) { try { await syncWidgets(); } catch { if (mounted) setMessage('Favoritos cargados. Pulsa actualizar en el widget si no responde.'); } }
    } catch (e) { if (mounted) setError(e.message); }
  })(); return () => { mounted = false; }; }, []);
  useEffect(() => { onBusyChange?.(busy); }, [busy, onBusyChange]);
  async function notifyWidgets() {
    try { await syncWidgets(); } catch { setMessage('Guardado. No se pudo actualizar el widget; pulsa su botón de refresco.'); }
  }
  function edit(favorite) { setEditor({ ...favorite }); setFormError(''); setStationField(null); setSearch(''); }
  function add() { edit({ id: `fav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`, from: '', to: '', name: '' }); }
  function closeEditor() { if (busy) return; if (stationField) { setStationField(null); setSearch(''); Keyboard.dismiss(); } else { setEditor(null); setFormError(''); } }
  async function save() {
    Keyboard.dismiss();setFormError('');setBusy(true);
    try {
      upsertFavorite(document, editor, STATION_MAP);
      const previous = document.favorites.find(f => f.id === editor.id);
      if (!previous || previous.from !== editor.from || previous.to !== editor.to) {
        const validation = await queryTrains(editor);
        if (validation.status === 'error') throw new Error(`${errorMessage(validation.kind)} No se ha podido validar el trayecto; tu borrador se conserva.`);
      }
      const next = await changeFavorites(doc => upsertFavorite(doc, editor, STATION_MAP));
      setDocument(next);setEditor(null);setMessage('Favorito guardado.');await notifyWidgets();
    } catch (e) { setFormError(e.message); }
    finally { setBusy(false); }
  }
  async function move(f, direction) {
    setBusy(true);
    try { const next = await changeFavorites(doc => moveFavorite(doc, f.id, direction));setDocument(next);setMessage('Orden actualizado.');await notifyWidgets(); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  function confirmDelete(f) {
    Alert.alert('Eliminar favorito', `¿Eliminar ${routeName(f)}?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: async () => {
      setBusy(true);
      try { const next = await changeFavorites(doc => removeFavorite(doc, f.id));setDocument(next);if(selectedId===f.id)setSelectedId(next.favorites[0]?.id || null);setMessage('Favorito eliminado.');await notifyWidgets(); }
      catch(e) { setError(e.message); } finally { setBusy(false); }
    }}]);
  }
  async function preference(field, value) {
    setBusy(true);const next = { ...settings, [field]: value };
    try { await saveSettings(next);setSettings(next);setMessage('Preferencias guardadas.');await notifyWidgets(); }
    catch(e) { setError(e.message); } finally { setBusy(false); }
  }
  async function done() {
    setBusy(true);
    try {
      await changeInstance(widgetInfo.widgetId, { favoriteId: selectedId, view: 'trains' });
      // 0.20.1's configuration callback passes an unwrapped tree to native.
      // Use the public update API, which supplies the required light/dark envelope.
      const draw = component => requestWidgetUpdateById({ widgetName: widgetInfo.widgetName, widgetId: widgetInfo.widgetId, renderWidget: () => component });
      await refreshWidget(widgetInfo, draw, true);
      setResult('ok');
    } catch(e) { setError(e.message);setBusy(false); }
  }
  const favorites = document?.favorites || [];
  const filtered = STATIONS.filter(s => normalizeSearch(`${s.name} ${s.code}`).includes(normalizeSearch(search)));
  return <View style={styles.screen}>
    <StatusBar barStyle="light-content" />
    <View style={styles.header}>
      <View style={{ flex: 1 }}><Text style={styles.title}>{onClose ? 'Gestionar favoritos' : 'Tus trayectos'}</Text><Text style={styles.subtitle}>{widgetInfo ? 'Elige el favorito de este widget' : `${favorites.length} de 10 favoritos`}</Text></View>
      {widgetInfo ? <Button text="Listo" primary onPress={done} disabled={busy || !document} /> : <Button text="Añadir" primary onPress={add} disabled={busy || !document || favorites.length >= 10} />}
    </View>
    {onClose ? <View style={{paddingHorizontal:16}}><Button text="Volver a consultar" onPress={onClose} disabled={busy} /></View> : null}
    {error ? <View style={styles.feedback}><Text style={{ color: C.danger }}>{error}</Text></View> : null}
    {message ? <View style={styles.feedback}><Text accessibilityLiveRegion="polite" style={styles.message}>{message}</Text></View> : null}
    {!document && !error ? <ActivityIndicator size="large" color={C.accent} /> : null}
    <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
      {!favorites.length && document ? <View style={styles.card}><Text style={styles.sectionTitle}>Tu próximo metro, a un toque</Text><Text style={styles.paragraph}>Guarda origen y destino para consultar trenes en la app y, si lo usas, en el widget.</Text><Button text="Crear primer favorito" primary onPress={add} disabled={busy} /></View> : null}
      {favorites.map((f,index) => <View key={f.id} style={[styles.card, widgetInfo && f.id === selectedId && styles.selected]}>
        <TouchableOpacity accessibilityRole={widgetInfo ? 'radio' : 'button'} accessibilityState={{ checked: f.id === selectedId }} accessibilityLabel={`${widgetInfo && f.id === selectedId ? 'Seleccionado. ' : ''}${routeName(f)}${f.name ? ', '+f.name : ''}`} onPress={() => widgetInfo ? setSelectedId(f.id) : edit(f)} disabled={busy}>
          <Text style={styles.route}>{STATION_MAP[f.from] || f.from || 'Elige origen'}</Text><Text style={styles.route}>→ {STATION_MAP[f.to] || f.to || 'Elige destino'}</Text>
          {f.name ? <Text style={styles.alias}>{f.name}</Text> : null}
          {routeProblem(f, STATION_MAP) ? <Text style={{ color: C.danger, marginTop: 8 }}>Trayecto conservado: necesita revisión</Text> : null}
          {widgetInfo && f.id === selectedId ? <Text style={styles.alias}>✓ Seleccionado para este widget</Text> : null}
        </TouchableOpacity>
        <View style={styles.actions}>
          <Button text="↑" label={`Subir favorito ${f.id}`} onPress={() => move(f,-1)} disabled={busy || index === 0} />
          <Button text="↓" label={`Bajar favorito ${f.id}`} onPress={() => move(f,1)} disabled={busy || index === favorites.length-1} />
          <Button text="Editar" label={`Editar favorito ${f.id}`} onPress={() => edit(f)} disabled={busy} />
          <Button text="Eliminar" label={`Eliminar favorito ${f.id}`} danger onPress={() => confirmDelete(f)} disabled={busy} />
        </View>
      </View>)}
      {widgetInfo && favorites.length > 0 ? <Button text="Añadir favorito" onPress={add} disabled={busy || favorites.length >= 10} /> : null}
      {settings ? <View style={styles.card}>
        <Button text={showSettings ? 'Cerrar opciones del widget' : 'Opciones del widget'} onPress={() => setShowSettings(!showSettings)} />
        {showSettings ? <View>
          <View style={styles.preference}><Text style={styles.paragraph}>Mostrar vagones</Text><Switch accessibilityLabel="Mostrar vagones" value={settings.showWagons} onValueChange={v => preference('showWagons',v)} disabled={busy} trackColor={{true:C.accent,false:C.line}} /></View>
          <View style={styles.preference}><Text style={[styles.paragraph,{flex:1}]}>Minutos al consultar</Text><Switch accessibilityLabel="Minutos al consultar" value={settings.timeDisplayMode==='minutes'} onValueChange={v => preference('timeDisplayMode',v?'minutes':'clock')} disabled={busy} trackColor={{true:C.accent,false:C.line}} /></View>
          <Text style={styles.hint}>Las horas previstas permanecen visibles. Los minutos son la estimación de la última consulta, no un contador. El widget indica cuándo se consultó.</Text>
        </View> : null}
      </View> : null}
      <Text style={styles.hint}>{onClose ? "Los favoritos se comparten con el widget. La opción de vagones y minutos también se aplica a las tarjetas de consulta. Puedes usar la app sin añadir ningún widget." : "Añade «Metro Bilbao (pruebas)» desde los widgets del lanzador. Toca el trayecto para elegir otro favorito y desliza la lista para ver todos los trenes."}</Text>
      {widgetInfo ? <Button text="Cancelar configuración" onPress={() => setResult('cancel')} disabled={busy} /> : null}
    </ScrollView>
    <Modal visible={!!editor} animationType="slide" onRequestClose={closeEditor}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}><Text style={[styles.sectionTitle,{flex:1}]}>{stationField ? stationField === 'from' ? 'Elige origen' : 'Elige destino' : 'Editar trayecto'}</Text><Button text={stationField ? 'Volver' : 'Cancelar'} onPress={closeEditor} disabled={busy} /></View>
        {stationField ? <View style={{flex:1,padding:16}}>
          <TextInput accessibilityLabel="Buscar estación" style={styles.input} placeholder="Buscar estación…" placeholderTextColor={C.muted} value={search} onChangeText={setSearch} autoCorrect={false} />
          <FlatList data={filtered} keyboardShouldPersistTaps="handled" keyExtractor={s=>s.code} ListEmptyComponent={<Text style={styles.paragraph}>No se encontraron estaciones. Prueba otro nombre.</Text>} renderItem={({item}) => <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Estación ${item.name}`} style={styles.station} onPress={()=>{setEditor(d=>({...d,[stationField]:item.code}));setStationField(null);setSearch('');Keyboard.dismiss();}}><Text style={styles.route}>{item.name}</Text></TouchableOpacity>} />
        </View> : editor ? <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Origen</Text><Button text={STATION_MAP[editor.from] || 'Selecciona origen'} label="Seleccionar origen" style={styles.field} onPress={()=>{setStationField('from');setSearch('');}} disabled={busy} />
          <Text style={styles.fieldLabel}>Destino</Text><Button text={STATION_MAP[editor.to] || 'Selecciona destino'} label="Seleccionar destino" style={styles.field} onPress={()=>{setStationField('to');setSearch('');}} disabled={busy} />
          <Button text="Intercambiar origen y destino" onPress={()=>setEditor(d=>({...d,from:d.to,to:d.from}))} disabled={busy} />
          <Text style={styles.fieldLabel}>Nombre opcional</Text><TextInput accessibilityLabel="Nombre del favorito" style={styles.input} value={editor.name} onChangeText={name=>setEditor(d=>({...d,name}))} maxLength={80} placeholder="Por ejemplo, Trabajo" placeholderTextColor={C.muted} editable={!busy} />
          <Text style={styles.hint}>Sin nombre, se identifica por origen y destino. Las estaciones siguen visibles aunque añadas un nombre.</Text>
          {formError ? <Text accessibilityLiveRegion="polite" style={[styles.paragraph,{color:C.danger}]}>{formError}</Text> : null}
          {busy ? <View style={styles.preference}><ActivityIndicator color={C.accent} /><Text style={styles.paragraph}>Validando y guardando…</Text></View> : null}
          <Button text="Guardar favorito" primary onPress={save} disabled={busy} />
        </ScrollView> : null}
      </KeyboardAvoidingView>
    </Modal>
  </View>;
}
const styles=StyleSheet.create({
 screen:{flex:1,backgroundColor:C.bg,paddingTop:(StatusBar.currentHeight||24)+8,paddingBottom:24},
 header:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:C.line},
 title:{color:C.text,fontSize:24,fontWeight:'700'},subtitle:{color:C.muted,fontSize:14,marginTop:4},
 body:{padding:16,paddingBottom:48,gap:12},card:{backgroundColor:C.surface,borderRadius:16,padding:16,borderWidth:1,borderColor:C.line},selected:{borderColor:C.accent,borderWidth:2},
 route:{color:C.text,fontSize:18,fontWeight:'600',lineHeight:26},alias:{color:C.accent,fontSize:15,marginTop:6},
 sectionTitle:{color:C.text,fontSize:21,fontWeight:'700'},paragraph:{color:C.text,fontSize:16,lineHeight:24,marginVertical:10},hint:{color:C.muted,fontSize:14,lineHeight:21,marginVertical:8},
 actions:{flexDirection:'row',flexWrap:'wrap',gap:4,marginTop:10},button:{minWidth:48,minHeight:48,justifyContent:'center',alignItems:'center',paddingHorizontal:10,paddingVertical:10,borderRadius:10},buttonText:{color:C.accent,fontSize:15,fontWeight:'600'},primary:{backgroundColor:C.accent},
 field:{backgroundColor:C.surface,alignItems:'flex-start',padding:16,borderWidth:1,borderColor:C.line},fieldLabel:{color:C.muted,fontSize:14,marginBottom:6},
 input:{backgroundColor:C.surface,color:C.text,fontSize:17,minHeight:52,paddingHorizontal:14,paddingVertical:12,borderRadius:10,borderWidth:1,borderColor:C.line,marginBottom:10},
 station:{paddingVertical:16,paddingHorizontal:12,minHeight:56,borderBottomWidth:1,borderBottomColor:C.line},preference:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12},feedback:{paddingHorizontal:18,paddingVertical:9},message:{color:C.accent,fontSize:14}
});
