const KEY='emberwake-audio-v1';
const DEFAULTS={enabled:false,music:.22,effects:.5};
const TRACKS={town:'old_tower_inn.wav',travel:'meadow_thoughts.ogg',battle:'dark_forest.mp3'};
const EFFECTS={click:'click_001',hit:'impactPunch_medium_000',spell:'impactGlass_heavy_000',guard:'impactMetal_light_000',heal:'glass_001',win:'confirmation_002',step:'footstep_grass_000'};
function mediaElement(src){const audio=document.createElement('audio');audio.preload='none';audio.src=src;audio.hidden=true;audio.dataset.emberwakeAudio='';document.body.append(audio);return audio;}
export function audioSettings(value={}){
 const volume=(v,fallback)=>typeof v==='number'&&Number.isFinite(v)?Math.min(1,Math.max(0,v)):fallback;
 return {enabled:value?.enabled===true,music:volume(value?.music,DEFAULTS.music),effects:volume(value?.effects,DEFAULTS.effects)};
}

export class Soundscape{
 constructor({getStorage=()=>localStorage,makeAudio=mediaElement,requestFrame=fn=>requestAnimationFrame(fn),cancelFrame=id=>cancelAnimationFrame(id),now=()=>performance.now(),onProblem=()=>{}}={}){
  Object.assign(this,{getStorage,makeAudio,requestFrame,cancelFrame,now,onProblem});
  let saved;try{saved=JSON.parse(getStorage().getItem(KEY));}catch{}
  this.settings=audioSettings(saved);this.unlocked=false;this.hidden=false;this.scene='travel';this.tracks=new Map();this.effects=new Set();this.frame=null;this.lastStep=-Infinity;
 }
 setPreferences(patch){this.settings=audioSettings({...this.settings,...patch});try{this.getStorage().setItem(KEY,JSON.stringify(this.settings));}catch{}this.sync();for(const effect of this.effects)effect.volume=this.settings.effects;if(!this.settings.enabled||!this.settings.effects)this.stopEffects();}
 unlock(){this.unlocked=true;this.sync();}
 setScene(scene){if(!TRACKS[scene]||scene===this.scene)return;this.scene=scene;this.sync();}
 setHidden(hidden){this.hidden=hidden;this.sync();if(hidden)this.stopEffects();}
 sync(){
  if(this.frame!==null){this.cancelFrame(this.frame);this.frame=null;}
  if(!this.unlocked||!this.settings.enabled||this.hidden||!this.settings.music){for(const track of this.tracks.values()){track.audio.pause();track.audio.volume=0;}return;}
  let current=this.tracks.get(this.scene);
  if(!current){const audio=this.makeAudio(new URL('./assets/music/'+TRACKS[this.scene],import.meta.url).href);audio.preload='none';audio.loop=true;audio.volume=0;current={audio,pending:false};this.tracks.set(this.scene,current);audio.addEventListener('error',()=>this.onProblem('Music could not load. Toggle sound to retry.'));}
  if(current.audio.paused&&!current.pending){current.pending=true;Promise.resolve(current.audio.play()).catch(()=>this.onProblem('Music is paused. Use Sound on to retry.')).finally(()=>{current.pending=false;if(!this.settings.enabled||this.hidden||this.tracks.get(this.scene)!==current)current.audio.pause();});}
  const desired=this.scene,starts=new Map([...this.tracks].map(([name,track])=>[name,track.audio.volume])),started=this.now();
  const fade=()=>{const k=Math.min(1,(this.now()-started)/650);for(const [name,track] of this.tracks){const end=name===desired?this.settings.music:0;track.audio.volume=starts.get(name)+(end-starts.get(name))*k;if(k===1&&name!==desired)track.audio.pause();}this.frame=k<1?this.requestFrame(fade):null;};
  this.frame=this.requestFrame(fade);
 }
 effect(kind='click'){
  if(!this.unlocked||!this.settings.enabled||!this.settings.effects||this.hidden||!EFFECTS[kind])return;
  if(kind==='step'){if(this.now()-this.lastStep<170)return;this.lastStep=this.now();}
  if(this.effects.size>=6){const old=this.effects.values().next().value;old.pause();old.remove?.();this.effects.delete(old);}
  const audio=this.makeAudio(new URL('./assets/sfx/'+EFFECTS[kind]+'.ogg',import.meta.url).href);audio.preload='none';audio.volume=this.settings.effects;this.effects.add(audio);
  const done=()=>{this.effects.delete(audio);audio.remove?.();};audio.addEventListener('ended',done,{once:true});audio.addEventListener('error',done,{once:true});Promise.resolve(audio.play()).catch(done);
 }
 stopEffects(){for(const audio of this.effects){audio.pause();audio.remove?.();}this.effects.clear();}
 dispose(){if(this.frame!==null)this.cancelFrame(this.frame);for(const track of this.tracks.values()){track.audio.pause();track.audio.remove?.();}this.stopEffects();this.tracks.clear();}
}
