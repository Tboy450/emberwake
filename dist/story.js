// Original campaign data. This module deliberately imports no engine or UI code.
export const MAIN_STORY_PATH=['road','thornstead','archive','bridgehold','bell','fen','causeway','blight','sluice','mill','market','pass','kiln','crucible','spire','door','cinderheart','sun'];
export const STORY_DEFAULTS={rook_oath:'shelter',archive_truth:'share',fenn_garden:'antidote',kiln_heart:'release'};
export const STORY_REQUIREMENTS={
 thornstead:{cleared:['road']},archive:{scene:'rook_oath'},bridgehold:{scene:'archive_truth'},bell:{cleared:['bridgehold']},
 causeway:{flag:'bell'},blight:{cleared:['causeway']},sluice:{scene:'fenn_garden'},mill:{cleared:['sluice']},
 pass:{flag:'mill'},kiln:{cleared:['pass']},crucible:{scene:'kiln_heart'},spire:{cleared:['crucible']},
 cinderheart:{flag:'mother'},sun:{cleared:['cinderheart']}
};
export function hasScene(s,id){return !!s.story?.choices?.[id];}
export function canEnterNode(s,id){const r=STORY_REQUIREMENTS[id];return !r||(!r.cleared||r.cleared.every(n=>s.cleared.includes(n)))&&(!r.scene||hasScene(s,r.scene))&&(!r.flag||!!s.flags[r.flag]);}
export const SCENES={
 rook_oath:{id:'rook_oath',location:'thornstead',title:'The order he obeyed',eyebrow:'ROOK / A HOUSE WITH NO DOOR',lines:[
  {speaker:'Narrator',text:'The houses are empty, but someone has swept the street. On every doorstep stands an unlit lantern.'},
  {speaker:'Rook',text:'We were told to close the gates before the night came. I closed them. There were still people outside.'},
  {speaker:'Vera',text:'Who ordered it?'},
  {speaker:'Rook',text:'A good man, frightened enough to sound certain. I have spent ninety nights blaming his voice. These were my hands.'},
  {speaker:'Narrator',text:'Behind a boarded window, a child strikes a flint. Rook looks toward Bellwatch, then back at the door.'}
 ],choices:[
  {id:'shelter',label:'Help him open the houses',detail:'Rook learns to protect people before orders. The company starts every battle with 8 shield each.'},
  {id:'pursuit',label:'Ask him to face the bell first',detail:'Rook turns his anger toward the guardians. Rook gains 3 permanent attack.'}
 ],outcomes:{shelter:'You open the houses before taking the road. Rook promises to stand outside the gate this time. The company gains an opening shield.',pursuit:'You promise to return after Bellwatch. Rook puts an edge on his broken sword. Rook gains 3 attack.'}},
 archive_truth:{id:'archive_truth',location:'archive',title:'What the ledger kept',eyebrow:'THE LOWLANDS / AN INCONVENIENT TRUTH',lines:[
  {speaker:'Narrator',text:'The keeper’s ledger lists names, not offerings. Every summer the old sun took a little more: first the orchards, then the river, then the people.'},
  {speaker:'Vera',text:'My mother’s name is here. She petitioned the court to cover the sun. The court refused.'},
  {speaker:'Rook',text:'Then the bell is not calling her home. It is calling the king’s collectors.'},
  {speaker:'Narrator',text:'A survivor waits at the archive door. She can take the ledger back to the villages, or you can bind its remaining light into the lantern.'}
 ],choices:[
  {id:'share',label:'Send the ledger to the villages',detail:'The villagers silence Bellwatch’s outer chimes. Its guardian has 40 less maximum HP.'},
  {id:'keep',label:'Keep its light in the lantern',detail:'Vera gains 4 maximum focus. The bell keeps all of its strength.'}
 ],outcomes:{share:'The villages learn why dawn disappeared. Their runners muffle the outer chimes: Bellwatch loses 40 maximum HP.',keep:'You bind the ledger’s light into the lantern. Vera gains 4 maximum focus; the villages must wait for the truth.'}},
 fenn_garden:{id:'fenn_garden',location:'blight',title:'The dose and the cure',eyebrow:'FENN / THE FIRST GARDEN',lines:[
  {speaker:'Fenn',text:'I planted this garden when the river first went black. I called it a cure before I knew what it did.'},
  {speaker:'Narrator',text:'Under the water, roots have wrapped themselves around empty medicine bottles. Each carries Fenn’s mark.'},
  {speaker:'Vera',text:'You could not have known.'},
  {speaker:'Fenn',text:'I could have asked. That is different. Your mother may have saved the world, but we still have to ask what her saving cost.'},
  {speaker:'Narrator',text:'One bed of silver reeds survives. Fenn can distil a lasting antidote or turn their venom against the guardians.'}
 ],choices:[
  {id:'antidote',label:'Make medicine for the company',detail:'Poison deals 2 damage per turn to heroes instead of 4 for the rest of the journey.'},
  {id:'venom',label:'Arm the lantern with the venom',detail:'Vera gains 3 permanent attack. Poison remains at full strength.'}
 ],outcomes:{antidote:'Fenn makes a medicine with a label that admits its limits. Company poison damage is halved.',venom:'Fenn arms the lantern, then crosses the word cure off the bottle. Vera gains 3 attack.'}},
 kiln_heart:{id:'kiln_heart',location:'kiln',title:'An unfinished heart',eyebrow:'THE CINDER PEAKS / WHAT A TOOL IS FOR',lines:[
  {speaker:'Narrator',text:'Inside the guardian is a small furnace, still warm. The smith who made it left two sets of instructions: one for a weapon, one for a hearth.'},
  {speaker:'Rook',text:'I know what another shield could do. I am less certain another weapon is what this place needs.'},
  {speaker:'Fenn',text:'Let it cool and its heat will return to the mountain. The old sun will have less to feed on.'},
  {speaker:'Vera',text:'My mother held everything alone. We do not have to choose that way.'},
  {speaker:'Narrator',text:'The heart will survive one more use. The company waits for your decision.'}
 ],choices:[
  {id:'temper',label:'Temper Rook’s shield with the heart',detail:'Iron vigil shields each ally for 18 instead of 12 damage.'},
  {id:'release',label:'Return its heat to the mountain',detail:'The First Sun loses 120 maximum HP. Rook keeps the original Iron vigil.'}
 ],outcomes:{temper:'Rook carries the furnace’s last heat as a shelter. Iron vigil now grants 18 shield per ally.',release:'You let the little furnace go cold. Its heat disperses through the mountain; the First Sun loses 120 maximum HP.'}}
};
export function validStory(story){return !!story&&typeof story==='object'&&!Array.isArray(story)&&!!story.choices&&typeof story.choices==='object'&&!Array.isArray(story.choices)&&Object.entries(story.choices).every(([id,v])=>Object.hasOwn(SCENES,id)&&(v==='legacy'||SCENES[id].choices.some(c=>c.id===v)));}
export function sceneAt(s){if(!s.started||s.battle)return null;return Object.values(SCENES).find(scene=>scene.location===s.location&&s.cleared.includes(scene.location)&&!hasScene(s,scene.id))||null;}
