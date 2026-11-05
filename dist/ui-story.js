import * as E from './engine.js';
export const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const e=escapeHtml;

export function sceneMarkup(scene){
 return `<article class="story-scene" aria-labelledby="story-title"><header><span class="eyebrow">${e(scene.eyebrow||'A MOMENT ON THE ROAD')}</span><h2 id="story-title" tabindex="-1">${e(scene.title)}</h2><p class="scene-hint">The journey waits. Choose how the company answers.</p></header><div class="dialogue">${scene.lines.map(line=>`<div class="dialogue-line"><span class="speaker">${e(line.speaker)}</span><p>${e(line.text)}</p></div>`).join('')}</div><div class="story-choices">${scene.choices.map(choice=>`<button class="choice story-choice" data-story-choice="${e(choice.id)}"><strong>${e(choice.label)}</strong><span>${e(choice.detail)}</span><span class="choice-arrow" aria-hidden="true">↗</span></button>`).join('')}</div></article>`;
}

export function journeyMarkup(state){
 if(!state.started)return '';
 const target=E.objectiveTarget(state),n=E.nodeById(target),path=E.MAIN_STORY_PATH||[],required=path.map(E.nodeById).filter(n=>n?.enemies),completed=required.filter(n=>state.cleared.includes(n.id)).length;
 return `<div class="journey-thread"><div><span class="eyebrow">${state.ending?'CHRONICLE COMPLETE':'NEXT IN YOUR CHRONICLE'}</span><p>${e(E.objective(state))}</p></div>${n&&!state.battle?`<button class="route-button" data-node="${e(n.id)}">${state.location===n.id&&E.atLandmark(state)?'You are here':'Walk toward '+e(n.name)} <span aria-hidden="true">↗</span></button>`:''}<span class="journey-count">${completed} / ${required.length} story encounters</span></div>`;
}

export function roadmapMarkup(state){
 const next=E.objectiveTarget(state),seen=new Set();
 return `<div class="roadmap" aria-label="Main story route">${(E.MAIN_STORY_PATH||[]).filter(id=>{if(seen.has(id))return false;seen.add(id);return true;}).map(id=>{const n=E.nodeById(id);if(!n)return '';const done=n.enemies?state.cleared.includes(id):state.visited.includes(id)&&id!==next;return `<div class="roadmap-stop ${done?'done':''} ${id===next?'next':''}"><span aria-hidden="true">${done?'✓':id===next?'◆':'·'}</span><div><b>${e(n.name)}</b><small>${done?'Complete':id===next?'Current objective':e(n.region)}</small></div></div>`;}).join('')}</div>`;
}

export function nearbyMarkup(state){
 const candidates=E.NODES.filter(n=>!n.roaming&&E.unlocked(state,n)&&((n.region==='The Salt Isles')===(state.world.y>29))).sort((a,b)=>distance(a)-distance(b)).slice(0,4);
 function distance(n){const p=E.PLACES[n.id];return Math.abs(p[0]-state.world.x)+Math.abs(p[1]-state.world.y);}
 return `<div class="nearby"><span class="eyebrow">NEARBY LANDMARKS</span><div class="actions">${candidates.map(n=>`<button class="route-button" data-node="${n.id}">${e(n.name)} <small>${state.cleared.includes(n.id)?'CLEARED':n.type.toUpperCase()}</small></button>`).join('')}</div></div>`;
}
