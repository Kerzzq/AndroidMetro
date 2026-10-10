from pathlib import Path
import json, hashlib, re
import xml.etree.ElementTree as ET
from PIL import Image, ImageChops
p=Path('C:/Users/W11/AMetro/evidencias/mapa-fix')
cases=json.loads((p/'gestos-casos.json').read_text())
roi=(0,600,1080,1900)
for c in cases['cases']:
    images=[Image.open(p/(c['prefix']+'-'+phase+'.png')).convert('RGB').crop(roi) for phase in ['dos','uno','cero']]
    c['mapRegionPixels']=roi
    c['unchangedAfterFirstLift']=ImageChops.difference(images[0],images[1]).getbbox() is None
    c['unchangedAfterReleaseOrCancel']=ImageChops.difference(images[0],images[2]).getbbox() is None
    c['captureSha256']={phase:hashlib.sha256((p/(c['prefix']+'-'+phase+'.png')).read_bytes()).hexdigest() for phase in ['dos','uno','cero']}
    assert c['unchangedAfterFirstLift'] and c['unchangedAfterReleaseOrCancel'],c
    print('PASS camera unchanged:',c['name'])
(p/'gestos-resultados.json').write_text(json.dumps(cases,indent=2),encoding='utf-8')
records=[json.loads(f.read_text()) for f in p.glob('*-bounds.json') if f.name.startswith(('threebutton-','gestural-'))]
assert len(records)==40,len(records)
for r in records:
    assert r['passed'],r['name']
    assert float(r['fontScale'])==float(r['name'].split('-')[1]),r['name']
    image=Image.open(p/(r['name']+'.png'))
    assert ('vertical' in r['name'])==(image.width<image.height),r['name']
    r['screenPixels']=[image.width,image.height]
    r['captureSha256']=hashlib.sha256((p/(r['name']+'.png')).read_bytes()).hexdigest()
    if r['kind']=='map':
        fields=[]
        for node in ET.fromstring((p/(r['name']+'.xml')).read_text()).iter('node'):
            label=node.get('content-desc','')
            if not label.startswith(('Origen:', 'Destino:')):
                continue
            b=list(map(int,re.findall(r'\d+',node.get('bounds'))))
            dp=[(b[2]-b[0])*160/r['density'],(b[3]-b[1])*160/r['density']]
            overlaps=[bar for bar in r['systemBars'] if min(b[2],bar['bounds'][2])>max(b[0],bar['bounds'][0]) and min(b[3],bar['bounds'][3])>max(b[1],bar['bounds'][1])]
            assert min(dp)>=47.5 and not overlaps,(r['name'],label,b)
            fields.append({'label':label,'bounds':b,'dp':dp,'overlap':overlaps})
        assert len(fields)==2,(r['name'],fields)
        r['stationFields']=fields
(p/'matriz-resultados.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
print('PASS: 40 native control measurements, actual orientation and screenshot integrity')
