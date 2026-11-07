import test from 'node:test';
import assert from 'node:assert/strict';
import {Actor,RIGS} from '../dist/view/actor.js';
import {BattleAdapter} from '../dist/view/battle-adapter.js';
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
 const adapter=Object.assign(Object.create(BattleAdapter.prototype),{enabled:true,failed:false,loading:false,scene:{},canvas:{hidden:false},generation:1,actors,currentState:{party:[{id:'vera',hp:10},{id:'rook',hp:40},{id:'fenn',hp:20}]},visibility(){},stage:{},fx:{ring:async where=>{events.push('ring:'+where);}}});
 return {adapter,events,actors};
}
test('draught visuals follow the recipient and Greenwake follows every living ally',async()=>{
 const previous=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});
 try{
  const {adapter,events,actors}=supportFixture();await adapter.playAction({actorId:'vera',targetId:'rook',action:'potion'});assert.deepEqual(events,['ring:rook','flash:rook']);
  events.length=0;adapter.currentState.party[1].hp=0;actors.get('rook').alive=false;
  await adapter.playAction({actorId:'fenn',targetId:'rook',action:'skill'});assert.deepEqual(events,['ring:vera','ring:fenn','flash:vera','flash:fenn']);
 }finally{if(previous===undefined)delete globalThis.matchMedia;else globalThis.matchMedia=previous;}
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
