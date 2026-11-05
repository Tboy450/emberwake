// Walks real tiles and uses public story/combat/ferry actions. Bot turns are not human playtime.
import * as E from '../dist/engine.js';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {seeded,fight,MAIN_PATH,BOTS,BRANCH_PROFILES,visitServices} from './sim.mjs';

export const EXPANDED_PATH = E.MAIN_STORY_PATH
  ? ['road','thornstead','well','orchard','tallow','archive','bridgehold','bell','fen','causeway','blight','hut','saltwick','shoals','abbey','grotto','barrow','sluice','mill','market','observatory','pass','kiln','crucible','spire','door','cinderheart','sun']
  : ['road','thornstead','well','orchard','tallow','archive','bell','fen','blight','hut','saltwick','shoals','abbey','grotto','causeway','barrow','mill','observatory','pass','kiln','spire','door','sun'];

export function walkingCampaign(seed,{goals=MAIN_PATH,bot=BOTS.smart,shop=true,choices={},events={},reserveGold=0,onCheckpoint=null}={}) {
  const rng=seeded(seed),s=E.newGame();s.started=true;
  let deaths=0,fights=0,rounds=0;
  const encounters=[],bossDeaths={};
  const result=(finished,stuck)=>({finished,stuck,deaths,fights,rounds,steps:s.steps,encounters,bossDeaths,s});
  const check=()=>{if(!E.validSave(s))throw Error('Invalid walking save at '+s.location);onCheckpoint?.(s);};
  const services=()=>{visitServices(s,{shop,choices,events,reserveGold});check();};
  const done=id=>s.cleared.includes(id)||(s.location===id&&E.atLandmark(s)&&!E.nodeById(id).enemies);
  const isle=id=>E.nodeById(id).region==='The Salt Isles';
  for(const goal of goals) {
    let attempts=0;
    services();
    while(!done(goal)&&attempts++<25) {
      services();let target=goal;
      const onIsle=s.world.y>29;
      if(isle(goal)!==onIsle) {
        target=onIsle?'saltwick':'hut';
        if(s.location===target&&E.atLandmark(s)) {
          if(!E.sail(s))return result(false,'ferry');
          services();continue;
        }
      }
      const route=E.pathTo(s,...E.PLACES[target],E.NODES);
      if(!route)return result(false,target);
      if(!route.length&&!done(goal))return result(false,'empty route '+goal);
      for(const [x,y]of route) {
        if(!E.walk(s,x-s.world.x,y-s.world.y,rng))return result(false,'collision '+target);
        check();
        if(s.battle) {
          const node=s.battle.node;fights++;encounters.push(node);
          const outcome=fight(s,rng,bot);
          if(!outcome)return result(false,'battle loop '+node);
          rounds+=s.battle.round;E.finishBattle(s);
          if(outcome!=='victory'){deaths++;if(E.nodeById(node).type==='boss')bossDeaths[node]=(bossDeaths[node]||0)+1;}
          services();break;
        }
        services();
      }
    }
    if(!done(goal))return result(false,goal);
    services();
  }
  return result(!!s.flags.sun);
}

export function walkingReport(n=30,opts={}) {
  const out=Array.from({length:n},(_,i)=>walkingCampaign((i+1)*7919,opts));
  const average=k=>out.reduce((sum,r)=>sum+r[k],0)/n;
  return {finished:out.filter(r=>r.finished).length,runs:n,stuck:[...new Set(out.filter(r=>!r.finished).map(r=>r.stuck))],
    avgDefeats:average('deaths'),avgFights:average('fights'),avgRounds:average('rounds'),avgSteps:average('steps'),
    minUniqueBattles:Math.min(...out.map(r=>new Set(r.encounters).size))};
}

if(process.argv[1]&&path.resolve(fileURLToPath(import.meta.url))===path.resolve(process.argv[1])) {
  for(const [branch,choices]of Object.entries(BRANCH_PROFILES))for(const [route,goals]of [['main',MAIN_PATH],['expanded',EXPANDED_PATH]])
    console.log(branch,route,JSON.stringify(walkingReport(30,{goals,choices})));
}
