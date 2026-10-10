from pathlib import Path
import json, shutil, hashlib, html
import xml.etree.ElementTree as ET
raw=Path('C:/Users/W11/AMetro/evidencias/mapa-fix')
dest=Path('C:/Users/W11/AMetro/baseline/docs/evidencias/mapa-fix')
dest.mkdir(parents=True,exist_ok=True)
matrix=json.loads((raw/'matriz-resultados.json').read_text())
gestures=json.loads((raw/'gestos-resultados.json').read_text())
files={'matriz-resultados.json','gestos-resultados.json','gestos-casos.json','matrix-apk-final.log','gestos-apk-final.log'}
for r in matrix:
    files.update(r['name']+ext for ext in ['.png','.xml','-bounds.json'])
    if r['name'].endswith('-resultados'):
        files.update(r['name'].removesuffix('-resultados')+'-api'+ext for ext in ['.png','.json'])
for c in gestures['cases']:
    files.update(c['prefix']+'-'+phase+'.png' for phase in ['dos','uno','cero'])
for stem in ['antes-tres-botones-150','antes-pinch-dos','antes-pinch-uno','antes-pinch-cero','teclado-guardar-validado','teclado-guardar-pulsado']:
    files.update(f.name for f in raw.glob(stem+'*') if f.suffix in ['.png','.xml','.json'])
files.update(f.name for f in raw.glob('final-*') if f.suffix in ['.png','.xml','.json','.txt'])
for name in sorted(files):
    shutil.copy2(raw/name,dest/name)
    if name.endswith('.txt'):
        # Keep raw dumps outside Git; remove insignificant trailing spaces in
        # their documented copies before calculating those copies' hashes.
        (dest/name).write_text('\n'.join(line.rstrip() for line in (raw/name).read_text(encoding='utf-8-sig').splitlines())+'\n',encoding='utf-8')
shutil.copy2('C:/Users/W11/Downloads/Screenshot_20261010-172535.png',dest/'antes-movil-propietario.png')
files.add('antes-movil-propietario.png')
apk=Path('C:/Users/W11/AMetro/artifacts/androidmetro-mapa-fix-test.apk')
def texts(name):
    return {node.get('text','') for node in ET.parse(dest/name).iter('node')}
assert 'Favorito guardado.' in texts('final-favorito-guardado.xml')
assert 'Ya tienes este trayecto en favoritos.' in texts('final-duplicado.xml')
assert '7 de 10 favoritos' in texts('final-siete-reinicio.xml')
assert '10 de 10 favoritos' in texts('final-diez-reinicio.xml')
assert all(t['unchanged']==t['expectedUnchanged'] for t in json.loads((dest/'final-camara-regresiones.json').read_text())['tests'])
apis=[n for n in sorted(files) if n.endswith('-api.json')]
assert len(apis)==9
for name in apis:
    api=json.loads((dest/name).read_text(encoding='utf-8'))
    assert not api['simulated'] and 'Todos los resultados del servicio · 8' in api['screen'],name
assert json.loads((dest/'final-instalada-estado.json').read_text(encoding='utf-8-sig'))['installedApk'].startswith(hashlib.sha256(apk.read_bytes()).hexdigest())
result={
 'device':{'serial':'emulator-5556','api':36,'avd':'AndroidMetro_API36','abi':'x86_64','physicalHardwareValidated':False},
 'apk':{'path':str(apk),'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'applicationId':'com.metrobilbao.widget.pruebas','testCertificateSha256':'5822756d7982c9c612d283f007d55f08e62b7a4224cc9b5b9409b1297891026d','sourceCommit':'8c6a9a2'},
 'matrix':{'cases':8,'measurements':len(matrix),'passed':all(r['passed'] for r in matrix),'file':'matriz-resultados.json'},
 'gestures':{'cases':len(gestures['cases']),'input':gestures['input'],'allCameraRegionsUnchanged':all(c['unchangedAfterFirstLift'] and c['unchangedAfterReleaseOrCancel'] for c in gestures['cases']),'file':'gestos-resultados.json'},
 'realApiRecords':[n for n in sorted(files) if n.endswith('-api.json')],
 'additionalNativeBounds':[n for n in sorted(files) if n.startswith('final-') and n.endswith('-bounds.json')]+['teclado-guardar-validado-bounds.json'],
 'functionalFlow':{'selection':'STZ/POR via SVG taps','realResults':8,'cameraPreservedOnReturn':True,'saveAlias':'Correccion final','duplicateRejected':True,'user10FavoritesAfterSaveAndReboot':7,'user0FavoritesPreserved':10,'widgets':{'existingIds':[2,4],'user10Count':0,'firstRestored':'CAV/SIN','secondPreserved':'STZ/MOY'}},
 'unitTests':{'passed':['test-map-camera','test-map','test-map-query','test-consultation','test-fase1','test-persistence-api','test-widget-races'],'serviceAndFavoritesCases':'fixtures; not real API'},
 'beforeEvidence':{'publishedApkSha256':'f8504a3977450a54e02b0bceb4141071318b865042dbb599547f14ff07d34b2c','pinchCameraShiftPixels':-240,'saveCoveredPixels':63,'ownerScreenshot':'before only; supplied by owner, not a Codex hardware test'},
 'pending':['Physical finger pinch on owner device','Owner device navigation buttons and gestures, keyboard, orientations and font sizes','Other Android versions, vendors, launchers and prolonged performance'],
 'evidenceSha256':{n:hashlib.sha256((dest/n).read_bytes()).hexdigest() for n in sorted(files)}
}
(dest/'resultados.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
groups=[('Antes y después · tres botones, fuente 150 %', [('antes-tres-botones-150.png','Antes · APK publicado'),('threebutton-1.5-vertical-vacio.png','Después · APK correctivo'),('antes-movil-propietario.png','Antes · captura aportada del móvil físico')]),
 ('Retirada escalonada · capturas Android originales',[('gesto-zoom-in-derecho-'+p+'.png',label) for p,label in [('dos','Dos dedos al terminar el zoom'),('uno','Un dedo restante, mantenido ≥350 ms'),('cero','Cero dedos · cámara idéntica')]]),
 ('Horizontal y teclado', [('threebutton-1.5-horizontal-seleccion.png','Mapa seleccionado · tres botones 150 %'),('teclado-guardar-validado.png','Guardar sobre IME · desplazamiento del formulario'),('teclado-guardar-pulsado.png','Pulsación efectiva · rechazo de duplicado')]),
 ('Flujo completo y regresiones',[(n,n.removesuffix('.png')) for n in sorted(files) if n.startswith('final-') and n.endswith('.png')]),
 ('Matriz completa',[(r['name']+'.png',r['name']) for r in matrix])]
body=''
for title,items in groups:
    body+='<h2>'+html.escape(title)+'</h2><div class="grid">'
    for name,label in items:
        body+='<figure><a href="'+html.escape(name)+'"><img loading="lazy" src="'+html.escape(name)+'" alt="'+html.escape(label)+'"></a><figcaption>'+html.escape(label)+'</figcaption></figure>'
    body+='</div>'
(dest/'galeria.html').write_text('''<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AndroidMetro · correcciones</title><style>body{background:#011228;color:#f5faff;font:16px system-ui;margin:24px}a{color:#60d7ef}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}figure{margin:0;background:#12283f;padding:12px;border-radius:12px}img{width:100%;max-height:660px;object-fit:contain}figcaption{margin-top:10px}h2{margin-top:40px}</style><h1>Corrección de cámara y áreas seguras</h1><p>Capturas originales de Android. Las pruebas de después se ejecutan exclusivamente en el emulador API 36; falta la comprobación final con dedos reales en el móvil del propietario. Pulsa una captura para verla completa.</p><p><a href="resultados.json">Resultados y SHA-256</a> · <a href="matriz-resultados.json">Coordenadas e insets</a> · <a href="gestos-resultados.json">Comparación de cámara</a> · <a href="../../CORRECCIONES_MAPA_GESTOS_SAFE_AREA.md">Informe</a></p>'''+body+'</html>',encoding='utf-8')
print('Evidence copied:',len(files),'files; matrix=',len(matrix),'gestures=',len(gestures['cases']))
