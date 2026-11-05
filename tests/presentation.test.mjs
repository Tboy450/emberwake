import test from 'node:test';
import assert from 'node:assert/strict';
import {emissionCount} from '../dist/view/emission.js';
import {battleFormation,targetYaw,attackTurn} from '../dist/view/battle-blocking.js';

test('battle formation keeps winged enemies and a full party apart',()=>{
 const party=[{w:1.6},{w:2},{w:1.8}],enemies=[{w:2.1},{w:2.1},{w:4.8}];
 const {slots}=battleFormation(party,enemies);
 for(let i=1;i<slots.length;i++){const previous=slots[i-1],current=slots[i];const gap=current.x-current.actor.w/2-(previous.x+previous.actor.w/2);assert.ok(gap>=(i===party.length?2.09:.49));}
 assert.ok(slots.slice(0,3).every(s=>s.yaw>0));assert.ok(slots.slice(3).every(s=>s.yaw<0));
});

test('attack spin finishes facing its target on either side without accumulating turns',()=>{
 for(const x of [-4,4]){const end=targetYaw({x:0},{x});assert.equal(Math.sign(end),Math.sign(x));assert.ok(Math.abs(end)<Math.PI/2);const finish=attackTurn(0,end,1);assert.ok(Math.abs(Math.atan2(Math.sin(finish),Math.cos(finish))-end)<1e-10);}
});
test('particle rate is independent of frame rate',()=>{for(const hz of [30,60,120]){let carry=0,births=0;for(let i=0;i<hz*10;i++){const e=emissionCount(carry,10,1/hz);births+=e.count;carry=e.remainder;}assert.equal(births,100);}});
test('particle carry handles fractional and zero rates',()=>{let e=emissionCount(0,.5,1);assert.equal(e.count,0);assert.equal(e.remainder,.5);e=emissionCount(e.remainder,.5,1);assert.equal(e.count,1);assert.equal(emissionCount(0,0,1).count,0);assert.equal(emissionCount(0,10,0).count,0);});
test('bundled renderer resolves without a browser import map',async()=>{const [{Stage},{Actor},{Fx}]=await Promise.all([import('../dist/view/stage.js'),import('../dist/view/actor.js'),import('../dist/view/fx.js')]);assert.equal(typeof Stage,'function');assert.equal(typeof Actor.create,'function');assert.equal(typeof Fx,'function');});
