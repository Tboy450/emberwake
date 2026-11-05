// Use the artwork's real width, including wings and weapons, when making room.
export function battleFormation(party, enemies) {
 const gap=.5, aisle=2.1;
 const span=row=>row.reduce((sum,a)=>sum+a.w,0)+Math.max(0,row.length-1)*gap;
 const left=span(party),right=span(enemies),width=left+aisle+right;
 const slots=[];
 let edge=-width/2;
 for(const [row,hero] of [[party,true],[enemies,false]]){
  row.forEach((actor,index)=>{
   slots.push({actor,x:edge+actor.w/2,z:index%2?-.7:0,yaw:hero?.52:-.52});
   edge+=actor.w+gap;
  });
  if(hero)edge+=aisle-gap;
 }
 return {slots,width};
}

// Still-image reliefs remain readable at three-quarter angles.
export function targetYaw(from,to){return (to.x>=from.x?1:-1)*.68;}
export function attackTurn(start,end,k){return start+(end-start)*k+Math.sign(end||1)*Math.PI*2*k;}
