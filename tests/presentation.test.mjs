import test from 'node:test';
import assert from 'node:assert/strict';
import {emissionCount} from '../dist/view/emission.js';
import {battleFormation,targetYaw,attackTurn,attackPosition,arenaPlacement,ARENA_ELEVATION,ARENA_HEIGHT,ARENA_DISTANCE,ARENA_TARGET_Y} from '../dist/view/battle-blocking.js';
import {PerspectiveCamera,Vector3} from '../dist/vendor/three/three.module.min.js';
function arenaCamera(){const camera=new PerspectiveCamera(2*Math.atan(ARENA_HEIGHT/(2*ARENA_DISTANCE))*180/Math.PI,1.6,.1,150);camera.position.set(0,ARENA_TARGET_Y+Math.sin(ARENA_ELEVATION)*ARENA_DISTANCE,Math.cos(ARENA_ELEVATION)*ARENA_DISTANCE);camera.lookAt(0,ARENA_TARGET_Y,0);camera.updateMatrixWorld();return camera;}

test('depth formation separates silhouettes in the camera projection, including the attack lane',()=>{
 const party=[{w:1.7,h:2.3},{w:1.8,h:2.3},{w:1.8,h:2.3}],enemies=[{w:1.8,h:2.2},{w:2.5,h:2.2},{w:1.8,h:2.2}];
 const {slots}=battleFormation(party,enemies);
 const camera=arenaCamera(),box=s=>{const points=[[-.5,0],[.5,0],[-.5,1],[.5,1]].map(([x,y])=>new Vector3(s.x+x*s.actor.w*s.scale,y*s.actor.h*s.scale,s.z).project(camera));const xs=points.map(p=>p.x*ARENA_HEIGHT*.8),ys=points.map(p=>p.y*ARENA_HEIGHT/2);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};};
 const separated=(a,b)=>a.x+a.w+.2<=b.x||b.x+b.w+.2<=a.x||a.y+a.h+.2<=b.y||b.y+b.h+.2<=a.y;
 for(let i=0;i<slots.length;i++)for(let j=i+1;j<slots.length;j++)assert.ok(separated(box(slots[i]),box(slots[j])),'resting silhouettes must have a visible gap');
 for(const active of slots){const attack={...active,...attackPosition(active,active.actor.h)};for(const other of slots.filter(s=>s!==active))assert.ok(separated(box(attack),box(other)),'the release pose must clear all resting silhouettes');}
});

test('target headings include depth and spins finish on the target bearing',()=>{
 for(const to of [{x:-4,z:3},{x:4,z:-3},{x:0,z:-4}]){const end=targetYaw({x:0,z:0},to),length=Math.hypot(to.x,to.z);assert.ok(Math.abs(Math.sin(end)-to.x/length)<1e-10);assert.ok(Math.abs(Math.cos(end)-to.z/length)<1e-10);const finish=attackTurn(.3,end,1);assert.ok(Math.abs(Math.sin(finish)-Math.sin(end))<1e-10);}
});

test('the depth camera preserves a character’s projected height at front and rear positions',()=>{
 const camera=arenaCamera();
 const height=baseline=>{const p=arenaPlacement(3,baseline,2.2);return new Vector3(p.x,2.2*p.scale,p.z).project(camera).y-new Vector3(p.x,0,p.z).project(camera).y;};
 assert.ok(Math.abs(height(-1.1)-height(2.4))<1e-10);assert.ok(height(2.4)>.45);
});
test('particle rate is independent of frame rate',()=>{for(const hz of [30,60,120]){let carry=0,births=0;for(let i=0;i<hz*10;i++){const e=emissionCount(carry,10,1/hz);births+=e.count;carry=e.remainder;}assert.equal(births,100);}});
test('particle carry handles fractional and zero rates',()=>{let e=emissionCount(0,.5,1);assert.equal(e.count,0);assert.equal(e.remainder,.5);e=emissionCount(e.remainder,.5,1);assert.equal(e.count,1);assert.equal(emissionCount(0,0,1).count,0);assert.equal(emissionCount(0,10,0).count,0);});
test('bundled renderer resolves without a browser import map',async()=>{const [{Stage},{Actor},{Fx}]=await Promise.all([import('../dist/view/stage.js'),import('../dist/view/actor.js'),import('../dist/view/fx.js')]);assert.equal(typeof Stage,'function');assert.equal(typeof Actor.create,'function');assert.equal(typeof Fx,'function');});
