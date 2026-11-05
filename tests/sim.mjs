// Headless campaign simulator used by tests and balance tuning. Run directly for a balance report:
//   node tests/sim.mjs
import * as E from '../dist/engine.js';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export function seeded(seed) {
  let x = seed >>> 0;
  return () => ((x = (Math.imul(x, 1664525) + 1013904223) >>> 0) / 4294967296);
}

// Bot strategies. "smart" uses specials, guard, potions and healing; "naive" only attacks and drinks when low.
export const BOTS = {
  smart(s, hero, rng) {
    const b = s.battle, foes = b.enemies.filter(e => e.hp > 0).sort((x, y) => x.hp - y.hp);
    const tgt = (foes.find(e => e.mark) || foes[0]).id;
    const hurt = s.party.filter(h => h.hp > 0 && h.hp < h.maxHp * 0.4), down = s.party.find(h => h.hp <= 0);
    const eclipseSoon = b.enemies.some(e => e.hp > 0 && e.move === 'aoe' && b.round % 3 === 0);
    if (hero.id === 'fenn' && (hurt.length >= 2 || (eclipseSoon && hurt.length)) && hero.focus >= hero.cost) return ['skill', tgt];
    if ((down || hurt.length) && s.potions > 0) return ['potion', (down || hurt[0]).id];
    if (hero.id === 'rook' && hero.focus >= hero.cost && (eclipseSoon || s.party.length > 1)) return ['skill', tgt];
    if (hero.id === 'vera' && hero.focus >= hero.cost) return ['skill', tgt];
    if (hero.id === 'fenn' && hero.focus < hero.cost && hurt.length) return ['guard', tgt];
    return ['attack', tgt];
  },
  naive(s, hero) {
    const foes = s.battle.enemies.filter(e => e.hp > 0).sort((x, y) => x.hp - y.hp);
    const hurt = s.party.find(h => h.hp > 0 && h.hp < h.maxHp * 0.3) || s.party.find(h => h.hp <= 0);
    if (hurt && s.potions > 0) return ['potion', hurt.id];
    return ['attack', foes[0].id];
  },
};

export function fight(s, rng, bot = BOTS.smart) {
  let guard = 0;
  while (s.battle && !s.battle.result && guard++ < 5000) {
    const b = s.battle, a = E.entity(s, b.actor);
    if (b.enemies.includes(a)) { E.enemyAct(s, rng); continue; }
    const [action, target] = bot(s, a, rng);
    if (!E.act(s, action, target, rng)) E.act(s, 'attack', b.enemies.find(e => e.hp > 0).id, rng);
  }
  return s.battle?.result;
}

// Shortest unlocked route that only passes through cleared or encounter-free landmarks.
export function route(s, to, {allowUncleared = false} = {}) {
  const prev = {[s.location]: null}, q = [s.location];
  while (q.length) {
    const c = q.shift();
    if (c === to) break;
    for (const l of E.nodeById(c).links) {
      const n = E.nodeById(l);
      if (!(l in prev) && E.unlocked(s, n) && (allowUncleared || l === to || s.cleared.includes(l) || !n.enemies)) { prev[l] = c; q.push(l); }
    }
  }
  if (!(to in prev)) return null;
  const p = [];
  for (let c = to; c !== s.location; c = prev[c]) p.unshift(c);
  return p;
}

export const MAIN_PATH = E.MAIN_STORY_PATH || ['road', 'bell', 'fen', 'causeway', 'mill', 'pass', 'spire', 'door', 'sun'];
export const WITH_OPTIONAL = E.MAIN_STORY_PATH
  ? ['road','thornstead','well','orchard','tallow','archive','bridgehold','bell','fen','causeway','blight','hut','barrow','sluice','mill','market','observatory','pass','kiln','crucible','spire','door','cinderheart','sun']
  : ['road', 'well', 'orchard', 'bell', 'archive', 'fen', 'hut', 'causeway', 'barrow', 'mill', 'observatory', 'pass', 'spire', 'door', 'sun'];

export const BRANCH_PROFILES = {
  shared: {rook_oath:'shelter',archive_truth:'share',fenn_garden:'antidote',kiln_heart:'release'},
  force: {rook_oath:'pursuit',archive_truth:'keep',fenn_garden:'venom',kiln_heart:'temper'},
};

// Resolve only actual pending scenes using the same public actions as the UI.
// Choices may be overridden per run, so a successful default route cannot hide a broken branch.
export function resolveScenes(s, choices = {}) {
  let count = 0;
  for (;count < 20;count++) {
    const scene = E.pendingScene?.(s);
    if (!scene) return count;
    const choice = choices[scene.id] || E.STORY_DEFAULTS?.[scene.id] || scene.choices[0]?.id;
    if (!E.chooseStory(s, choice)) throw Error(`Scene ${scene.id} refused ${choice}`);
  }
  throw Error('Story scene loop did not terminate');
}

export function visitServices(s,{shop = true, choices = {}, events = {}, reserveGold = 0} = {}) {
  if (!E.atLandmark(s) || s.battle) return;
  resolveScenes(s,choices);
  const n = E.nodeById(s.location);
  if (n.event && !s.flags[n.event]) {
    const choice = events[n.event] || {well:'memory',ferryman:'rescue',mother:'listen'}[n.event];
    if (!E.resolveEvent(s,choice)) throw Error(`Event ${n.event} refused ${choice}`);
  }
  if (n.type !== 'town') return;
  E.healAll(s);
  if (!shop) return;
  while (s.gold >= E.SUPPLIES.potion + reserveGold && s.potions < 5) E.buy(s,'potion');
  for (let pass=0;pass<2;pass++) for (const h of s.party) for (const kind of ['atk','hp','spd'])
    if(s.gold-E.upgradePrice(s,h.id,kind)>=reserveGold)E.buy(s,kind,h.id);
}

export function runCampaign(seed, {goals = MAIN_PATH, bot = BOTS.smart, shop = true, choices = {}, events = {}} = {}) {
  const rng = seeded(seed), s = E.newGame();
  s.started = true;
  let deaths = 0, fights = 0, rounds = 0;
  const bossDeaths = {};
  const services = () => visitServices(s,{shop,choices,events});
  for (const goal of goals) {
    let attempts = 0;
    const done = () => s.cleared.includes(goal) || (s.location === goal && !E.nodeById(goal).enemies);
    while (!done() && attempts++ < 12) {
      services();
      const p = route(s, goal, {allowUncleared:true});
      if (!p) return {s, deaths, fights, finished: false, stuck: goal, bossDeaths};
      for (const step of p) {
        if (!E.travel(s, step, rng)) return {s,deaths,fights,rounds,finished:false,stuck:`travel ${step}`,bossDeaths};
        if (s.battle) {
          fights++;
          const node = s.battle.node, r = fight(s, rng, bot);
          rounds += s.battle.round;
          E.finishBattle(s);
          if (r !== 'victory') { deaths++; if (E.nodeById(node).type === 'boss') bossDeaths[node] = (bossDeaths[node] || 0) + 1; break; }
        }
        services();
      }
    }
    if (!done()) return {s, deaths, fights, rounds, finished: false, stuck: goal, bossDeaths};
  }
  services();
  return {s, deaths, fights, rounds, finished: !!s.flags.sun, bossDeaths};
}

export function report(n = 300, opts = {}) {
  let finished = 0, deaths = 0, fights = 0, rounds = 0, level = 0;
  const bossDeaths = {};
  for (let i = 1; i <= n; i++) {
    const r = runCampaign(i * 7919, opts);
    if (r.finished) finished++;
    deaths += r.deaths; fights += r.fights; rounds += r.rounds || 0; level += r.s.level;
    for (const [k, v] of Object.entries(r.bossDeaths)) bossDeaths[k] = (bossDeaths[k] || 0) + v;
  }
  return {finished: finished / n, deaths: deaths / n, fights: fights / n, rounds: rounds / n, level: level / n,
    bossDeaths: Object.fromEntries(Object.entries(bossDeaths).map(([k, v]) => [k, +(v / n).toFixed(2)]))};
}

if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  const fmt = r => JSON.stringify({...r, deaths: +r.deaths.toFixed(2), fights: +r.fights.toFixed(1), rounds: +r.rounds.toFixed(0), level: +r.level.toFixed(1)});
  console.log('smart, main path      ', fmt(report(300)));
  console.log('smart, all optional   ', fmt(report(300, {goals: WITH_OPTIONAL})));
  console.log('naive, main path      ', fmt(report(300, {bot: BOTS.naive})));
  console.log('smart, main, no shop  ', fmt(report(300, {shop: false})));
}
