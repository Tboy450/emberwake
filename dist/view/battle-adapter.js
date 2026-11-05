// Presentation only. Never imports the combat engine or changes an adventure save.
const HERO_ART={vera:'mage',rook:'warrior',fenn:'rogue'};
const ENEMY_ART={moth:'crystal_bat',tree:'plague_knight',bell:'plague_knight',ghost:'ghost_face',knight:'town_guard',mage:'plague_knight',sun:'dragon'};
const REDUCED=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export class BattleAdapter {
 constructor({container,fallback,onStatus=()=>{}}){
  this.container=container;this.fallback=fallback;this.onStatus=onStatus;
  this.canvas=document.createElement('canvas');this.canvas.id='battle-3d';this.canvas.hidden=true;this.canvas.setAttribute('aria-hidden','true');container.insertBefore(this.canvas,fallback);
  this.enabled=false;this.generation=0;this.actors=new Map();this.battle=null;this.loading=false;this.failed=false;
  this.visibility=()=>{if(this.stage)this.stage.paused=document.hidden||document.querySelector('dialog[open]')!==null||!this.enabled||!this.battle;};
  this.contextLost=event=>{event.preventDefault();this.fail(Error('Graphics context lost'));};
  this.canvas.addEventListener('webglcontextlost',this.contextLost);
  document.addEventListener('visibilitychange',this.visibility);
 }
 async modules(){
  if(this.dependencies)return this.dependencies;
  this.dependencies=Promise.all([import('./stage.js'),import('./actor.js'),import('./fx.js'),import('../vendor/three/three.module.min.js')]);
  return this.dependencies;
 }
 setEnabled(enabled){this.enabled=enabled;this.failed=false;if(!enabled){this.generation++;this.battle=null;this.releaseScene();this.hide();}}
 hide(){this.canvas.hidden=true;this.fallback.hidden=false;if(this.stage)this.stage.paused=true;}
 pause(paused){if(this.stage)this.stage.paused=paused||document.hidden||!this.enabled||!this.battle;}
 show(state){
  if(!state.battle||!this.enabled){if(!state.battle){this.generation++;this.battle=null;this.releaseScene();}this.hide();return;}
  if(this.failed)return;
  if(this.battle===state.battle){this.sync(state);return;}
  this.battle=state.battle;const generation=++this.generation;
  this.hide();this.onStatus('Loading animated battle…');this.loading=true;
  this.prepare(state,generation).catch(error=>{if(generation===this.generation)this.fail(error);});
 }
 async prepare(state,generation){
  const [{Stage,webglAvailable},{Actor},{Fx},T]=await this.modules();
  if(generation!==this.generation||!this.enabled)return;
  if(!webglAvailable())throw Error('WebGL2 unavailable');
  if(!this.stage){this.stage=new Stage(this.canvas);this.stage.renderer.debug.onShaderError=()=>queueMicrotask(()=>this.fail(Error('Battle shader unavailable')));}
  const fighters=[...state.party,...state.battle.enemies];
  const loaded=await Promise.allSettled(fighters.map((f,i)=>Actor.create(i<state.party.length?HERO_ART[f.id]:ENEMY_ART[f.kind]||'plague_knight',{h:i<state.party.length?2.1:f.kind==='sun'?3.3:1.9,flip:i>=state.party.length})));
  if(generation!==this.generation||!this.enabled){for(const r of loaded)if(r.status==='fulfilled')r.value.dispose();return;}
  if(loaded.some(r=>r.status==='rejected')){for(const r of loaded)if(r.status==='fulfilled')r.value.dispose();throw Error('Character artwork unavailable');}
  this.releaseScene();
  const scene=this.scene=new T.Scene();scene.background=new T.Color('#1a2341');scene.fog=new T.Fog('#1a2341',11,24);
  scene.add(new T.HemisphereLight(0xc5dcff,0x52633c,2.8));const key=new T.DirectionalLight(0xffdfb5,3);key.position.set(-3,6,5);scene.add(key);
  const rim=new T.PointLight(0x88bbff,16,15);rim.position.set(2,3,-2);scene.add(rim);
  const floor=new T.Mesh(new T.PlaneGeometry(35,25),new T.MeshStandardMaterial({color:0x34474c,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.z=-3;scene.add(floor);
  this.actors=new Map();
  loaded.forEach((r,i)=>{const actor=r.value,f=fighters[i],hero=i<state.party.length,index=hero?i:i-state.party.length;actor.place(hero?-2.9+index*.9:1+index*1.1,0,hero?.6:-.35);scene.add(actor.group);this.actors.set(f.id,actor);});
  this.fx=new Fx(this.stage,scene);
  this.stage.camera.position.set(0,2.8,9.8);this.stage.camera.lookAt(0,1.1,0);
  this.stage.view={scene,update:(dt,t)=>{for(const actor of this.actors.values())actor.update(REDUCED()?0:dt,REDUCED()?0:t);this.fx.update(dt);}};
  this.loading=false;this.canvas.hidden=false;this.fallback.hidden=true;this.stage.resize();this.visibility();this.sync(state);this.onStatus('Animated battle');
 }
 sync(state){if(!this.scene)return;for(const f of [...state.party,...state.battle.enemies]){const actor=this.actors.get(f.id);if(!actor)continue;actor.alive=f.hp>0;actor.group.visible=f.hp>0;}this.visibility();}
 async animate({actorId,targetId,action}){
  if(!this.enabled||this.failed||this.loading||!this.scene||this.canvas.hidden)return;
  const a=this.actors.get(actorId),t=this.actors.get(targetId),generation=this.generation;if(!a)return;
  this.visibility();const short=REDUCED();
  if(action==='guard'||action==='restore'||action==='potion'||(action==='skill'&&actorId==='fenn')){
   if(!short)await this.fx.ring(a.chest(),action==='guard'?0x87cfe5:0xa8e7a7,2.2,380);
   if(generation!==this.generation)return;
   await a.flash(this.stage,0x93e8c4,short?100:240);return;
  }
  if(!t)return;
  if(short){await t.flash(this.stage,0xffddb4,100);return;}
  if(action==='skill'&&actorId==='vera'){
   const i=a.boneIndex('hand');await this.stage.tween(230,k=>{a.pose.bones[i]=-.4*k;a.pose.lean=-.04*k;});
   if(generation!==this.generation)return;
   const from=a.muzzle(),to=t.chest(),shot=this.fx.sheet('fireball',from,.9,420);
   this.fx.glow(from,0xff9146,13,420);
   await this.stage.tween(420,k=>shot.sprite.position.lerpVectors(from,to,k));await shot.done;
   if(generation!==this.generation)return;
   this.fx.burst(to,24,{color:0xffb15b});await t.flash(this.stage,0xffa455,200);
  }else{
   const base=a.group.position.clone(),end=base.clone();end.x+=(t.group.position.x-base.x)*.3;end.z+=.25;
   await this.stage.tween(190,k=>{a.group.position.lerpVectors(base,end,k);a.pose.lean=-.06*k;a.pose.bones[0]=-.45*k;});
   if(generation!==this.generation)return;
   this.fx.burst(t.chest(),14,{color:0xffdab4,size:.12});this.stage.shake=.035;
   await t.flash(this.stage,0xffd5bb,150);
   if(generation!==this.generation)return;
   await this.stage.tween(170,k=>a.group.position.lerpVectors(end,base,k));
  }
  a.pose.lean=0;a.pose.bones.fill(0);
 }
 async settle(state){
  if(!this.enabled||this.loading||this.failed||!this.scene)return;
  const fallen=[...state.party,...state.battle.enemies].filter(f=>f.hp<=0&&this.actors.get(f.id)?.alive);
  await Promise.all(fallen.map(async f=>{const a=this.actors.get(f.id);a.alive=false;
   if(!REDUCED())await this.stage.tween(280,k=>{a.group.rotation.z=-.3*k;a.u.uDissolve.value=k;});
   a.group.visible=false;
  }));
 }
 fail(error){if(this.failed)return;this.failed=true;this.loading=false;this.hide();this.onStatus('Canvas battle · animated view unavailable');console.warn('Animated battle fallback:',error.message);if(this.stage){this.stage.dispose();this.stage=null;}this.releaseScene();}
 releaseScene(){
  if(this.stage){this.stage.clearTweens();this.stage.view=null;}
  for(const actor of this.actors.values())actor.dispose();this.actors.clear();
  if(this.scene)this.scene.traverse(o=>{if(o.isMesh&&!o.customDepthMaterial){o.geometry?.dispose();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose());else o.material?.dispose();}});
  this.fx?.dispose();this.fx=null;this.scene=null;
 }
 dispose(){this.generation++;this.battle=null;document.removeEventListener('visibilitychange',this.visibility);this.canvas.removeEventListener('webglcontextlost',this.contextLost);this.releaseScene();this.stage?.dispose();this.stage=null;this.canvas.remove();}
}
