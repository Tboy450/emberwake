// Keep the same emission rate at 30, 60 and 120 Hz without random loop bounds.
export function emissionCount(carry,rate,dt){
 const total=Math.max(0,Number.isFinite(carry)?carry:0)+Math.max(0,Number.isFinite(rate)?rate:0)*Math.max(0,Number.isFinite(dt)?dt:0);
 const count=Math.floor(total+1e-10);
 return {count,remainder:Math.max(0,total-count)};
}
