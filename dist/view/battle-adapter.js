// Presentation only. Never imports the combat engine or changes an adventure save.
import {battleFormation,targetYaw,attackTurn,attackPosition,ARENA_ELEVATION,ARENA_HEIGHT,ARENA_DISTANCE,ARENA_TARGET_Y} from './battle-blocking.js';
import {buildArena,actorShadow} from './arena.js';
const HERO_ART={vera:'mage',rook:'warrior',fenn:'rogue'};
const ENEMY_ART={moth:'crystal_bat',tree:'plague_knight',bell:'plague_knight',ghost:'ghost_face',knight:'town_guard',mage:'plague_knight',sun:'dragon'};
const REDUCED=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export class BattleAdapter {
 constructor({container,fallback,onStatus=()=>{}}){
  this.container=container;this.fallback=fallback;this.onStatus=onStatus;
  this.canvas=document.createElement('canvas');this.canvas.id='battle-3d';this.canvas.hidden=true;this.canvas.setAttribute('aria-hidden','true');container.insertBefore(this.canvas,fallback);
  this.enabled=false;this.generation=0;this.actors=new Map();this.battle=null;this.loading=false;this.failed=false;
  this.contextUnavailable=false;
  this.visibility=()=>{if(this.stage)this.stage.paused=document.hidden||document.querySelector('dialog[open]')!==null||!this.enabled||!this.battle;};
  this.contextLost=event=>{
   event.preventDefault();
   this.contextUnavailable=true;
   this.fail(Error('Graphics context lost'));
  };
  this.contextRestored=()=>this.restoreContext();
  this.canvas.addEventListener('webglcontextlost',this.contextLost);
  this.canvas.addEventListener('webglcontextrestored',this.contextRestored);
  document.addEventListener('visibilitychange',this.visibility);
 }
 async modules(){
  if(this.dependencies)return this.dependencies;
  this.dependencies=Promise.all([import('./stage.js'),import('./actor.js'),import('./fx.js'),import('../vendor/three/three.module.min.js')]);
  return this.dependencies;
 }
 setEnabled(enabled){this.enabled=enabled;this.failed=this.contextUnavailable;if(!enabled){this.generation++;this.battle=null;this.releaseScene();this.hide();}}
 hide(){this.canvas.hidden=true;this.fallback.hidden=false;if(this.stage)this.stage.paused=true;}
 pause(paused){if(this.stage)this.stage.paused=paused||document.hidden||!this.enabled||!this.battle;}
 restoreContext(){
  if(!this.contextUnavailable)return;
  this.contextUnavailable=false;
  this.failed=false;
  if(!this.enabled||!this.currentState?.battle)return;
  this.battle=null;
  this.show(this.currentState,{selectedId:this.selectedId});
 }
 show(state,{selectedId=null}={}){
  this.currentState=state;this.selectedId=selectedId;
  if(!state.battle||!this.enabled){if(!state.battle){this.generation++;this.battle=null;this.releaseScene();}this.hide();return;}
  if(this.failed)return;
  if(this.battle===state.battle){this.sync(state);return;}
  this.battle=state.battle;const generation=++this.generation;
  this.hide();this.onStatus('Loading animated battle…');this.loading=true;
  this.prepare(state,generation).catch(error=>{if(generation===this.generation)this.fail(error);});
 }
 async prepare(state,generation){
  const [{Stage,webglAvailable},{Actor},{Fx,loadBattleEffects},T]=await this.modules();
  if(generation!==this.generation||!this.enabled)return;
  if(!webglAvailable())throw Error('WebGL2 unavailable');
  if(!this.stage){this.stage=new Stage(this.canvas,{onError:error=>this.fail(error)});this.stage.renderer.debug.onShaderError=()=>queueMicrotask(()=>this.fail(Error('Battle shader unavailable')));}
  const fighters=[...state.party,...state.battle.enemies];
  // The supplied bat/dragon art already faces left. Mirroring every enemy turned them away.
  const loaded=await Promise.allSettled(fighters.map((f,i)=>Actor.create(i<state.party.length?HERO_ART[f.id]:ENEMY_ART[f.kind]||'plague_knight',{h:i<state.party.length?2.3:f.kind==='sun'?3.6:2.2})));
  if(generation!==this.generation||!this.enabled){for(const r of loaded)if(r.status==='fulfilled')r.value.dispose();return;}
  if(loaded.some(r=>r.status==='rejected')){for(const r of loaded)if(r.status==='fulfilled')r.value.dispose();throw Error('Character artwork unavailable');}
  try{await loadBattleEffects();}catch(error){for(const r of loaded)r.value.dispose();throw error;}
  if(generation!==this.generation||!this.enabled){for(const r of loaded)r.value.dispose();return;}
  this.releaseScene();
  const scene=this.scene=new T.Scene();buildArena(scene,state.battle.node);scene.fog.near=30;scene.fog.far=80;
  scene.add(new T.HemisphereLight(0xc5dcff,0x52633c,2.8));const key=new T.DirectionalLight(0xffdfb5,3);key.position.set(-3,6,5);scene.add(key);
  const rim=new T.PointLight(0x88bbff,16,15);rim.position.set(2,3,-2);scene.add(rim);
  this.actors=new Map();
  const actors=loaded.map(r=>r.value),formation=battleFormation(actors.slice(0,state.party.length),actors.slice(state.party.length));
  formation.slots.forEach(({actor,x,z,yaw,scale})=>{actor.place(x,0,z,yaw);actor.face(yaw);actor.group.scale.setScalar(scale);actor.homeScale=scale;});
  actors.forEach((actor,i)=>{actor.isHero=i<state.party.length;scene.add(actor.group);actor.shadow=actorShadow(scene,actor);this.actors.set(fighters[i].id,actor);});
  this.fx=new Fx(this.stage,scene);
  // The scenery uses real perspective; depth-scaled actors retain their readability.
  this.stage.camera=new T.PerspectiveCamera(2*Math.atan(ARENA_HEIGHT/(2*ARENA_DISTANCE))*180/Math.PI,16/10,.1,150);
  const camera=this.stage.camera;
  camera.position.set(0,ARENA_TARGET_Y+Math.sin(ARENA_ELEVATION)*ARENA_DISTANCE,Math.cos(ARENA_ELEVATION)*ARENA_DISTANCE);camera.lookAt(0,ARENA_TARGET_Y,0);
  const fitCamera=(w,h)=>{camera.aspect=w/h;const height=Math.max(ARENA_HEIGHT,formation.width/(w/h));camera.fov=2*Math.atan(height/(2*ARENA_DISTANCE))*180/Math.PI;camera.updateProjectionMatrix();};
  this.stage.view={scene,resize:fitCamera,update:(dt,t)=>{for(const actor of this.actors.values()){actor.update(REDUCED()?0:dt,REDUCED()?0:t);actor.shadow.position.set(actor.group.position.x,.025,actor.group.position.z);actor.shadow.scale.set(Math.min(actor.w*.48,.85)*actor.group.scale.x,.32*actor.group.scale.x,1);actor.shadow.visible=actor.group.visible;}this.fx.update(REDUCED()?0:dt);}};
  this.loading=false;this.canvas.hidden=false;this.fallback.hidden=true;this.stage.resize();this.visibility();this.sync(state);this.onStatus('Animated battle');
 }
 restFacing(actor,id){
  if(!this.stage)return;
  if(actor.isHero||id===this.currentState?.battle?.actor||id===this.selectedId)actor.faceCamera(this.stage.camera);
  else actor.face(targetYaw(actor.group.position,{x:0,z:5}));
 }
 sync(state){if(!this.scene)return;for(const f of [...state.party,...state.battle.enemies]){const actor=this.actors.get(f.id);if(!actor)continue;actor.setAlive(f.hp>0);if(this.animating!==f.id)this.restFacing(actor,f.id);}this.visibility();}
 async animate(options){
  this.animating=options.actorId;
  try{await this.playAction(options);}finally{this.animating=null;const actor=this.actors.get(options.actorId);if(actor)this.restFacing(actor,options.actorId);}
 }
 async playAction({actorId,targetId,action}){
  if(!this.enabled||this.failed||this.loading||!this.scene||this.canvas.hidden)return;
  const a=this.actors.get(actorId),t=this.actors.get(targetId),generation=this.generation;if(!a)return;
  this.visibility();const short=REDUCED();
  if(action==='flee')return;
  if(action==='guard'||action==='restore'||action==='potion'||(action==='skill'&&actorId==='fenn')){
   const recipients=action==='skill'?this.currentState.party.filter(h=>h.hp>0).map(h=>this.actors.get(h.id)).filter(Boolean):[action==='potion'?(t||a):a];
   if(!short)await Promise.all(recipients.map(actor=>this.fx.ring(actor.chest(),action==='guard'?0x87cfe5:0xa8e7a7,2.2,380)));
   if(generation!==this.generation)return;
   await Promise.all(recipients.filter(actor=>actor.alive).map(actor=>actor.flash(this.stage,0x93e8c4,short?100:240)));return;
  }
  if(!t)return;
  const base=a.group.position.clone(),startYaw=a.group.rotation.y,baseScale=a.group.scale.x,attackAt=attackPosition({x:base.x,z:base.z,scale:baseScale});
  const end=base.clone().set(attackAt.x,attackAt.y,attackAt.z),facing=targetYaw(end,t.group.position);
  if(short){a.face(targetYaw(base,t.group.position));await t.flash(this.stage,0xffddb4,100);return;}
  a.face(facing);const endYaw=a.group.rotation.y;
  await this.stage.tween(340,k=>{a.group.rotation.y=attackTurn(startYaw,endYaw,k);a.group.position.lerpVectors(base,end,k);a.group.scale.setScalar(baseScale+(attackAt.scale-baseScale)*k);a.pose.lift=Math.sin(k*Math.PI)*.12;});
  if(generation!==this.generation)return;
  a.face(facing);a.pose.lift=0;
  if(action==='skill'&&actorId==='vera'){
   const i=a.boneIndex('hand');await this.stage.tween(230,k=>{a.pose.bones[i]=-.4*k;a.pose.lean=-.04*k;});
   if(generation!==this.generation)return;
   const from=a.muzzle(),to=t.chest(),shot=this.fx.sheet('fireball',from,.9,420);
   this.fx.glow(from,0xff9146,13,420);
   await this.stage.tween(420,k=>shot.sprite.position.lerpVectors(from,to,k));await shot.done;
   if(generation!==this.generation)return;
   this.fx.burst(to,24,{color:0xffb15b});await t.flash(this.stage,0xffa455,200);
  }else{
   await this.stage.tween(190,k=>{a.pose.lean=.1*k;a.pose.bones[0]=-.45*k;});
   if(generation!==this.generation)return;
   this.fx.burst(t.chest(),14,{color:0xffdab4,size:.12});this.stage.shake=.035;
   await t.flash(this.stage,0xffd5bb,150);
   if(generation!==this.generation)return;
  }
  if(generation!==this.generation)return;
  await this.stage.tween(220,k=>{a.group.position.lerpVectors(end,base,k);a.group.scale.setScalar(attackAt.scale+(baseScale-attackAt.scale)*k);});
  if(generation!==this.generation)return;
  a.face(targetYaw(base,t.group.position));
  a.pose.lean=0;a.pose.bones.fill(0);
 }
 async settle(state){
  if(!this.enabled||this.loading||this.failed||!this.scene)return;
  const generation=this.generation;
  const revived=[...state.party,...state.battle.enemies].filter(f=>f.hp>0&&this.actors.get(f.id)?.alive===false);
  await Promise.all(revived.map(async f=>{const actor=this.actors.get(f.id);actor.setAlive(true);await actor.flash(this.stage,0x93e8c4,REDUCED()?100:240);}));
  if(generation!==this.generation)return;
  const fallen=[...state.party,...state.battle.enemies].filter(f=>f.hp<=0&&this.actors.get(f.id)?.alive);
  await Promise.all(fallen.map(async f=>{const a=this.actors.get(f.id);a.alive=false;
   if(!REDUCED())await this.stage.tween(280,k=>{a.group.rotation.z=-.3*k;a.u.uDissolve.value=k;});
   a.group.visible=false;
  }));
 }
 fail(error){if(this.failed)return;this.generation++;this.failed=true;this.loading=false;this.hide();this.onStatus('Canvas battle · animated view unavailable');console.warn('Animated battle fallback:',error.message);if(this.stage){this.stage.dispose();this.stage=null;}this.releaseScene();}
 releaseScene(){
  if(this.stage){this.stage.clearTweens();this.stage.view=null;}
  for(const actor of this.actors.values())actor.dispose();this.actors.clear();
  if(this.scene)this.scene.traverse(o=>{if(o.isMesh&&!o.customDepthMaterial){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();}});
  this.fx?.dispose();this.fx=null;this.scene=null;
 }
 dispose(){this.generation++;this.battle=null;document.removeEventListener('visibilitychange',this.visibility);this.canvas.removeEventListener('webglcontextlost',this.contextLost);this.canvas.removeEventListener('webglcontextrestored',this.contextRestored);this.releaseScene();this.stage?.dispose();this.stage=null;this.canvas.remove();}
}
