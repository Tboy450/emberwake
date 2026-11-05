import * as T from '../vendor/three/three.module.min.js';

const PALETTES={
 forest:{sky:0x1b2635,ground:0x26392f,stone:0x647070,leaf:0x244b43,light:0xffc878},
 marsh:{sky:0x152d37,ground:0x1d393c,stone:0x556a68,leaf:0x265657,light:0x8af1cf},
 ember:{sky:0x33202d,ground:0x44332f,stone:0x6a5757,leaf:0x453643,light:0xffa65c},
 dawn:{sky:0x342538,ground:0x4b3f47,stone:0x8c7970,leaf:0x51435f,light:0xffda94}
};
export function arenaTheme(node){
 if(['sun','door','cinderheart'].includes(node))return 'dawn';
 if(['market','observatory','pass','spire','kiln','crucible'].includes(node))return 'ember';
 if(['fen','hut','causeway','barrow','mill','blight','sluice','tempest','saltwick','shoals','abbey','grotto'].includes(node))return 'marsh';
 return 'forest';
}

// Code-built scenery: a lit foreground, a broken road and ruins receding into mist.
export function buildArena(scene,node){
 const p=PALETTES[arenaTheme(node)],root=new T.Group();scene.add(root);
 scene.background=new T.Color(p.sky);scene.fog=new T.Fog(p.sky,23,60);
 const material=(color,extra={})=>new T.MeshStandardMaterial({color,roughness:1,...extra});
 const ground=material(p.ground),stone=material(p.stone),dark=material(0x263339),leaf=material(p.leaf),bark=material(0x39302d);
 function mesh(geometry,mat,x,y,z){const m=new T.Mesh(geometry,mat);m.position.set(x,y,z);root.add(m);return m;}
 const floor=mesh(new T.PlaneGeometry(90,32),ground,0,-.07,-6);floor.rotation.x=-Math.PI/2;
 for(let i=0;i<15;i++){
  const z=6-i*1.75,wide=3.2-i*.06;
  for(let j=0;j<3;j++){
   const slab=mesh(new T.CylinderGeometry(.5,.58,.1,6),i%3?stone:dark,(j-1)*wide*.31+Math.sin(i*3+j)*.13,-.01,z);
   slab.scale.set(wide*.32,1,.62-i*.022);slab.rotation.y=i+j*.4;
  }
 }
 for(const side of [-1,1]){
  for(let i=0;i<5;i++){
   const rock=mesh(new T.DodecahedronGeometry(.6,0),stone,side*(8-i*.3),.2,-8-i*2.6);rock.scale.set(1.5,.75,1);rock.rotation.set(i,.3*i,0);
  }
  for(let i=0;i<5;i++){
   const x=side*(9-i*.9),z=-14-i*2.1,h=2.3+(i%3)*.4;
   mesh(new T.CylinderGeometry(.14,.28,h,6),bark,x,h/2,z);
   for(let tier=0;tier<2;tier++)mesh(new T.ConeGeometry(1.1-tier*.2,h*.75,7),leaf,x,h*.7+tier*.45,z);
  }
  const x=side*6.8,z=4.2;
  mesh(new T.CylinderGeometry(.09,.14,1.7,6),dark,x,.85,z);
  mesh(new T.BoxGeometry(.55,.12,.55),stone,x,1.8,z);
  mesh(new T.BoxGeometry(.28,.5,.28),material(p.light,{emissive:p.light,emissiveIntensity:2}),x,1.47,z);
  const glow=new T.PointLight(p.light,8,8);glow.position.set(x,1.8,z);root.add(glow);
 }
 for(const x of [-1.05,1.05]){
  mesh(new T.BoxGeometry(.45,1.8,.6),stone,x,.9,-16);
  mesh(new T.BoxGeometry(.6,.22,.7),dark,x,1.8,-16);
 }
 mesh(new T.BoxGeometry(2.5,.35,.6),stone,0,2.05,-16);
 const moon=mesh(new T.SphereGeometry(.6,20,12),new T.MeshBasicMaterial({color:p.light}),3,-.2,-25);moon.scale.z=.2;
 for(let i=0;i<7;i++){const ridge=mesh(new T.ConeGeometry(3.4,3+i%3*.5,5),dark,(i-3)*4,-1.8,-25-(i%2));ridge.scale.z=.3;}
 return root;
}

export function actorShadow(scene,actor){
 const shadow=new T.Mesh(new T.CircleGeometry(1,32),new T.MeshBasicMaterial({color:0x071216,transparent:true,opacity:.28,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.scale.set(Math.min(actor.w*.48,.85),.32,1);scene.add(shadow);
 return shadow;
}
