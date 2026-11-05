// Tiny menu illustrations are assets only; they do not define item or combat rules.
const ICONS={potion:'menu/draught.svg',tonic:'menu/tonic.svg',coin:'menu/crowns.svg',atk:'items/ember_blade.png',hp:'items/battle_plate.png',spd:'items/cartographer_compass.png',seal:'menu/seal.svg'};
export function menuIcon(kind){const file=ICONS[kind];return file?`<img class="menu-icon" src="${new URL('./assets/'+file,import.meta.url).href}" alt="" aria-hidden="true" width="40" height="40" loading="lazy">`:'';}
