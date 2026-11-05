import test from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../dist/engine.js';
import {seeded, runCampaign, report, route, WITH_OPTIONAL, BOTS} from './sim.mjs';

const started = () => { const s = E.newGame(); s.started = true; return s; };
const clone = v => JSON.parse(JSON.stringify(v));

test('world graph: links are two-way and every landmark exists', () => {
  for (const n of E.NODES) for (const id of n.links) {
    const t = E.nodeById(id);
    assert.ok(t, `${n.id} links to missing ${id}`);
    assert.ok(t.links.includes(n.id), `${n.id} -> ${id} is one-way`);
  }
  for (const n of E.NODES) for (const id of n.enemies || []) assert.ok(E.ENEMIES[id], `${n.id} uses unknown enemy ${id}`);
});

test('every landmark is reachable once all seals are earned', () => {
  const s = started();
  Object.assign(s.flags, {bell: true, mill: true, star: true, mother: true, ferryman: true});
  s.cleared = E.NODES.map(n => n.id);
  s.story.choices = Object.fromEntries(Object.keys(E.STORY_DEFAULTS).map(id=>[id,'legacy']));
  for (const n of E.NODES) if (n.id !== 'hearth' && !n.roaming) assert.ok(route(s, n.id), `no route to ${n.id}`);
});

test('gates block travel until their seal is earned', () => {
  const s = started();
  s.location = 'bell'; s.cleared.push('road', 'bell');
  assert.equal(E.travel(s, 'fen'), false);
  s.flags.bell = true;
  assert.equal(E.travel(s, 'fen'), true);
  assert.ok(s.party.some(h => h.id === 'fenn'), 'Fenn joins at Mothfen');
});

test('travel refuses unconnected destinations and travel before starting', () => {
  const s = E.newGame();
  assert.equal(E.travel(s, 'road'), false);
  s.started = true;
  assert.equal(E.travel(s, 'sun'), false);
});

test('marked targets take 50% more and the mark is consumed', () => {
  const s = started();
  E.travel(s, 'road', seeded(1));
  const e = s.battle.enemies[0];
  e.mark = true; e.hp = 100; e.maxHp = 100;
  E.damage(s, e, 10);
  assert.equal(e.hp, 85);
  assert.equal(e.mark, false);
});

test('shields absorb damage before HP', () => {
  const s = started();
  E.travel(s, 'road', seeded(1));
  const v = s.party[0];
  v.shield = 12; v.hp = 50;
  E.damage(s, v, 20);
  assert.equal(v.shield, 0);
  assert.equal(v.hp, 42);
});

test('potion is refused at full HP and reports the true amount healed', () => {
  const s = started();
  E.travel(s, 'road', seeded(3));
  const v = s.party[0];
  while (s.battle.actor !== 'vera') E.enemyAct(s, seeded(4));
  const potions = s.potions;
  v.hp = v.maxHp;
  assert.equal(E.act(s, 'potion', 'vera'), false, 'full HP draught refused');
  assert.equal(s.potions, potions);
  v.hp = 30;
  assert.equal(E.act(s, 'potion', 'vera'), true);
  assert.equal(v.hp, Math.min(v.maxHp, 30 + E.POTION_HEAL));
  assert.match(s.battle.log.find(t => t.includes('recovers')), new RegExp(`recovers ${v.hp - 30} HP`));
});

test('enemy specials are announced one round ahead', () => {
  const s = started();
  E.startBattle(s, E.nodeById('bell'), seeded(9));
  const bell = s.battle.enemies[0];
  s.battle.round = 2;
  assert.match(E.intent(s, bell), /charging Eclipse/);
  s.battle.round = 3;
  assert.match(E.intent(s, bell), /^Eclipse/);
});

test('enemies target Rook more often than Vera', () => {
  const s = started();
  E.recruit(s, 'rook');
  E.travel(s, 'road', seeded(1));
  const rng = seeded(42), counts = {vera: 0, rook: 0};
  for (let i = 0; i < 3000; i++) counts[E.pickTarget(s, rng).id]++;
  assert.ok(counts.rook > counts.vera * 1.6, JSON.stringify(counts));
});

test('upgrades have two tiers with rising prices and are town-only', () => {
  const s = started();
  s.gold = 1000;
  assert.equal(E.upgradePrice(s, 'vera', 'atk'), 50);
  assert.equal(E.buy(s, 'atk', 'vera'), true);
  assert.equal(E.upgradePrice(s, 'vera', 'atk'), 100);
  assert.equal(E.buy(s, 'atk', 'vera'), true);
  assert.equal(E.buy(s, 'atk', 'vera'), false, 'third tier refused');
  assert.equal(s.party[0].atk, E.HEROES.vera.atk + 8);
  assert.equal(s.gold, 850);
  s.location = 'road';
  assert.equal(E.buy(s, 'potion'), false, 'no shop outside towns');
});

test('legacy boolean upgrades count as tier 1', () => {
  const s = started();
  s.upgrades.verahp = true;
  assert.equal(E.upgradeLevel(s, 'vera', 'hp'), 1);
  assert.equal(E.upgradePrice(s, 'vera', 'hp'), 90);
});

test('optional echoes repeat rewards but not the first-clear blessing', () => {
  const s = started();
  const rng = seeded(5);
  E.recruit(s, 'rook');
  s.party.forEach(h => { h.atk = 99; h.maxHp = h.hp = 999; });
  s.location = 'well'; s.visited.push('well');
  E.travel(s, 'orchard', rng);
  while (s.battle && !s.battle.result) { const a = E.entity(s, s.battle.actor); if (s.battle.enemies.includes(a)) E.enemyAct(s, rng); else E.act(s, 'attack', null, rng); }
  E.finishBattle(s);
  const atk = s.party[0].atk, gold = s.gold;
  E.startBattle(s, E.nodeById('orchard'), rng);
  while (s.battle && !s.battle.result) { const a = E.entity(s, s.battle.actor); if (s.battle.enemies.includes(a)) E.enemyAct(s, rng); else E.act(s, 'attack', null, rng); }
  E.finishBattle(s);
  assert.equal(s.party[0].atk, atk, 'blessing not repeated');
  assert.ok(s.gold > gold, 'echo still pays');
});

test('defeat returns the company to Last Hearth, healed, minus up to 15 crowns', () => {
  const s = started();
  E.travel(s, 'road', seeded(2));
  s.party[0].hp = 0;
  E.nextActor(s);
  assert.equal(s.battle.result, 'defeat');
  s.gold = 10;
  assert.equal(E.finishBattle(s), 'defeat');
  assert.equal(s.location, 'hearth');
  assert.equal(s.gold, 0);
  assert.equal(s.party[0].hp, s.party[0].maxHp);
});

test('bosses cannot be fled from; ordinary fights can', () => {
  const s = started();
  E.startBattle(s, E.nodeById('bell'), seeded(1));
  while (!s.party.some(h => h.id === s.battle.actor)) E.enemyAct(s, seeded(1));
  assert.equal(E.act(s, 'flee', null, () => 0), false);
  const normal=started();
  E.travel(normal,'road',seeded(1));
  while (!normal.party.some(h=>h.id===normal.battle.actor))E.enemyAct(normal,seeded(1));
  assert.equal(E.act(normal,'flee',null,()=>0),true);
  assert.equal(normal.battle.result,'fled');
});

test('validSave accepts fresh, active battle and completed campaign saves', () => {
  const r = runCampaign(77, {goals: WITH_OPTIONAL});
  assert.ok(r.finished);
  assert.ok(E.validSave(clone(r.s)), 'finished campaign save');
  const s = started();
  assert.ok(E.validSave(clone(s)), 'fresh save');
  E.travel(s, 'road', seeded(8));
  assert.ok(E.validSave(clone(s)), 'mid-battle save');
});

test('validSave rejects malformed and inconsistent saves', () => {
  const s = started();
  E.travel(s, 'road', seeded(8));
  const good = clone(s);
  const bad = [
    null, [], 'save', {...good, version: 99}, {...good, location: 'nowhere'}, {...good, gold: -5}, {...good, gold: 1.5},
    {...good, level: 0}, {...good, visited: ['road', 'road']}, {...good, visited: ['hearth']},
    {...good, history: [42]}, {...good, flags: {evil: true}}, {...good, flags: {bell: 'yes'}},
    {...good, upgrades: {veraatk: 9}}, {...good, ending: 'party'}, {...good, party: []},
    {...good, party: [{...good.party[0], id: 'rook'}]}, {...good, party: [{...good.party[0], hp: 999}]},
    {...good, battle: {...good.battle, node: 'fen'}}, {...good, battle: {...good.battle, enemies: []}},
    {...good, battle: {...good.battle, queue: ['ghost']}}, {...good, battle: {...good.battle, actor: 'nobody'}},
    {...good, battle: {...good.battle, result: 'maybe'}}, {...good, battle: {...good.battle, log: [{}]}},
    {...good, battle: {...good.battle, enemies: good.battle.enemies.map(e => ({...e, hp: 'lots'}))}},
  ];
  bad.forEach((v, i) => assert.equal(E.validSave(v), false, `bad save #${i} accepted`));
});

test('balance: tactical play finishes the main path with some boss losses', () => {
  const r = report(120);
  assert.equal(r.finished, 1);
  assert.ok(r.deaths > 0.2 && r.deaths < 1.5, `deaths ${r.deaths}`);
  assert.ok(r.rounds > 50, `rounds ${r.rounds}`);
});

test('balance: optional sites make the campaign easier', () => {
  const main = report(120), opt = report(120, {goals: WITH_OPTIONAL});
  assert.ok(opt.deaths < main.deaths);
});

test('balance: attack-only play is viable with optional sites', () => {
  const r = report(120, {bot: BOTS.naive, goals: WITH_OPTIONAL});
  assert.ok(r.finished >= 0.75, `finished ${r.finished}`);
});
