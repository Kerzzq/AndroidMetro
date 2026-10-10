import React, { memo } from 'react';
import Svg, { Circle, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { data, stations, physicalRoute } from '../domain/mapModel';
const lineColor = { L1: '#FF7848', L2: '#D7E5F3' };
const edgePath = (edge, offset = 0) => `M${stations[edge.from].x},${stations[edge.from].y + offset} L${stations[edge.to].x},${stations[edge.to].y + offset}`;
export default memo(function MetroMap({ from, to }) {
  return <Svg width={2420} height={560} viewBox="0 0 2420 560" accessible={false}>
    <G>{physicalRoute(from, to).map(e => <Path key={e.id} d={edgePath(e)} stroke="#FFD391" opacity={.5} strokeWidth={30} strokeLinecap="round" />)}</G>
    <G>{data.edges.flatMap(e => e.lines.map(line => <Path key={`${e.id}-${line}`} d={edgePath(e, e.lines.length === 2 ? line === 'L1' ? -8 : 8 : 0)} fill="none" stroke={lineColor[line]} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />))}</G>
    <G>{data.stations.map(s => <SvgText key={s.id} x={0} y={0} transform={`translate(${s.x+4} ${s.y+(s.labelSide==='below'?37:-28)}) rotate(${s.rotation})`} fontSize={20} fontWeight="500" fill="#F5FAFF">{s.displayName}</SvgText>)}</G>
    <G>{data.stations.map(s => <G key={s.svgId}>
      {s.lines.length === 2 ? <Rect x={s.x-6} y={s.y-15} width={12} height={30} rx={6} fill="#011228" stroke="#F5FAFF" strokeWidth={2.5} /> : <Circle cx={s.x} cy={s.y} r={7} fill="#011228" stroke="#F5FAFF" strokeWidth={2.5} />}
      {s.id===from||s.id===to ? <G><Circle cx={s.x} cy={s.y} r={19} fill="#011228" stroke={s.id===from?'#60D7EF':'#FFD391'} strokeWidth={5} /><SvgText x={s.x} y={s.y+6} textAnchor="middle" fontSize={18} fontWeight="bold" fill={s.id===from?'#60D7EF':'#FFD391'}>{s.id===from?'O':'D'}</SvgText></G> : null}
    </G>)}</G>
    <SvgText x={25} y={128} fontSize={26} fontWeight="bold" fill={lineColor.L1}>L1</SvgText>
    <SvgText x={400} y={378} fontSize={26} fontWeight="bold" fill={lineColor.L2}>L2</SvgText>
    <SvgText x={2225} y={240} fontSize={26} fontWeight="bold" fill={lineColor.L1}>L1</SvgText>
    <SvgText x={2310} y={385} fontSize={26} fontWeight="bold" fill={lineColor.L2}>L2</SvgText>
  </Svg>;
});
