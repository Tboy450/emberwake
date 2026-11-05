import test from 'node:test';
import assert from 'node:assert/strict';
import {emissionCount} from '../dist/view/emission.js';
test('particle rate is independent of frame rate',()=>{for(const hz of [30,60,120]){let carry=0,births=0;for(let i=0;i<hz*10;i++){const e=emissionCount(carry,10,1/hz);births+=e.count;carry=e.remainder;}assert.equal(births,100);}});
test('particle carry handles fractional and zero rates',()=>{let e=emissionCount(0,.5,1);assert.equal(e.count,0);assert.equal(e.remainder,.5);e=emissionCount(e.remainder,.5,1);assert.equal(e.count,1);assert.equal(emissionCount(0,0,1).count,0);assert.equal(emissionCount(0,10,0).count,0);});
test('bundled renderer resolves without a browser import map',async()=>{const [{Stage},{Actor},{Fx}]=await Promise.all([import('../dist/view/stage.js'),import('../dist/view/actor.js'),import('../dist/view/fx.js')]);assert.equal(typeof Stage,'function');assert.equal(typeof Actor.create,'function');assert.equal(typeof Fx,'function');});
