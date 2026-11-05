import {MAIN_STORY_PATH,STORY_DEFAULTS,STORY_REQUIREMENTS,SCENES,sceneAt,hasScene,canEnterNode,validStory} from './story.js';
export {MAIN_STORY_PATH,STORY_DEFAULTS,SCENES};
import * as W from './world.js';
export {PLACES,WIDTH,HEIGHT,terrain,pathTo} from './world.js';
// Pure game rules. UI and persistence live in app.js. No external dependencies.
export const POTION_HEAL=45,MAX_UPGRADE=2;
export const UPGRADES={atk:{name:'Tempered weapon',price:50,gain:'+4 attack'},hp:{name:'Wayfarer armour',price:45,gain:'+20 maximum HP'},spd:{name:'Fleetfoot charm',price:40,gain:'+4 initiative'}};
export const SUPPLIES={potion:18,tonic:22};
export const HEROES={
 vera:{name:'Vera',role:'Lantern mage',hp:62,atk:12,spd:12,focus:12,color:'#b08ae4',skill:'Sunshard',cost:4,description:'Strike for 2× damage. Mark the target: the next hit deals 50% more.'},
 rook:{name:'Rook',role:'Oathless knight',hp:94,atk:14,spd:8,focus:10,color:'#e9ae6d',skill:'Iron vigil',cost:4,description:'Hit for 1.4× damage; shield every living ally for 12 damage.'},
 fenn:{name:'Fenn',role:'Marsh apothecary',hp:68,atk:11,spd:16,focus:14,color:'#a9c77b',skill:'Greenwake',cost:5,description:'Restore 24 HP to every living ally. Clear their poison.'}
};
export const NODES=[
 {id:'hearth',name:'Last Hearth',x:12,y:76,type:'town',region:'The Lowlands',text:'The last inn keeps its windows lit with bottled dawn. Keeper Elin presses a cold lantern into your hands. “Your mother took the sun below the mountain. Go and ask her why.”',links:['road','well','thornstead']},
 {id:'well',name:'Wishing Well',x:9,y:48,type:'story',region:'The Lowlands',text:'A voice under the water asks for a memory. There is no coin at the bottom, only a child’s glove.',links:['hearth','orchard'],event:'well'},
 {id:'road',name:'Ashen Road',x:25,y:69,type:'battle',region:'The Lowlands',text:'Lantern moths have grown large on stolen light. A knight with a broken sword holds the road.',links:['hearth','orchard','bell','thornstead'],enemies:['moth','moth'],recruit:'rook'},
 {id:'orchard',name:'Glass Orchard',x:25,y:42,type:'battle',region:'The Lowlands',text:'Every apple holds a tiny, sleeping sunrise. The roots begin to move.',links:['well','road','archive','tallow'],enemies:['thorn','moth'],optional:true,reward:'atk'},
 {id:'bell',name:'Bellwatch',x:39,y:70,type:'boss',region:'The Lowlands',text:'The bell has rung thirteen times each night since the sun went missing. Something inside it is learning to sing.',links:['road','fen','bridgehold'],enemies:['bell'],seal:'bell'},
 {id:'archive',name:'Drowned Archive',x:40,y:35,type:'battle',region:'The Lowlands',text:'A ledger survives the flood: the sun was not stolen. It was locked away during a plague of living fire.',links:['orchard','fen','thornstead','bridgehold'],enemies:['shade','thorn'],reward:'hp'},
 {id:'fen',name:'Mothfen',x:50,y:58,type:'town',region:'The Mothfen',text:'Fenn tends a garden in the ribs of an ancient boat. “The dark kills slowly. The old sun killed in seconds. Let us find another way.”',links:['bell','archive','causeway','hut','blight'],gate:'bell',recruit:'fenn'},
 {id:'hut',name:'Witchlight Hut',x:48,y:81,type:'story',region:'The Mothfen',text:'A ferryman is trapped beneath a fallen beam. On his table, a vial of pure sunlight begins to crack.',links:['fen','barrow','saltwick'],event:'ferryman'},
 {id:'causeway',name:'Reed Causeway',x:61,y:49,type:'battle',region:'The Mothfen',text:'Bootprints lead into black water. Their owners return wearing masks of reeds.',links:['fen','barrow','market','blight','sluice'],enemies:['drowned','shade']},
 {id:'barrow',name:'King’s Barrow',x:61,y:76,type:'battle',region:'The Mothfen',text:'The old king demanded that even his shadow kneel. It has waited here ever since.',links:['hut','causeway','mill'],enemies:['knight','shade'],optional:true,reward:'spd'},
 {id:'mill',name:'Moonless Mill',x:73,y:72,type:'boss',region:'The Mothfen',text:'A wheel turns against the current. Its miller grinds dreams into flour and feeds them to the dark.',links:['barrow','market','pass','sluice'],enemies:['miller'],seal:'mill'},
 {id:'market',name:'Cinder Market',x:73,y:42,type:'town',region:'The Cinder Peaks',text:'Merchants trade beneath a petrified dragon. Their lamps burn blue; the mountain breathes warm.',links:['causeway','mill','observatory','pass']},
 {id:'observatory',name:'Starfall Lens',x:66,y:18,type:'battle',region:'The Cinder Peaks',text:'Through the broken lens you see a second sun. It is small, patient, and made of the light people give away.',links:['market','spire'],enemies:['wisp','wisp','shade'],optional:true,reward:'focus'},
 {id:'pass',name:'Ember Pass',x:84,y:56,type:'battle',region:'The Cinder Peaks',text:'The mountain’s first guardian was once your mother’s friend. Its molten hands spell a warning.',links:['mill','market','spire','kiln'],gate:'mill',enemies:['knight','wisp']},
 {id:'spire',name:'The Hollow Spire',x:84,y:27,type:'boss',region:'The Cinder Peaks',text:'An astronomer has sewn the constellations into his cloak. He calls the darkness a necessary mercy.',links:['pass','observatory','door','crucible'],gate:'mill',enemies:['astronomer'],seal:'star'},
 {id:'door',name:'Dawnless Gate',x:94,y:35,type:'story',region:'The Sunken Sun',text:'Three seals open the mountain. Behind the door, your mother has grown old holding back a burning ocean.',links:['spire','sun','cinderheart'],gate:'star',event:'mother'},
 {id:'sun',name:'The Sunken Sun',x:94,y:12,type:'boss',region:'The Sunken Sun',text:'The first sun wakes. It remembers every offering. It has never learned to give.',links:['door','cinderheart'],gate:'mother',enemies:['sun'],seal:'sun'},
 {id:'thornstead',name:'Thornstead',type:'battle',region:'The Lowlands',text:'Rook recognizes the banners over these empty houses. His old regiment abandoned the villagers here. He asks to stay until their lanterns are lit again.',links:['hearth','road','archive'],enemies:['thorn','moth'],reward:'hp'},
 {id:'tallow',name:'Tallow Chapel',type:'battle',region:'The Lowlands',text:'The candles burn with borrowed voices. One speaks Rook’s name. He sets down his broken sword and answers each voice until the last one is quiet.',links:['orchard'],enemies:['shade'],optional:true,reward:'focus'},
 {id:'blight',name:'Blighted Garden',type:'battle',region:'The Mothfen',text:'Fenn’s first garden still grows beneath the black water. “Medicine can be poison,” Fenn says. “The difference is who gets to choose.”',links:['fen','causeway','sluice'],enemies:['drowned','thorn'],reward:'atk'},
 {id:'kiln',name:'The Living Kiln',type:'battle',region:'The Cinder Peaks',text:'The mountain’s smiths left their tools inside an unfinished guardian. It still waits for someone to tell it that its work is done.',links:['pass','crucible'],enemies:['knight','wisp','wisp'],reward:'hp'},
 {id:'saltwick',name:'Saltwick Landing',type:'town',region:'The Salt Isles',gate:'ferryman',text:'The ferryman brings you to a village that has survived without a sunrise for generations. Its lamps run on tidal glass. Perhaps the world has more than one answer to darkness.',links:['hut','shoals']},
 {id:'shoals',name:'The Singing Shoals',type:'battle',region:'The Salt Isles',gate:'ferryman',text:'The tide repeats every word you have never said. Fenn hears an apology. Rook hears an order. Vera hears her mother laughing.',links:['saltwick','abbey','grotto'],enemies:['drowned','shade'],optional:true,reward:'spd'},
 {id:'abbey',name:'Abbey of Small Lights',type:'battle',region:'The Salt Isles',gate:'ferryman',text:'The monks share a single spark between a hundred lanterns. The light grows each time it is given away. Their last guardian has forgotten how to open its hands.',links:['shoals'],enemies:['abbot'],optional:true,reward:'focus'},
 {id:'grotto',name:'Pearlglass Grotto',type:'battle',region:'The Salt Isles',gate:'ferryman',text:'A pearl at the heart of the cavern holds a picture of tomorrow. It shows no sun at all, only windows full of light.',links:['shoals'],enemies:['wisp','drowned','shade'],optional:true,reward:'atk'},

 {id:'bridgehold',name:'Lantern Toll',type:'battle',region:'The Lowlands',text:'The old bridge officers still collect a toll for dawn. Their ledger has no column for those who could not pay. Rook recognizes the seal on their armour.',links:['archive','bell'],enemies:['collector','moth']},
 {id:'sluice',name:'The Flooded Sluice',type:'battle',region:'The Mothfen',text:'The mill drinks the river through this lock. Its keepers have chained the wheel open. Break their watch and the sleepers downstream can dream without feeding the miller.',links:['blight','causeway','mill'],enemies:['lockkeeper','shade']},
 {id:'crucible',name:'Ashen Crucible',type:'boss',region:'The Cinder Peaks',text:'The Oracle tests every pilgrim here. A discarded guardian carries a furnace in each hand, offering the mountain a choice between obedience and ash.',links:['kiln','spire'],enemies:['crucible']},
 {id:'cinderheart',name:'Heart of the Furnace',type:'battle',region:'The Sunken Sun',text:'Your mother’s lantern was one of hundreds. The others still hold the sun’s hunger behind glass. Freeing their keepers will leave the old sun with nothing left to borrow.',links:['door','sun'],enemies:['sunkeeper','embershard']},
 {id:'briar',name:'The Briar Warden',type:'boss',region:'The Lowlands',text:'A walking thorn-crown patrols the western woods. Its huge silhouette warns you away. This optional guardian will wait until you are ready.',links:[],enemies:['warden'],optional:true,reward:'hp',roaming:true},
 {id:'tempest',name:'The Tempest Pilgrim',type:'boss',region:'The Mothfen',text:'A traveller made of lightning walks the northern marsh. Each footstep carries a summer storm. Approach only with a prepared company.',links:[],enemies:['tempest'],optional:true,reward:'focus',roaming:true}
];
// Tile positions replace the old percentage coordinates for both labels and collision.
NODES.forEach(n=>{const p=W.PLACES[n.id];n.x=(p[0]+.5)/W.WIDTH*100;n.y=(p[1]+.5)/W.HEIGHT*100;});
// Tuned Nov 4 2026 with tests/sim.mjs: tactical bots finish the main path with ~0.6 boss losses; attack-only bots need optional sites.
export const ENEMIES={
 collector:{name:'Dawn collector',hp:100,atk:14,spd:11,kind:'knight',xp:35,gold:32,move:'drain'},
 lockkeeper:{name:'Sluice keeper',hp:190,atk:21,spd:9,kind:'tree',xp:65,gold:50,move:'poison'},
 crucible:{name:'The Unfinished Judge',hp:650,atk:32,spd:12,kind:'knight',xp:150,gold:95,move:'aoe'},
 sunkeeper:{name:'Lantern keeper',hp:320,atk:27,spd:14,kind:'mage',xp:70,gold:50,move:'drain'},
 embershard:{name:'A borrowed dawn',hp:220,atk:25,spd:17,kind:'sun',xp:65,gold:40,move:'aoe'},
 warden:{name:'Briar Warden',hp:360,atk:22,spd:9,kind:'tree',xp:100,gold:80,move:'poison'},
 tempest:{name:'Tempest Pilgrim',hp:620,atk:29,spd:18,kind:'mage',xp:150,gold:120,move:'aoe'},
 abbot:{name:'Keeper of Small Lights',hp:420,atk:23,spd:12,kind:'bell',xp:110,gold:100,move:'drain'},
 moth:{name:'Lantern moth',hp:39,atk:8,spd:10,kind:'moth',xp:18,gold:12},
 thorn:{name:'Glassroot',hp:92,atk:13,spd:7,kind:'tree',xp:25,gold:18,move:'poison'},
 bell:{name:'The Thirteenth Bell',hp:206,atk:16,spd:8,kind:'bell',xp:85,gold:65,move:'aoe'},
 shade:{name:'Ink revenant',hp:95,atk:14,spd:13,kind:'ghost',xp:28,gold:20,move:'drain'},
 drowned:{name:'Reedwalker',hp:128,atk:18,spd:10,kind:'tree',xp:34,gold:25,move:'poison'},
 knight:{name:'Hollow sentinel',hp:179,atk:22,spd:8,kind:'knight',xp:45,gold:35},
 miller:{name:'The Dream Miller',hp:680,atk:29,spd:12,kind:'ghost',xp:135,gold:95,move:'aoe'},
 wisp:{name:'Cinder wisp',hp:122,atk:21,spd:18,kind:'moth',xp:40,gold:30,move:'drain'},
 astronomer:{name:'Star-sewn Oracle',hp:900,atk:34,spd:17,kind:'mage',xp:160,gold:120,move:'aoe'},
 sun:{name:'The First Sun',hp:1180,atk:37,spd:15,kind:'sun',xp:220,gold:180,move:'aoe'}
};
export function makeHero(id){const t=HEROES[id];return {...t,id,maxHp:t.hp,maxFocus:t.focus,guard:false,shield:0,poison:0};}
export function newGame(){return {version:3,story:{choices:{}},world:W.freshWorld(),started:false,location:'hearth',previous:'hearth',party:[makeHero('vera')],gold:45,potions:4,tonics:2,xp:0,level:1,visited:['hearth'],cleared:[],flags:{},upgrades:{},history:[],battles:0,steps:0,battle:null,ending:null};}
export const nodeById=id=>NODES.find(n=>n.id===id);
export function unlocked(s,n){return (!n.gate||!!s.flags[n.gate])&&canEnterNode(s,n.id);}
export function objectiveTarget(s){if(s.ending||s.flags.sun)return s.ending?null:'sun';for(const id of MAIN_STORY_PATH){const n=nodeById(id),scene=Object.values(SCENES).find(v=>v.location===id);if(n.enemies&&!s.cleared.includes(id))return id;if(scene&&!hasScene(s,scene.id))return id;if(n.event&&!s.flags[n.event])return id;if(!n.enemies&&!n.event&&!s.visited.includes(id))return id;}return 'sun';}
export function objective(s){if(s.ending)return 'The kingdom remembers your choice. Explore any unfinished paths.';if(s.flags.sun)return 'Choose the future of the light at The Sunken Sun.';const id=objectiveTarget(s),scene=Object.values(SCENES).find(v=>v.location===id&&!hasScene(s,v.id));if(scene&&s.cleared.includes(id))return 'Speak with the company at '+nodeById(id).name+'.';const instructions={road:'Help the knight holding Ashen Road.',thornstead:'Return with Rook to Thornstead and open the abandoned houses.',archive:'Recover the keeper’s ledger from the Drowned Archive.',bridgehold:'Break the collectors’ watch at Lantern Toll.',bell:'Silence the Thirteenth Bell and recover the brass seal.',fen:'Find Fenn in Mothfen.',causeway:'Cross Reed Causeway and trace the poisoned river.',blight:'Help Fenn reclaim the Blighted Garden.',sluice:'Break the mill’s hold on the river at the Flooded Sluice.',mill:'Free the stolen dreams at Moonless Mill.',market:'Restock in Cinder Market before the mountain crossing.',pass:'Face your mother’s old guardian at Ember Pass.',kiln:'Learn what the smiths left inside the Living Kiln.',crucible:'Pass the Unfinished Judge at the Ashen Crucible.',spire:'Confront the Oracle in the Hollow Spire.',door:'Meet your mother behind the Dawnless Gate.',cinderheart:'Free the lantern keepers at the Heart of the Furnace.',sun:'Face the First Sun and decide what dawn should mean.'};return instructions[id]||'Follow the thread of dawn.';}
export function log(s,t){s.history.unshift(t);s.history=s.history.slice(0,60);}
export function recruit(s,id){if(!s.party.some(h=>h.id===id)){const h=makeHero(id);for(let l=1;l<s.level;l++){h.maxHp+=9;h.hp+=9;h.atk+=2;}s.party.push(h);log(s,`${h.name} joined the company.`);}}
export function travel(s,id,rng=Math.random){const n=nodeById(id),current=nodeById(s.location);if(s.battle||pendingScene(s)||!s.started||!n||!current.links.includes(id)||!unlocked(s,n))return false;s.previous=s.location;s.location=id;s.steps++;s.world=W.freshWorld(id);if(!s.visited.includes(id))s.visited.push(id);if(n.enemies&&!s.cleared.includes(id))startBattle(s,n,rng);else if(n.recruit)recruit(s,n.recruit);return true;}
export function startBattle(s,n,rng=Math.random){s.battle={node:n.id,enemies:n.enemies.map((id,i)=>({...ENEMIES[id],id:'enemy'+i,maxHp:ENEMIES[id].hp,mark:false,shield:0,poison:0,guard:false})),queue:[],round:0,actor:null,log:[`Battle at ${n.name}.`],result:null};if(n.id==='bell'&&s.story?.choices.archive_truth==='share'){s.battle.enemies[0].hp-=40;s.battle.enemies[0].maxHp-=40;}if(n.id==='sun'&&s.story?.choices.kiln_heart==='release'){s.battle.enemies[0].hp-=120;s.battle.enemies[0].maxHp-=120;}s.party.forEach(h=>{h.guard=false;h.shield=s.story?.choices.rook_oath==='shelter'?8:0;h.poison=0;});nextRound(s,rng);}
export function bl(s,t){s.battle.log.unshift(t);s.battle.log=s.battle.log.slice(0,30);}
export function living(s){return [...s.party,...s.battle.enemies].filter(h=>h.hp>0);}
export function nextRound(s,rng=Math.random){const b=s.battle;b.round++;b.queue=living(s).map(h=>({id:h.id,roll:h.spd+rng()*10})).sort((a,c)=>c.roll-a.roll).map(h=>h.id);nextActor(s,rng);}
export function entity(s,id){return [...s.party,...s.battle.enemies].find(h=>h.id===id);}
export function nextActor(s,rng=Math.random){const b=s.battle;if(checkResult(s))return;while(b.queue.length){const id=b.queue.shift(),h=entity(s,id);if(!h||h.hp<=0)continue;b.actor=id;h.guard=false;if(s.party.includes(h))h.focus=Math.min(h.maxFocus,h.focus+1);if(h.poison){const poisonDamage=s.party.includes(h)&&s.story?.choices.fenn_garden==='antidote'?2:4;h.hp=Math.max(0,h.hp-poisonDamage);h.poison--;bl(s,`${h.name} takes ${poisonDamage} poison damage.`);if(checkResult(s))return;if(h.hp<=0)continue;}return;}nextRound(s,rng);}
export function damage(s,target,amount){let d=Math.max(1,Math.round(amount*(target.mark?1.5:1)*(target.guard?0.5:1)));target.mark=false;const absorbed=Math.min(target.shield||0,d);target.shield=(target.shield||0)-absorbed;d-=absorbed;target.hp=Math.max(0,target.hp-d);bl(s,`${target.name} takes ${d} damage${absorbed?` (${absorbed} blocked)`:''}${target.hp===0?' and falls':''}.`);return d;}
export function checkResult(s){const b=s.battle;if(b.result)return true;if(!b.enemies.some(h=>h.hp>0)){b.result='victory';b.actor=null;return true;}if(!s.party.some(h=>h.hp>0)){b.result='defeat';b.actor=null;return true;}return false;}
export function act(s,action,targetId,rng=Math.random){const b=s.battle;if(!b||b.result)return false;const h=entity(s,b.actor);if(!s.party.includes(h))return false;const t=b.enemies.find(e=>e.id===targetId&&e.hp>0)||b.enemies.find(e=>e.hp>0);const roll=()=>0.85+rng()*0.3;
 if(action==='attack'){bl(s,`${h.name} attacks.`);damage(s,t,h.atk*roll());}
 else if(action==='skill'){if(h.focus<h.cost)return false;h.focus-=h.cost;bl(s,`${h.name} uses ${h.skill}.`);if(h.id==='vera'){damage(s,t,h.atk*2*roll());if(t.hp>0)t.mark=true;}else if(h.id==='rook'){damage(s,t,h.atk*1.4*roll());s.party.filter(a=>a.hp>0).forEach(a=>a.shield+=(s.story?.choices.kiln_heart==='temper'?18:12));}else s.party.filter(a=>a.hp>0).forEach(a=>{a.hp=Math.min(a.maxHp,a.hp+24);a.poison=0;});}
 else if(action==='guard'){h.guard=true;h.focus=Math.min(h.maxFocus,h.focus+3);bl(s,`${h.name} guards and restores 3 focus.`);}
 else if(action==='restore'){h.hp=Math.min(h.maxHp,h.hp+Math.ceil(h.maxHp*.25));bl(s,`${h.name} binds their wounds.`);}
 else if(action==='potion'){if(s.potions<1)return false;const a=s.party.find(a=>a.id===targetId)||h;if(a.hp>=a.maxHp)return false;s.potions--;const down=a.hp<=0,before=a.hp;a.hp=Math.min(a.maxHp,a.hp+POTION_HEAL);bl(s,`${a.name} recovers ${a.hp-before} HP${down?' and returns to battle':''}.`);}
 else if(action==='flee'){if(nodeById(b.node).type==='boss'){bl(s,'This guardian blocks the only exit.');return false;}if(rng()<0.75){b.result='fled';b.actor=null;return true;}bl(s,'The escape route is blocked.');}
 else return false;
 nextActor(s,rng);return true;
}
export const MOVE_TEXT={aoe:'Eclipse · hits everyone',poison:'Venom · poisons a hero',drain:'Siphon · steals focus'};
export function intent(s,e){const r=s.battle.round;if(e.move&&r%3===0)return MOVE_TEXT[e.move];if(e.move&&r%3===2)return 'Strike · charging '+MOVE_TEXT[e.move].split(' · ')[0]+' next round';return 'Strike · single target';}
// Enemies prefer Rook (a knight draws attention) and avoid heroes who are guarding.
export function pickTarget(s,rng=Math.random){const heroes=s.party.filter(h=>h.hp>0),w=heroes.map(h=>(h.id==='rook'?2:1)*(h.guard?0.6:1)),total=w.reduce((a,b)=>a+b,0);let r=rng()*total;for(let i=0;i<heroes.length;i++){r-=w[i];if(r<0)return heroes[i];}return heroes[heroes.length-1];}
export function enemyAct(s,rng=Math.random){const b=s.battle;if(!b||b.result)return false;const e=entity(s,b.actor);if(!b.enemies.includes(e))return false;const heroes=s.party.filter(h=>h.hp>0),t=pickTarget(s,rng),special=e.move&&b.round%3===0;bl(s,`${e.name}: ${special?MOVE_TEXT[e.move]:'Strike'}${special?'':' → '+t.name}.`);if(special&&e.move==='aoe')heroes.forEach(h=>damage(s,h,e.atk*.75));else{damage(s,t,e.atk*(.85+rng()*.3));if(special&&e.move==='poison')t.poison=3;if(special&&e.move==='drain')t.focus=Math.max(0,t.focus-3);}nextActor(s,rng);return true;}
export function healAll(s){s.party.forEach(h=>{h.hp=h.maxHp;h.focus=h.maxFocus;h.poison=0;h.shield=0;h.guard=false;});}
export function finishBattle(s){const b=s.battle;if(!b?.result)return null;const result=b.result,n=nodeById(b.node);if(result==='victory'){const first=!s.cleared.includes(n.id);s.battles++;let xp=b.enemies.reduce((a,e)=>a+e.xp,0),gold=b.enemies.reduce((a,e)=>a+e.gold,0);s.xp+=xp;s.gold+=gold;if(first)s.cleared.push(n.id);if(n.seal)s.flags[n.seal]=true;if(n.recruit)recruit(s,n.recruit);if(first&&n.reward){s.party.forEach(h=>{if(n.reward==='atk')h.atk+=2;if(n.reward==='hp')h.maxHp+=12;if(n.reward==='spd')h.spd+=3;if(n.reward==='focus')h.maxFocus+=3;});log(s,`${n.name}: permanent ${n.reward} blessing for the company.`);}while(s.xp>=s.level*100){s.xp-=s.level*100;s.level++;s.party.forEach(h=>{h.maxHp+=9;h.atk+=2;});log(s,`Company reached level ${s.level}.`);}s.party.forEach(h=>{h.hp=h.maxHp;h.poison=0;h.shield=0;});log(s,`Won at ${n.name}. +${xp} XP, +${gold} crowns.`);}else {s.location=result==='fled'?s.previous:'hearth';if(result==='defeat'){s.gold=Math.max(0,s.gold-15);healAll(s);log(s,'Elin found you in the dark. Lost 15 crowns; the company recovered at Last Hearth.');}}if(result!=='victory')s.world=W.freshWorld(s.location);s.battle=null;return result;}
export function resolveEvent(s,choice){const n=nodeById(s.location);if(!atLandmark(s)||!n.event||s.flags[n.event])return false;if(n.event==='well'){if(!['memory','leave'].includes(choice))return false;if(choice==='memory'){s.party.forEach(h=>{h.maxFocus+=2;h.focus+=2;});s.flags.memory=true;}else{s.potions+=2;}s.flags.well=true;log(s,choice==='memory'?'The well kept your first memory of daylight. +2 maximum focus.':'You left the memory untouched. Found two healing draughts.');}
 if(n.event==='ferryman'){if(!['rescue','vial'].includes(choice))return false;if(choice==='rescue'){s.flags.mercy=true;s.gold+=30;}else{s.party.forEach(h=>h.atk+=3);s.flags.vial=true;}s.flags.ferryman=true;log(s,choice==='rescue'?'The ferryman lives. He promises to carry every lost soul home.':'You saved the sunlight. Its heat strengthens every weapon.');}
 if(n.event==='mother'){if(!['listen'].includes(choice))return false;s.flags.mother=true;s.flags.truth=true;healAll(s);log(s,'Your mother offers the lantern her final spark. The old sun must be faced.');}return true;}
export function upgradeLevel(s,heroId,kind){const v=s.upgrades[heroId+kind];return v===true?1:(v|0);}
export function upgradePrice(s,heroId,kind){const u=UPGRADES[kind];return u?u.price*(1+upgradeLevel(s,heroId,kind)):null;}
export function buy(s,kind,heroId){if(s.battle||!atLandmark(s)||nodeById(s.location).type!=='town')return false;const h=s.party.find(h=>h.id===heroId)||s.party[0];
 if(UPGRADES[kind]){const lv=upgradeLevel(s,h.id,kind),cost=upgradePrice(s,h.id,kind);if(lv>=MAX_UPGRADE||s.gold<cost)return false;s.upgrades[h.id+kind]=lv+1;if(kind==='atk')h.atk+=4;if(kind==='hp'){h.maxHp+=20;h.hp+=20;}if(kind==='spd')h.spd+=4;s.gold-=cost;return true;}
 const cost=SUPPLIES[kind];if(!cost||s.gold<cost)return false;if(kind==='potion')s.potions++;if(kind==='tonic')s.tonics++;s.gold-=cost;return true;}
// Strict structural validation for loaded or imported saves. Rejects anything the UI or turn logic could trip on.
export const FLAG_KEYS=['bell','mill','star','sun','mother','truth','memory','well','mercy','vial','ferryman'];
function validCore(v){
 const obj=x=>!!x&&typeof x==='object'&&!Array.isArray(x),num=(x,max=1e7)=>Number.isFinite(x)&&x>=0&&x<=max,int=(x,min=0,max=1e7)=>Number.isInteger(x)&&x>=min&&x<=max,str=(x,max=400)=>typeof x==='string'&&x.length<=max,bool=x=>typeof x==='boolean';
 const nodeList=a=>Array.isArray(a)&&a.length<=NODES.length&&new Set(a).size===a.length&&a.every(id=>typeof id==='string'&&nodeById(id));
 if(!obj(v)||v.version!==1||!bool(v.started)||!nodeById(v.location)||!nodeById(v.previous))return false;
 if(!['gold','potions','tonics','xp','steps','battles'].every(k=>int(v[k]))||!int(v.level,1,99))return false;
 if(!nodeList(v.visited)||!nodeList(v.cleared)||!v.visited.includes(v.location))return false;
 if(!Array.isArray(v.history)||v.history.length>100||!v.history.every(t=>str(t)))return false;
 if(!obj(v.flags)||!Object.entries(v.flags).every(([k,x])=>FLAG_KEYS.includes(k)&&bool(x)))return false;
 if(!obj(v.upgrades)||!Object.entries(v.upgrades).every(([k,x])=>/^(vera|rook|fenn)(atk|hp|spd)$/.test(k)&&(x===true||int(x,0,MAX_UPGRADE))))return false;
 if(v.ending!=null&&!['keeper','scatter'].includes(v.ending))return false;
 if(!Array.isArray(v.party)||v.party.length<1||v.party.length>3||!obj(v.party[0])||v.party[0].id!=='vera')return false;
 const fighter=h=>obj(h)&&str(h.name,60)&&['hp','maxHp','atk','spd'].every(k=>num(h[k]))&&h.maxHp>0&&h.hp<=h.maxHp&&num(h.shield??0)&&int(h.poison??0,0,10)&&bool(h.guard??false);
 if(new Set(v.party.map(h=>h?.id)).size!==v.party.length||!v.party.every(h=>HEROES[h.id]&&fighter(h)&&num(h.focus)&&num(h.maxFocus)&&h.focus<=h.maxFocus))return false;
 if(v.battle==null)return true;
 const b=v.battle,n=nodeById(b?.node);
 if(!obj(b)||!n?.enemies||b.node!==v.location||!Array.isArray(b.enemies)||b.enemies.length<1||b.enemies.length>4)return false;
 if(!b.enemies.every((e,i)=>fighter(e)&&e.id==='enemy'+i&&str(e.kind,20)&&int(e.xp)&&int(e.gold)&&[undefined,'aoe','poison','drain'].includes(e.move)&&bool(e.mark??false)))return false;
 const ids=[...v.party.map(h=>h.id),...b.enemies.map(e=>e.id)];
 if(!Array.isArray(b.queue)||b.queue.length>ids.length||new Set(b.queue).size!==b.queue.length||b.queue.includes(b.actor)||!b.queue.every(id=>ids.includes(id)))return false;
 if(!Array.isArray(b.log)||b.log.length>30||!b.log.every(t=>str(t))||!int(b.round,1,1e5))return false;
 if(![null,'victory','defeat','fled'].includes(b.result))return false;
 if(b.result===null){const a=[...v.party,...b.enemies].find(x=>x.id===b.actor);if(!a||a.hp<=0)return false;if(!v.party.some(h=>h.hp>0)||!b.enemies.some(e=>e.hp>0))return false;}
 return true;
}

// Old saves are migrated explicitly; the original JSON remains available to export.
export function migrateSave(v){try{if(!v||![1,2,3].includes(v.version)||!validCore({...v,version:1}))return null;if(v.version===3)return validStory(v.story)&&W.validWorld(v.world,v,NODES)?v:null;const out={...structuredClone(v),version:3,story:{choices:{}}};if(v.version===2){const probe={...v,flags:{...v.flags,bell:true,mill:true,star:true,mother:true},story:{choices:Object.fromEntries(Object.keys(SCENES).map(k=>[k,'legacy']))},cleared:NODES.map(n=>n.id)};if(!W.validWorld(v.world,probe,NODES))return null;out.world=structuredClone(v.world);}else out.world=W.freshWorld(v.location);
 const reached=id=>v.visited.includes(id)||v.battle?.node===id;const grandfather=(ids,scenes)=>{for(const id of ids)if(!out.cleared.includes(id))out.cleared=[...out.cleared,id];for(const id of scenes)out.story.choices[id]='legacy';};
 if(v.flags.bell||reached('bell')||v.flags.mill||v.flags.star||v.flags.mother)grandfather(['road','thornstead','archive','bridgehold'],['rook_oath','archive_truth']);
 if(v.flags.mill||reached('mill')||v.flags.star||v.flags.mother)grandfather(['causeway','blight','sluice'],['fenn_garden']);
 if(v.flags.star||reached('spire')||v.flags.mother)grandfather(['pass','kiln','crucible'],['kiln_heart']);
 if(v.flags.sun||reached('sun'))grandfather(['cinderheart'],[]);
 // Old free-walking saves could have entered any optional site before its new
 // prerequisite. Preserve their progress, including a battle already in flight.
 const before=id=>{const r=STORY_REQUIREMENTS[id];if(!r)return;if(r.cleared)for(const n of r.cleared){grandfather([n],[]);before(n);}if(r.scene){const scene=SCENES[r.scene];grandfather([scene.location],[r.scene]);before(scene.location);}};
 for(const id of [...v.visited,...v.cleared])before(id);
 if(out.cleared.includes('road'))recruit(out,'rook');
 if(v.visited.includes('fen')||v.flags.mill||v.flags.star||v.flags.mother)recruit(out,'fenn');
 if(!W.passable(out,out.world.x,out.world.y,NODES))out.world=W.freshWorld(out.location);
 return W.validWorld(out.world,out,NODES)?out:null;}catch{return null;}}
export function validSave(v){return !!migrateSave(v);}
export function atLandmark(s){const p=W.PLACES[s.location];return !!p&&s.world.x===p[0]&&s.world.y===p[1];}
export function arrive(s,id,rng=Math.random){const n=nodeById(id);if(!n||!unlocked(s,n))return false;s.previous=s.location;s.location=id;if(!s.visited.includes(id))s.visited.push(id);if(n.enemies&&!s.cleared.includes(id))startBattle(s,n,rng);else if(n.recruit)recruit(s,n.recruit);return true;}
export function walk(s,dx,dy,rng=Math.random){if(!s.started||s.battle||pendingScene(s)||Math.abs(dx)+Math.abs(dy)!==1)return false;const w=s.world,x=w.x+dx,y=w.y+dy;if(!W.passable(s,x,y,NODES))return false;const place=NODES.find(n=>!n.roaming&&W.PLACES[n.id][0]===x&&W.PLACES[n.id][1]===y);if(place&&!unlocked(s,place))return false;w.x=x;w.y=y;w.tick++;s.steps++;
 if(place)arrive(s,place.id,rng);
 if(!s.battle){for(const r of w.roamers){if(s.cleared.includes(r.id))continue;if(w.x===r.x&&w.y===r.y){arrive(s,r.id,rng);break;}if(w.tick%2===0){r.step=(r.step+1)%4;[r.x,r.y]=W.PATROLS[r.id][r.step];}if(w.x===r.x&&w.y===r.y){arrive(s,r.id,rng);break;}}}return true;}
export function sail(s){if(s.battle||pendingScene(s)||!atLandmark(s)||!['hut','saltwick'].includes(s.location)||!s.flags.ferryman)return false;if(!s.flags.mercy&&s.gold<40)return false;if(!s.flags.mercy)s.gold-=40;const to=s.location==='hut'?'saltwick':'hut';s.world=W.freshWorld(to);arrive(s,to);s.steps++;return true;}

export function pendingScene(s){return atLandmark(s)?sceneAt(s):null;}
export function chooseStory(s,choiceId){const scene=pendingScene(s);if(!scene||!scene.choices.some(c=>c.id===choiceId))return false;s.story.choices[scene.id]=choiceId;const vera=s.party.find(h=>h.id==='vera'),rook=s.party.find(h=>h.id==='rook');
 if(scene.id==='rook_oath'&&choiceId==='pursuit'&&rook)rook.atk+=3;
 if(scene.id==='archive_truth'&&choiceId==='keep'){vera.maxFocus+=4;vera.focus=Math.min(vera.maxFocus,vera.focus+4);}
 if(scene.id==='fenn_garden'&&choiceId==='venom')vera.atk+=3;
 if(scene.id==='kiln_heart'&&choiceId==='temper'&&rook)rook.description='Hit for 1.4× damage; shield every living ally for 18 damage.';
 log(s,scene.outcomes[choiceId]);return true;}
