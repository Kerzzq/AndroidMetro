// Reproduce los datos y el SVG; no lee ni modifica la aplicación.
const fs=require('fs'),path=require('path');
const root=__dirname;
const existing=JSON.parse(fs.readFileSync(root+'/sources/catalogue-snapshot.json'));
const rawPath=root+'/sources/official-catalogue.json';
const official=JSON.parse(fs.readFileSync(rawPath));
fs.writeFileSync(rawPath,JSON.stringify(official,null,2));
const probes=JSON.parse(fs.readFileSync(root+'/sources/api-probes.json'));
const sequences={
 L1:'PLE URD SOP LAR BER IBB BID ALG AIB NEG GOB ARE LAM LEI AST ERA LUT SIN SAR DEU SAM IND MOY ABA CAV SAN BAS BOL ETX'.split(' '),
 L2:'KAB STZ PEN POR ABT SES URB BAG BAR ANS GUR SIN SAR DEU SAM IND MOY ABA CAV SAN BAS BOL ETX ARZ BSR'.split(' '),
 L3:'ZZA ZZB ZZC ZZD ZZE ZZF ZZG'.split(' ')
};
const positions={};
sequences.L1.slice(0,17).forEach((c,i)=>positions[c]={x:90+i*65,y:300,labelSide:'above',rotation:-45});
sequences.L2.slice(0,11).forEach((c,i)=>positions[c]={x:470+i*65,y:550,labelSide:'below',rotation:45});
sequences.L1.slice(17).forEach((c,i)=>positions[c]={x:1240+i*82,y:420,labelSide:'below',rotation:45});
positions.ARZ={x:2200,y:478,labelSide:'above',rotation:-45};positions.BSR={x:2258,y:536,labelSide:'below',rotation:45};
sequences.L3.forEach((c,i)=>positions[c]={x:1650+i*82,y:200,labelSide:'above',rotation:-45});
const l3names=['Matiko','Uribarri','Zazpikaleak/Casco Viejo','Zurbaranbarri','Txurdinaga','Otxarkoaga','Kukullaga-Etxebarri'];
const sources=[
 {id:'MB-CATALOGUE',url:'https://api.metrobilbao.eus/api/stations?page=1&perPage=200',checked:'2026-10-10',purpose:'Nombres, códigos, líneas y orden weight L1/L2; CAV enumera también L3 como conexión.'},
 {id:'MB-CSV',url:'https://cms.metrobilbao.eus/get/open_data/estaciones/es',checked:'2026-10-10',purpose:'Presencia de los 49 códigos en accesos. Cabecera desplazada: filas de 7 columnas frente a 6 nombres.'},
 {id:'MB-PLAN-2026',url:'https://cms.metrobilbao.eus/sites/default/files/2026-01/CARTEL%20horarios%20-%20plentzia%20-%20invierno%202026.pdf',checked:'2026-10-10',purpose:'Adyacencias, bifurcación y zonas contrastadas visualmente, no geometría geográfica.'},
 {id:'ET-L3-2026',url:'https://www.euskotren.eus/sites/default/files/2026-03/260317%20L3%2030%25.pdf',checked:'2026-10-10',purpose:'Orden de las siete estaciones L3. Horarios especiales no reutilizados.'},
 {id:'ET-PLAN',url:'https://euskotren.eus/fr/l3/planos',checked:'2026-10-10',purpose:'Operador y extremos L3, zonas 1–2.'},
 {id:'APP',path:'src/data/stations.js',revision:'8bd08d8c902ca90020587dd602e30f15ac902bfc',purpose:'Identificador de dominio actual = code; no existe un ID de estación adicional.'},
 {id:'PROBES',path:'sources/api-probes.json',checked:'2026-10-10',purpose:'Una consulta por código y cinco casos adicionales. Evidencia puntual, no SLA ni contrato oficial de cobertura.'}
];
const stations=existing.map(s=>{
 const cat=official.find(x=>x.code===s.code),l3=s.code.startsWith('ZZ'),idx=sequences.L3.indexOf(s.code),p=probes.find(x=>x.code===s.code);
 let zone=l3?(s.code==='ZZG'?2:1):['PLE','URD','SOP','LAR'].includes(s.code)?3:positions[s.code].x<1240||['ETX','ARZ','BSR'].includes(s.code)?2:1;
 const name=l3?l3names[idx]:cat.name;
 return {id:s.code,androidMetroId:s.code,appName:s.name,officialName:name,displayName:s.code==='MOY'?'Eliptikoa / Moyua':name,apiCode:l3?null:s.code,catalogueCode:s.code,
  operator:l3?'Euskotren':'Metro Bilbao',lines:Object.entries(sequences).filter(([_,cs])=>cs.includes(s.code)).map(([l])=>l),officialCatalogueLines:cat?.line??['L3'],svgId:'station-'+s.code,
  ...positions[s.code],zone,zoneSource:'MB-PLAN-2026',positionSource:'Diseño esquemático propio; sin coordenadas geográficas',
  apiStatus:l3?'unverified_l3_http500':'observed_valid_contract',queryEligible:!l3,
  evidence:{probeFrom:p.code,probeTo:p.to,httpStatus:p.httpStatus,validTrainContract:p.validTrainContract,at:p.at},
  sourceIds:l3?['APP','MB-CSV','ET-L3-2026','ET-PLAN','PROBES']:['APP','MB-CSV','MB-CATALOGUE','MB-PLAN-2026','PROBES'],
  note:s.code==='CAV'?'Nodo de andenes L1/L2; transbordo separado a ZZC. El catálogo agrupa L1/L2/L3.':s.code==='MOY'?'La app y el plano de enero dicen Moyua; el catálogo actual dice Eliptikoa. No se cambia la app.':l3?'ZZ* existe en el catálogo de accesos y la app, pero no se ha verificado como código de consulta.':''};
});
const edges=[];
for(const [line,cs]of Object.entries(sequences))cs.slice(1).forEach((to,i)=>{
 const from=cs[i],prior=edges.find(e=>e.from===from&&e.to===to);
 if(prior){prior.lines.push(line);return;}
 edges.push({id:`track-${from}-${to}`,from,to,kind:'track',lines:[line],bidirectional:true,topologyValidated:true,queryEligible:line!=='L3',sourceIds:line==='L3'?['ET-L3-2026','MB-PLAN-2026']:['MB-CATALOGUE','MB-PLAN-2026']});
});
edges.push({id:'transfer-CAV-ZZC',from:'CAV',to:'ZZC',kind:'transfer',lines:[],bidirectional:true,topologyValidated:true,queryEligible:false,sourceIds:['MB-PLAN-2026'],note:'Conexión peatonal entre operadores; sin duración, accesibilidad ni tren directo inferidos.'});
const data={schemaVersion:1,checked:'2026-10-10',baseCommit:'8bd08d8c902ca90020587dd602e30f15ac902bfc',viewBox:[0,0,2420,780],sources,sequences,stations,edges};
fs.writeFileSync(root+'/map-data.json',JSON.stringify(data,null,2));
fs.writeFileSync(root+'/map-data.js','// Generado por build.cjs desde las fuentes verificadas.\nglobalThis.METRO_DATA = '+JSON.stringify(data)+';\n');
const {renderSVG}=require('./map-core.js');
fs.writeFileSync(root+'/mapa.svg',renderSVG(data).replaceAll('><','>\n<'));
const head='Nombre oficial | Nombre app | ID AndroidMetro | Código consulta API | Código catálogo | Líneas de andén | ID SVG | x,y | Zona esquema | Compatibilidad y consulta observada';
const rows=stations.map(s=>`| ${s.officialName} | ${s.appName} | ${s.id} | ${s.apiCode??'No validado'} | ${s.catalogueCode} | ${s.lines.join('/')} | ${s.svgId} | ${s.x},${s.y} | ${s.zone} | ${s.queryEligible?'Contrato válido observado':'L3 no validada'}; ${s.evidence.probeFrom}/${s.evidence.probeTo}: HTTP ${s.evidence.httpStatus} |`);
fs.writeFileSync(root+'/ESTACIONES.md',`# Correspondencias verificables\n\n10-10-2026. IDs internos obtenidos del código, sin inventar códigos L3. Posiciones propias en unidades SVG; **no** latitud/longitud. Las zonas son las del esquema oficial consultado, no un cálculo tarifario. Evidencia por fila y fuentes en map-data.json; respuestas puntuales en sources/api-probes.json.\n\n| ${head} |\n|${head.split(' | ').map(()=>'---').join('|')}|\n${rows.join('\n')}\n\nCAV/ZZC son dos nodos conectados por transbordo, no dos nombres intercambiables de consulta. El catálogo de Metro Bilbao enumera L3 en CAV, pero eso no valida consultas a ZZC. Bagatza/Bagaza, Deustu/Deusto, Eliptikoa/Moyua y Zazpikaleak/Casco Viejo conservan sus códigos. No se ha renombrado stations.js.\n`);
console.log(`Generados ${stations.length} nodos y ${edges.length} enlaces; SVG ${fs.statSync(root+'/mapa.svg').size} bytes.`);
