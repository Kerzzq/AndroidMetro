import React, { useEffect, useRef, useState } from 'react';
import { AppState, FlatList, Keyboard, Modal, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import MetroMap from '../components/MetroMap';
import SafeScreen from '../components/SafeScreen';
import { idlePinch, pinchPointers, anchorPinch, updatePinch } from '../domain/mapCamera';
import { data, stations, hitStations, selectStation } from '../domain/mapModel';
import { normalizeSearch } from '../domain/favoritesModel';
import { TrainDetail } from '../components/TrainComponents';
import { createMapQueryController } from '../services/mapQueryController';
import { saveMapFavorite } from '../services/saveMapFavorite';
import * as repository from '../services/favoritesRepository';
import * as service from '../services/trainService';
import { syncWidgets } from '../widgets/widgetRuntime';
const mapNames=Object.fromEntries(data.stations.map(st=>[st.id,st.displayName]));
export function MapButton({ text, label = text, onPress, disabled, primary }) {
  return <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress} style={[s.button, primary && s.primary, disabled && { opacity: .4 }]}><Text style={[s.buttonText, primary && { color: '#011228' }]}>{text}</Text></TouchableOpacity>;
}
export default function MapScreen({ onClose, visible }) {
  const [selection, setSelection] = useState({ from: null, to: null, editing: 'from', error: '' });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [picker, setPicker] = useState(null), [search, setSearch] = useState('');
  const [entry,setEntry]=useState({key:null,data:null,loading:false}),[results,setResults]=useState(false),[settings,setSettings]=useState(null);
  const [saveDraft,setSaveDraft]=useState(null),[alias,setAlias]=useState(''),[saving,setSaving]=useState(false),[saveError,setSaveError]=useState(''),[message,setMessage]=useState('');
  const controllerRef=useRef(null);
  if(!controllerRef.current)controllerRef.current=createMapQueryController({service,onChange:setEntry});
  const controller=controllerRef.current;
  const route={from:selection.from,to:selection.to},key=route.from&&route.to?`${route.from}/${route.to}`:null;
  const currentEntry=entry.key===key?entry:{key,data:null,loading:false};
  useEffect(()=>{controller.select(key?route:null);setMessage('');},[key,controller]);
  useEffect(()=>{
    if(!visible){controller.stop();return;}
    controller.activate();let alive=true;
    repository.loadSettings().then(value=>{if(alive)setSettings(value);}).catch(()=>{});
    const sub=AppState.addEventListener('change',next=>{if(next==='active')controller.activate();else controller.stop();});
    return()=>{alive=false;sub.remove();controller.stop();};
  },[visible,controller]);
  async function save() {
    if(saving)return;
    Keyboard.dismiss();setSaving(true);setSaveError('');
    try {
      const saved=await saveMapFavorite({route:saveDraft,name:alias,repository,service,syncWidgets});
      setSaveDraft(null);setMessage(saved.widgetWarning?'Favorito guardado. Actualiza el widget si no responde.':'Favorito guardado.');
    } catch(error){setSaveError(error.message);}
    finally{setSaving(false);}
  }
  const scale = useSharedValue(1), tx = useSharedValue(0), ty = useSharedValue(0);
  const minScale = useSharedValue(.1), vw = useSharedValue(0), vh = useSharedValue(0);
  const startX = useSharedValue(0), startY = useSharedValue(0);
  const pinchSession = useSharedValue(idlePinch());
  function fit(width = viewport.width, height = viewport.height) {
    if (!width || !height) return;
    vw.value=width; vh.value=height;
    const fitted=Math.min((width-24)/2420,(height-24)/560);
    minScale.value=fitted; scale.value=fitted;
    tx.value=(width-2420*fitted)/2; ty.value=(height-560*fitted)/2;
  }
  function focusStation(id) {
    if (!id || !viewport.width) return;
    const st=stations[id], z=Math.min(1.3,Math.max(.85,scale.value));
    const w=2420*z,h=560*z;
    const x=viewport.width/2-st.x*z,y=viewport.height/2-st.y*z;
    tx.value=w<viewport.width?(viewport.width-w)/2:Math.min(24,Math.max(viewport.width-w-24,x));
    ty.value=h<viewport.height?(viewport.height-h)/2:Math.min(24,Math.max(viewport.height-h-24,y));scale.value=z;
  }
  function choose(id) { setSelection(previous => selectStation(previous, id)); setPicker(null); }
  function tap(x,y,z,xOffset,yOffset) {
    const candidates=hitStations(x,y,z,xOffset,yOffset);
    if(candidates.length===1) choose(candidates[0].id);
    else if(candidates.length>1) { setSearch('');setPicker(candidates); }
  }
  function clampCamera() {
    'worklet';
    const w=2420*scale.value,h=560*scale.value;
    tx.value=w<vw.value?(vw.value-w)/2:Math.min(24,Math.max(vw.value-w-24,tx.value));
    ty.value=h<vh.value?(vh.value-h)/2:Math.min(24,Math.max(vh.value-h-24,ty.value));
  }
  const pan=Gesture.Pan().maxPointers(1).minDistance(8)
    .onStart(()=>{startX.value=tx.value;startY.value=ty.value;})
    .onUpdate(e=>{
      if(pinchSession.value.active || e.numberOfPointers!==1)return;
      tx.value=startX.value+e.translationX;ty.value=startY.value+e.translationY;clampCamera();
    });
  const pinch=Gesture.Pinch()
    .onTouchesDown(e=>{pinchSession.value=pinchPointers(pinchSession.value,e.numberOfTouches);})
    .onTouchesUp(e=>{pinchSession.value=pinchPointers(pinchSession.value,e.numberOfTouches);})
    .onStart(e=>{pinchSession.value=anchorPinch({scale:scale.value,x:tx.value,y:ty.value},e,pinchSession.value.pointers);})
    .onUpdate(e=>{
      const next=updatePinch(pinchSession.value,{scale:scale.value,x:tx.value,y:ty.value},e,minScale.value);
      pinchSession.value=next.session;
      scale.value=next.camera.scale;tx.value=next.camera.x;ty.value=next.camera.y;clampCamera();
    })
    .onTouchesCancelled(()=>{pinchSession.value=idlePinch();})
    .onFinalize(()=>{pinchSession.value=idlePinch();});
  const press=Gesture.Tap().maxDistance(8).onEnd((e,success)=>{if(success)runOnJS(tap)(e.x,e.y,scale.value,tx.value,ty.value);});
  const camera=useAnimatedStyle(()=>({ transform:[{translateX:tx.value},{translateY:ty.value},{scale:scale.value}] }));
  function zoom(multiplier) {
    const z=Math.min(2,Math.max(minScale.value,scale.value*multiplier));
    const nextX=viewport.width/2-(viewport.width/2-tx.value)*z/scale.value;
    const nextY=viewport.height/2-(viewport.height/2-ty.value)*z/scale.value;
    // Same boundary policy as the native gesture callbacks.
    const w=2420*z,h=560*z;
    tx.value=w<viewport.width?(viewport.width-w)/2:Math.min(24,Math.max(viewport.width-w-24,nextX));
    ty.value=h<viewport.height?(viewport.height-h)/2:Math.min(24,Math.max(viewport.height-h-24,nextY));scale.value=z;
  }
  const list=(picker||data.stations).filter(st=>normalizeSearch(st.displayName).includes(normalizeSearch(search))).sort((a,b)=>a.displayName.localeCompare(b.displayName,'es'));
  return <GestureHandlerRootView style={s.screen}><SafeScreen>
    <StatusBar barStyle="light-content" />
    <View style={s.header}><MapButton text="Volver" onPress={onClose} /><Text style={s.title}>Mapa</Text><MapButton text="RESET" label="Borrar origen y destino" onPress={()=>setSelection({from:null,to:null,editing:'from',error:''})} /></View>
    <View style={s.selection}>
      {['from','to'].map((key,index)=><TouchableOpacity key={key} style={[s.stationField,selection.editing===key&&s.activeField]} accessibilityRole="button" accessibilityLabel={`${index?'Destino':'Origen'}: ${stations[selection[key]]?.displayName||'sin seleccionar'}. Cambiar por nombre`} onPress={()=>{setSelection(prev=>({...prev,editing:key,error:''}));setSearch('');setPicker(data.stations);}}>
        <Text style={[s.caption,{color:index?'#FFD391':'#60D7EF'}]}>{index?'DESTINO':'ORIGEN'}</Text><Text style={s.fieldText} numberOfLines={2}>{stations[selection[key]]?.displayName||'Elegir estación'}</Text>
      </TouchableOpacity>)}
      <MapButton text="⇄" label="Intercambiar origen y destino" disabled={!selection.from||!selection.to} onPress={()=>setSelection(prev=>({...prev,from:prev.to,to:prev.from,error:''}))} />
    </View>
    {selection.error?<Text accessibilityLiveRegion="polite" style={s.warning}>{selection.error}</Text>:null}
    <View style={s.map} onLayout={e=>{const{width,height}=e.nativeEvent.layout;setViewport({width,height});fit(width,height);}}>
      <GestureDetector gesture={Gesture.Race(Gesture.Simultaneous(pan,pinch),press)}><View style={s.canvas} collapsable={false} accessibilityLabel="Mapa esquemático L1 y L2. Usa los campos origen y destino para seleccionar por nombre.">
        <Animated.View style={[s.drawing,camera]} pointerEvents="none"><MetroMap from={selection.from} to={selection.to} /></Animated.View>
      </View></GestureDetector>
      <View style={[s.controls,viewport.width>viewport.height && {flexDirection: 'row'}]}><MapButton text="−" label="Alejar mapa" onPress={()=>zoom(1/1.6)} /><MapButton text="+" label="Ampliar mapa" onPress={()=>zoom(1.6)} /><MapButton text="⌖" label="Ver mapa completo" onPress={()=>fit()} /></View>
    </View>
    <ScrollView style={s.footer} contentContainerStyle={{paddingHorizontal:8}} keyboardShouldPersistTaps="handled"><Text accessibilityLiveRegion="polite" style={s.hint}>{message||(key?'Recorrido físico · consulta el servicio':'Selecciona '+(selection.editing==='from'?'origen':'destino'))}</Text><View style={s.footerActions}><MapButton text="Origen" label="Cambiar origen en el mapa" onPress={()=>{setSelection(prev=>({...prev,editing:'from',error:''}));focusStation(selection.from);}} /><MapButton text="Destino" label="Cambiar destino en el mapa" onPress={()=>{setSelection(prev=>({...prev,editing:'to',error:''}));focusStation(selection.to);}} /><MapButton text="Consultar" primary disabled={!key} onPress={()=>{setResults(true);controller.query();}} /><MapButton text="Guardar" label="Guardar trayecto como favorito" disabled={!key} onPress={()=>{setSaveDraft({...route});setAlias('');setSaveError('');}} /></View></ScrollView>
    <Modal visible={results} animationType="slide" onRequestClose={()=>setResults(false)}>{results?<TrainDetail route={route} entry={currentEntry} settings={settings} names={mapNames} mapRoute onClose={()=>setResults(false)} onRefresh={()=>controller.query()} />:null}</Modal>
    <Modal visible={!!saveDraft} animationType="slide" onRequestClose={()=>{if(!saving)setSaveDraft(null);}}><SafeScreen avoidKeyboard><View style={s.header}><Text style={s.title}>Guardar favorito</Text><MapButton text="Volver" disabled={saving} onPress={()=>setSaveDraft(null)} /></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{padding:16}}><Text style={s.fieldText}>{mapNames[saveDraft?.from]} → {mapNames[saveDraft?.to]}</Text><TextInput disableFullscreenUI accessibilityLabel="Alias opcional" placeholder="Alias opcional" placeholderTextColor="#B7CADD" value={alias} onChangeText={setAlias} editable={!saving} maxLength={80} style={s.search} />{saveError?<Text accessibilityLiveRegion="polite" style={s.warning}>{saveError}</Text>:null}<MapButton text={saving?'Guardando…':'Guardar favorito'} disabled={saving} primary onPress={save} /></ScrollView></SafeScreen></Modal>
    <Modal visible={!!picker} animationType="slide" onRequestClose={()=>setPicker(null)}><SafeScreen avoidKeyboard><View style={s.header}><Text style={[s.title,{flex:1}]}>{selection.editing==='from'?'Origen':'Destino'}</Text><MapButton text="Volver" onPress={()=>setPicker(null)} /></View><FlatList ListHeaderComponent={<TextInput disableFullscreenUI accessibilityLabel="Buscar estación" placeholder="Buscar estación" placeholderTextColor="#B7CADD" value={search} onChangeText={setSearch} style={s.search} autoCorrect={false} />} data={list} keyExtractor={st=>st.id} keyboardShouldPersistTaps="handled" renderItem={({item})=><TouchableOpacity accessibilityRole="button" onPress={()=>choose(item.id)} style={s.listItem}><Text style={s.fieldText}>{item.displayName}</Text><Text style={s.hint}>{item.lines.join(' · ')}</Text></TouchableOpacity>} ListEmptyComponent={<Text style={s.warning}>No se encuentra la estación.</Text>} /></SafeScreen></Modal>
  </SafeScreen></GestureHandlerRootView>;
}
const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#011228'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:8,borderBottomWidth:1,borderColor:'#28435D'},title:{color:'#F5FAFF',fontSize:21,fontWeight:'700'},
  button:{minWidth:48,minHeight:48,paddingHorizontal:10,paddingVertical:8,justifyContent:'center',alignItems:'center',borderRadius:12},buttonText:{color:'#60D7EF',fontSize:15,fontWeight:'600'},primary:{backgroundColor:'#60D7EF'},
  selection:{flexDirection:'row',padding:8,gap:6,alignItems:'center'},stationField:{flex:1,padding:10,borderRadius:12,borderWidth:1,borderColor:'#28435D',backgroundColor:'#12283F',minHeight:68},activeField:{borderColor:'#60D7EF'},caption:{fontSize:11,fontWeight:'700'},fieldText:{color:'#F5FAFF',fontSize:16},
  map:{flex:1,minHeight:56,overflow:'hidden'},canvas:{flex:1},drawing:{position:'absolute',top:0,left:0,width:2420,height:560,transformOrigin:'top left'},
  controls:{position:'absolute',right:8,bottom:8,backgroundColor:'#12283F',borderRadius:16},footer:{flexGrow:0,flexShrink:1,borderTopWidth:1,borderColor:'#28435D'},footerActions:{flexDirection:'row',justifyContent:'space-between',flexWrap:'wrap'},hint:{color:'#B7CADD',fontSize:13,padding:4},warning:{color:'#FFD391',fontSize:14,padding:8},search:{margin:12,padding:12,color:'#F5FAFF',fontSize:18,backgroundColor:'#12283F',borderRadius:12},listItem:{padding:16,minHeight:64,borderBottomWidth:1,borderColor:'#28435D'},
});
