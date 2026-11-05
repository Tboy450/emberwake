import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import * as W from '../dist/world.js';
import {seeded,fight,BRANCH_PROFILES} from './sim.mjs';
import {walkingCampaign,EXPANDED_PATH} from './walking-sim.mjs';
const start=()=>{const s=E.newGame();s.started=true;return s;};
const all=s=>{Object.assign(s.flags,{bell:true,mill:true,star:true,mother:true,ferryman:true,mercy:true});s.cleared=E.NODES.map(n=>n.id);s.story.choices=Object.fromEntries(Object.keys(E.STORY_DEFAULTS).map(id=>[id,'legacy']));};
test('walking simulator completes main and expanded routes without teleport travel',()=>{for(let i=1;i<=10;i++)for(const goals of [undefined,EXPANDED_PATH]){const r=walkingCampaign(i*7919,{goals});assert.ok(r.finished,'stuck at '+r.stuck);assert.ok(r.steps>=65);assert.ok(E.validSave(r.s));}});
test('all sixteen companion-choice combinations can finish the real main route without farming',()=>{
 const pairs=Object.keys(BRANCH_PROFILES.shared);
 const required=E.MAIN_STORY_PATH.filter(id=>E.nodeById(id).enemies);
 for(let mask=0;mask<16;mask++){
  const choices=Object.fromEntries(pairs.map((id,i)=>[id,BRANCH_PROFILES[(mask>>i)&1?'force':'shared'][id]]));
  const r=walkingCampaign((mask+1)*7919,{choices});
  assert.ok(r.finished,`branch ${mask} stuck at ${r.stuck}`);
  assert.ok(r.deaths<=3,`branch ${mask} requires excessive retries: ${r.deaths}`);
  assert.ok(required.every(id=>r.s.cleared.includes(id)),`branch ${mask} skipped a mandatory encounter`);
  assert.ok(required.every(id=>r.encounters.includes(id)),`branch ${mask} did not fight a mandatory encounter`);
  assert.equal(r.s.party.length,3);
  assert.deepEqual(r.s.story.choices,choices);
 }
});
test('actual expanded walking route supports both ferryman outcomes and finite return fares',()=>{
 for(const ferryman of ['rescue','vial']){
  // A paid-ferry traveller must budget fare instead of spending every crown at the outfitter.
  const r=walkingCampaign(7919,{goals:EXPANDED_PATH,events:{ferryman},reserveGold:ferryman==='vial'?40:0});
  assert.ok(r.finished,`${ferryman}: ${r.stuck}`);
  assert.ok(['saltwick','shoals','abbey','grotto'].every(id=>r.s.visited.includes(id)));
  assert.ok(r.s.gold>=0);
  assert.equal(!!r.s.flags.mercy,ferryman==='rescue');
 }
});
test('walk: cardinal tile steps consume one turn; blocked and diagonal moves do not',()=>{const s=start();assert.ok(E.walk(s,1,0));assert.equal(s.world.x,9);assert.equal(s.steps,1);assert.equal(E.walk(s,1,1),false);s.world.x=3;s.world.y=1;const tick=s.world.tick;assert.equal(E.walk(s,0,-1),false);assert.equal(s.world.tick,tick);});
test('walk: no movement before beginning or during combat',()=>{const s=E.newGame();assert.equal(E.walk(s,1,0),false);s.started=true;E.travel(s,'road');assert.equal(E.walk(s,1,0),false);});
test('map: every land landmark has a tile route with seals; islands require a ferry',()=>{const s=start();all(s);for(const n of E.NODES){const [x,y]=E.PLACES[n.id];assert.ok(W.passable(s,x,y,E.NODES),n.id+' blocked tile');if(n.region==='The Salt Isles')assert.equal(E.pathTo(s,x,y,E.NODES),null);else assert.ok(E.pathTo(s,x,y,E.NODES),n.id+' unreachable');}s.world=W.freshWorld('saltwick');for(const id of ['shoals','abbey','grotto'])assert.ok(E.pathTo(s,...E.PLACES[id],E.NODES),id);});
test('map: Bell, mountain, and crater gates cannot be bypassed by walking',()=>{const s=start();assert.equal(E.pathTo(s,...E.PLACES.fen,E.NODES),null);s.flags.bell=true;assert.ok(E.pathTo(s,...E.PLACES.fen,E.NODES));assert.equal(E.pathTo(s,...E.PLACES.spire,E.NODES),null);s.flags.mill=true;assert.equal(E.pathTo(s,...E.PLACES.spire,E.NODES),null,'Crucible is still required');s.cleared.push('crucible');assert.ok(E.pathTo(s,...E.PLACES.spire,E.NODES));assert.equal(E.pathTo(s,...E.PLACES.door,E.NODES),null);s.flags.star=true;assert.ok(E.pathTo(s,...E.PLACES.door,E.NODES));assert.equal(E.pathTo(s,...E.PLACES.sun,E.NODES),null);s.flags.mother=true;assert.equal(E.pathTo(s,...E.PLACES.sun,E.NODES),null,'Cinderheart is still required');s.cleared.push('cinderheart');assert.ok(E.pathTo(s,...E.PLACES.sun,E.NODES));});
test('walking onto Ashen Road starts combat and winning recruits Rook',()=>{const s=start(),rng=seeded(7),p=E.pathTo(s,...E.PLACES.road,E.NODES);for(const [x,y]of p){assert.ok(E.walk(s,x-s.world.x,y-s.world.y,rng));if(s.battle)break;}assert.equal(s.battle.node,'road');s.party[0].atk=1000;fight(s,rng);E.finishBattle(s);assert.ok(s.party.some(h=>h.id==='rook'));assert.ok(E.atLandmark(s));assert.ok(E.validSave(s));});
test('roaming bosses only advance on world turns and remain gone after victory',()=>{const s=start();const old=s.world.roamers[0].step;E.walk(s,1,0);assert.equal(s.world.roamers[0].step,old);E.walk(s,-1,0);assert.notEqual(s.world.roamers[0].step,old);const r=s.world.roamers[0];s.world.x=r.x-1;s.world.y=r.y;E.walk(s,1,0);assert.equal(s.battle?.node,'briar');s.party[0].atk=2000;fight(s,seeded(2));E.finishBattle(s);assert.ok(s.cleared.includes('briar'));assert.ok(E.validSave(s));});
test('ferry: rescue grants free return passage; vial choice charges each trip',()=>{const s=start();all(s);s.location='hut';s.world=W.freshWorld('hut');const gold=s.gold;assert.ok(E.sail(s));assert.equal(s.location,'saltwick');assert.equal(s.gold,gold);assert.ok(E.sail(s));assert.equal(s.location,'hut');s.flags.mercy=false;s.gold=39;assert.equal(E.sail(s),false);s.gold=40;assert.ok(E.sail(s));assert.equal(s.gold,0);assert.ok(E.validSave(s));});
test('v1 saves migrate at their landmark without dropping character progression',()=>{const s=start();s.gold=321;const old={...s,version:1};delete old.world;const migrated=E.migrateSave(old);assert.equal(migrated.version,3);assert.equal(migrated.gold,321);assert.deepEqual([migrated.world.x,migrated.world.y],E.PLACES.hearth);assert.equal(E.migrateSave({...old,party:[null]}),null);});
test('save validation rejects invalid coordinates, patrols and duplicate queue entries without throwing',()=>{const s=start();assert.equal(E.validSave({...s,world:{...s.world,x:-1}}),false);assert.equal(E.validSave({...s,world:{...s.world,roamers:[]}}),false);E.travel(s,'road');const clone=structuredClone(s);clone.battle.queue.push(clone.battle.queue[0]);assert.equal(E.validSave(clone),false);assert.equal(E.validSave({...s,party:[null]}),false);});
