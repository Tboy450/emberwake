// A failed recovery copy must never cause the only unreadable save to be overwritten.
export function createSaveManager({getStorage,migrate,fresh,key='emberwake-save-v1'}){
 const recoveryKey=key+'-unreadable';
 let problem=null,unreadable=null,recoveryDurable=false;
 function load(){
  try{const raw=getStorage().getItem(key);if(raw){let data=null;try{data=migrate(JSON.parse(raw));}catch{}if(data)return data;unreadable=raw;problem='invalid';preserve();}}
  catch{problem='storage';}
  return fresh();
 }
 function preserve(){if(!unreadable||recoveryDurable)return;try{const storage=getStorage();storage.setItem(recoveryKey,unreadable);recoveryDurable=storage.getItem(recoveryKey)===unreadable;}catch{}}
 function write(state){
  preserve();
  if(unreadable&&!recoveryDurable)return 'recovery';
  try{getStorage().setItem(key,JSON.stringify(state));return 'saved';}catch{return 'storage';}
 }
 function recovery(){if(unreadable)return unreadable;try{return getStorage().getItem(recoveryKey);}catch{return null;}}
 return {load,write,recovery,get problem(){return problem;},get recoveryDurable(){return recoveryDurable;}};
}
