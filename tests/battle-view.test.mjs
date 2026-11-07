import test from 'node:test';
import assert from 'node:assert/strict';
import {Actor,RIGS} from '../dist/view/actor.js';
import {BattleAdapter} from '../dist/view/battle-adapter.js';
import {Fx} from '../dist/view/fx.js';
import {Stage} from '../dist/view/stage.js';
import {PlaneGeometry,Texture} from '../dist/vendor/three/three.module.min.js';

test('revival restores a dissolved actor without changing formation scale',()=>{
 const actor=new Actor('mage',RIGS.mage,{w:1.7,h:2.3,map:new Texture(),geo:new PlaneGeometry()},{});
 actor.group.scale.setScalar(1.3);actor.alive=false;actor.group.visible=false;actor.u.uDissolve.value=1;actor.group.rotation.z=-.3;actor.pose.lean=.2;actor.pose.bones.fill(.4);
 actor.setAlive(true);
 assert.equal(actor.u.uDissolve.value,0);assert.equal(actor.group.rotation.z,0);assert.equal(actor.group.visible,true);assert.deepEqual(actor.pose.bones,[0,0,0]);assert.equal(actor.group.scale.x,1.3);
 actor.dispose();
});

function supportFixture(){
 const events=[],actors=new Map();
 for(const id of ['vera','rook','fenn'])actors.set(id,{alive:true,chest:()=>id,flash:async()=>{events.push('flash:'+id);},group:{}});
 const adapter=Object.assign(Object.create(BattleAdapter.prototype),{enabled:true,failed:false,loading:false,scene:{},canvas:{hidden:false},generation:1,actors,currentState:{party:[{id:'vera',hp:10},{id:'rook',hp:40},{id:'fenn',hp:20}]},visibility(){},stage:{reducedMotion:false},fx:{ring:async where=>{events.push('ring:'+where);}}});
 return {adapter,events,actors};
}
test('draught visuals follow the recipient and Greenwake follows every living ally',async()=>{
 const {adapter,events,actors}=supportFixture();await adapter.playAction({actorId:'vera',targetId:'rook',action:'potion'});assert.deepEqual(events,['ring:rook','flash:rook']);
 events.length=0;adapter.currentState.party[1].hp=0;actors.get('rook').alive=false;
 await adapter.playAction({actorId:'fenn',targetId:'rook',action:'skill'});assert.deepEqual(events,['ring:vera','ring:fenn','flash:vera','flash:fenn']);
});

test('live reduced motion clears camera shake and hides particles while they expire',()=>{
 const motionPreference={matches:false},camera={position:{x:0,y:0}};
 const stage=Object.assign(Object.create(Stage.prototype),{motionPreference,camera,tweens:[],time:0,timeScale:1,shake:1,view:{},renderer:{render(){
  if(motionPreference.matches)assert.deepEqual(camera.position,{x:0,y:0});
 }}});
 stage.frame(.1);
 assert.ok(stage.shake>0);
 motionPreference.matches=true;
 stage.frame(.1);
 assert.equal(stage.shake,0);

 const particle={life:.15,max:.15,x:0,y:0,z:0,vx:0,vy:0,vz:0,g:0,drag:0,s:1,r:1,gc:1,b:1};
 const fx=Object.assign(Object.create(Fx.prototype),{N:1,p:[particle],pos:[],col:[],size:[],points:{visible:true},geo:{attributes:{position:{},color:{},psize:{}}},live:[]});
 fx.update(.1,stage.reducedMotion);
 assert.equal(fx.points.visible,false);
 fx.update(.1,stage.reducedMotion);
 motionPreference.matches=false;
 fx.update(.1,stage.reducedMotion);
 assert.equal(fx.points.visible,true);
 assert.equal(fx.size[0],0);
});

test('reduced motion keeps the hit cue and skips the attack movement',async()=>{
 const {adapter,actors,events}=supportFixture();
 adapter.stage.reducedMotion=true;
 const mage=actors.get('vera');mage.group.position={x:-1,z:1};
 mage.face=()=>events.push('face');actors.get('rook').group.position={x:1,z:-1};
 await adapter.playAction({actorId:'vera',targetId:'rook',action:'skill'});
 assert.deepEqual(events,['face','flash:rook']);
});

test('render failures release waiting animations and invoke the fallback callback',async()=>{
 let reported;const stage=Object.assign(Object.create(Stage.prototype),{tweens:[],disposed:false,frame(){throw Error('GPU failure');},onError:error=>{reported=error.message;}});
 const pending=stage.tween(1000,()=>{});stage.renderSafely(.016);await pending;assert.equal(reported,'GPU failure');assert.equal(stage.paused,true);assert.equal(stage.tweens.length,0);
});

test('context failure during actor loading disposes late actors without installing a scene',async()=>{
 let finish,disposed=0;const actorReady=new Promise(resolve=>{finish=resolve;});
 const adapter=Object.assign(Object.create(BattleAdapter.prototype),{enabled:true,failed:false,generation:1,actors:new Map(),stage:{dispose(){}},hide(){},onStatus(){},releaseScene(){},modules:async()=>[{webglAvailable:()=>true},{Actor:{create:()=>actorReady}},{loadBattleEffects:async()=>{}},{}]});
 const pending=adapter.prepare({party:[{id:'vera'}],battle:{enemies:[]}},1);await Promise.resolve();await Promise.resolve();
 const warning=console.warn;console.warn=()=>{};try{adapter.fail(Error('context lost'));}finally{console.warn=warning;}
 finish({dispose(){disposed++;}});await pending;assert.equal(disposed,1);assert.equal(adapter.generation,2);assert.equal(adapter.failed,true);assert.equal(adapter.scene,undefined);
});

test('context restoration rebuilds the current battle once and respects the Canvas choice',()=>{
 const state={battle:{}};
 const calls=[];
 const adapter=Object.assign(Object.create(BattleAdapter.prototype),{
  enabled:true,contextUnavailable:true,failed:true,currentState:state,battle:state.battle,selectedId:'enemy1',
  show(...args){assert.equal(this.battle,null);calls.push(args);},
  releaseScene(){},hide(){}
 });
 adapter.setEnabled(true);
 assert.equal(adapter.failed,true,'changing the preference cannot clear a pending context loss');
 adapter.restoreContext();
 adapter.restoreContext();
 assert.deepEqual(calls,[[state,{selectedId:'enemy1'}]]);
 assert.equal(adapter.failed,false);

 adapter.contextUnavailable=true;
 adapter.setEnabled(false);
 adapter.restoreContext();
 assert.equal(calls.length,1);
 assert.equal(adapter.contextUnavailable,false);
});
