import {canEnterNode} from './story.js';
// Shared collision and rendering data: one deterministic tile world, not a decorative map.
export const WIDTH=64,HEIGHT=40;
export const PLACES={bridgehold:[23,18],sluice:[40,19],crucible:[56,23],cinderheart:[57,8],hearth:[8,23],well:[7,13],road:[15,21],orchard:[14,10],bell:[21,20],archive:[21,6],fen:[33,20],hut:[31,25],causeway:[38,14],barrow:[39,22],mill:[43,24],market:[42,11],observatory:[40,4],pass:[47,16],spire:[57,17],door:[55,10],sun:[55,5],thornstead:[14,27],tallow:[8,6],blight:[32,8],kiln:[53,23],saltwick:[29,33],shoals:[19,33],abbey:[14,36],grotto:[8,34],briar:[18,16],tempest:[42,6]};
export const DIRECTIONS={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
export const PATROLS={briar:[[18,16],[18,17],[18,18],[18,17]],tempest:[[42,6],[43,6],[44,6],[43,6]]};
export function freshWorld(location='hearth'){const [x,y]=PLACES[location]||PLACES.hearth;return {x,y,tick:0,roamers:Object.entries(PATROLS).map(([id,path])=>({id,x:path[0][0],y:path[0][1],step:0}))};}
let cached;
export function terrain(nodes){if(cached)return cached;const g=Array.from({length:HEIGHT},(_,y)=>Array.from({length:WIDTH},(_,x)=>{if(y>29)return '~';if(x<3||x>61||y<2||y>28)return '~';if(x===26||x===27)return '~';if(x===46)return '^';if(x>=50&&y===11)return '^';return x>=47?':':x>=28?',':(x*13+y*7)%11<3?'"':'.';}));
 // An island stays separate from the mainland: two sea rows require ferry passage.
 for(let y=31;y<39;y++)for(let x=5;x<33;x++)if(((x-19)/15)**2+((y-34.5)/4.3)**2<1)g[y][x]=(x+y)%6===0?'"':'.';
 const paint=(x,y)=>{if(x>=1&&x<WIDTH-1&&y>=1&&y<HEIGHT-1)g[y][x]='=';};
 // Roads run horizontally, then vertically. The same cells are rendered and tested.
 for(const n of nodes){const a=PLACES[n.id];if(!a)continue;paint(...a);for(const id of n.links){if(n.id>id)continue;const b=PLACES[id];if(!b||((a[1]>29)!==(b[1]>29)))continue;let [x,y]=a;while(x!==b[0]){paint(x,y);x+=Math.sign(b[0]-x);}while(y!==b[1]){paint(x,y);y+=Math.sign(b[1]-y);}paint(x,y);}}
 for(const path of Object.values(PATROLS))for(const p of path)paint(...p);
 // Fixed walls keep the Bell bridge, mountain pass and final gate meaningful.
 for(let y=2;y<29;y++){g[y][26]=g[y][27]='~';g[y][46]='^';}
 g[20][26]=g[20][27]='B';g[16][46]='M';
 for(let x=50;x<=61;x++)g[11][x]='^';g[11][55]='S';
 for(let y=2;y<=10;y++)g[y][50]='^';
 cached=g;return g;}
export function passable(s,x,y,nodes){if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=WIDTH||y>=HEIGHT)return false;const t=terrain(nodes)[y][x];if(t==='~'||t==='^')return false;const place=nodes.find(n=>PLACES[n.id]?.[0]===x&&PLACES[n.id]?.[1]===y);if(place&&!canEnterNode(s,place.id))return false;if(x>=28&&y<30&&!s.flags.bell)return false;if(x>=47&&y<30&&!s.flags.mill)return false;if(x>50&&y<11&&!s.flags.star)return false;if(x>50&&y<=6&&!s.flags.mother)return false;return true;}
export function pathTo(s,tx,ty,nodes){const w=s.world,queue=[[w.x,w.y]],prev=new Map([[`${w.x},${w.y}`,null]]);let found=false;for(let i=0;i<queue.length;i++){const [x,y]=queue[i];if(x===tx&&y===ty){found=true;break;}for(const [dx,dy]of Object.values(DIRECTIONS)){const a=x+dx,b=y+dy,k=`${a},${b}`;if(!prev.has(k)&&passable(s,a,b,nodes)){prev.set(k,[x,y]);queue.push([a,b]);}}}if(!found)return null;const path=[];for(let p=[tx,ty];p&&!(p[0]===w.x&&p[1]===w.y);p=prev.get(p.join(',')))path.unshift(p);return path;}
export function validWorld(w,s,nodes){return !!w&&typeof w==='object'&&Number.isInteger(w.tick)&&w.tick>=0&&w.tick<1e9&&passable(s,w.x,w.y,nodes)&&Array.isArray(w.roamers)&&w.roamers.length===2&&Object.keys(PATROLS).every(id=>w.roamers.filter(r=>r?.id===id).length===1)&&w.roamers.every(r=>Number.isInteger(r.step)&&r.step>=0&&r.step<4&&PATROLS[r.id][r.step][0]===r.x&&PATROLS[r.id][r.step][1]===r.y);}
