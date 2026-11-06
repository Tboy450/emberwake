// Positions are packed in the camera's ground-plane projection, not a single row.
export const ARENA_ELEVATION=.32;
export const ARENA_HEIGHT=8.4;
export const ARENA_DISTANCE=28;
export const ARENA_TARGET_Y=.9;

// Pack in projected coordinates, then place on a perspective ground plane.
// Matching scale to camera depth prevents the far formation becoming miniature.
export function arenaPlacement(x,baseline,h){
 const s=Math.sin(ARENA_ELEVATION),c=Math.cos(ARENA_ELEVATION),d=ARENA_DISTANCE,b=baseline-ARENA_TARGET_Y*c;
 const z=(b*(d+ARENA_TARGET_Y*s)+d*ARENA_TARGET_Y*c)/(b*c-d*s);
 const depth=d+ARENA_TARGET_Y*s-z*c,ratio=depth/d;
 const scale=c*depth/(d*c+b*s+h*c*s);
 return {x:x*ratio,z,scale};
}
export function battleFormation(party,enemies){
 const slots=[];
 for(const [row,side] of [[party,-1],[enemies,1]]){
  row.forEach((actor,index)=>{
   const baseline=side<0?[-1.65,-1.1,-1.65][index]:row.length===1?1.5:[1.65,1.8,1.4][index];
   const projectedX=side<0?(row.length===1?-2.5:[-4,-.6,2.9][index]):row.length===1?1:[-3.3,0,3.5][index];
   const placement=arenaPlacement(projectedX,baseline,actor.h);
   slots.push({actor,...placement,baseline,projectedX,yaw:side<0?Math.PI/2:-Math.PI/2});
  });
 }
 return {slots,width:13.4};
}

// This is a real heading on the ground plane, including the target's depth.
export function targetYaw(from,to){return Math.atan2(to.x-from.x,to.z-from.z);}
export function attackTurn(start,end,k){
 const shortest=Math.atan2(Math.sin(end-start),Math.cos(end-start));
 return start+shortest*k+Math.sign(shortest||end||1)*Math.PI*2*k;
}
// Attack from the reserved slot: moving forward through the company caused overlap.
export function attackPosition(from){return {x:from.x,y:0,z:from.z,scale:from.scale??1};}
