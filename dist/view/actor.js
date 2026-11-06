// Turns a flat character painting into a lit 3D relief model with shader bones.
//  1. The art's alpha is measured to find how far each pixel sits from the silhouette edge.
//  2. That distance inflates a dense mesh: thick torsos bulge, thin staffs stay slim, like a clay figure.
//  3. Up to three soft "bones" (see RIGS) bend parts of the mesh in the vertex shader, so arms swing and heads turn.
import * as THREE from '../vendor/three/three.module.min.js';
import {lerp} from './stage.js';

// uv space: (0,0) bottom-left of the trimmed art. Each bone: c = centre of influence, r = radius, p = pivot.
export const RIGS = {
  mage: {h: 2.05, depth: .34, bones: [
    {name: 'staff', c: [.13, .55], r: [.2, .56], p: [.3, .6]},
    {name: 'hand', c: [.86, .56], r: [.24, .2], p: [.66, .62]},
    {name: 'head', c: [.5, .86], r: [.28, .2], p: [.5, .7]}], wave: .018, muzzle: [.88, .6], attack: 'cast'},
  warrior: {h: 2.05, depth: .36, bones: [
    {name: 'sword', c: [.11, .66], r: [.24, .46], p: [.3, .62]},
    {name: 'off', c: [.86, .46], r: [.2, .3], p: [.72, .66]},
    {name: 'head', c: [.5, .85], r: [.3, .2], p: [.5, .72]}], wave: .004, attack: 'slash'},
  rogue: {h: 1.98, depth: .32, bones: [
    {name: 'blade', c: [.12, .36], r: [.24, .36], p: [.3, .66]},
    {name: 'off', c: [.88, .36], r: [.24, .36], p: [.7, .66]},
    {name: 'head', c: [.5, .86], r: [.26, .18], p: [.5, .72]}], wave: .014, attack: 'dash'},
  town_guard: {h: 2.12, depth: .36, bones: [
    {name: 'sword', c: [.16, .34], r: [.26, .36], p: [.32, .68]},
    {name: 'shield', c: [.76, .46], r: [.3, .3], p: [.66, .68]},
    {name: 'head', c: [.5, .87], r: [.26, .16], p: [.5, .76]}], wave: .012, attack: 'slash'},
  plague_knight: {h: 2.1, depth: .34, bones: [
    {name: 'staff', c: [.16, .68], r: [.24, .44], p: [.32, .66]},
    {name: 'hand', c: [.82, .44], r: [.24, .26], p: [.68, .66]},
    {name: 'head', c: [.5, .84], r: [.24, .17], p: [.5, .72]}], wave: .02, muzzle: [.82, .46], attack: 'cast'},
  ghost_face: {h: 2.2, depth: .3, bones: [
    {name: 'knife', c: [.18, .2], r: [.3, .26], p: [.42, .46]},
    {name: 'cloak', c: [.74, .3], r: [.34, .4], p: [.62, .62]},
    {name: 'head', c: [.52, .8], r: [.36, .28], p: [.52, .56]}], wave: .05, hover: .05, attack: 'blink'},
  crystal_bat: {h: 1.5, depth: .22, bones: [
    {name: 'wingL', c: [.2, .64], r: [.36, .5], p: [.42, .56]},
    {name: 'wingR', c: [.82, .7], r: [.34, .5], p: [.56, .56]},
    {name: 'head', c: [.46, .42], r: [.16, .16], p: [.47, .5]}], wave: 0, hover: .16, flap: .3, fly: .45, attack: 'swoop'},
  drake_hatchling: {h: 1.9, depth: .36, bones: [
    {name: 'wingL', c: [.16, .66], r: [.26, .32], p: [.34, .6]},
    {name: 'wingR', c: [.84, .66], r: [.26, .32], p: [.66, .6]},
    {name: 'head', c: [.5, .76], r: [.24, .24], p: [.5, .56]}], wave: 0, flap: .1, muzzle: [.5, .72], attack: 'bite'},
  dragon: {h: 5.6, depth: .3, bones: [
    {name: 'wingL', c: [.17, .72], r: [.3, .46], p: [.34, .56]},
    {name: 'wingR', c: [.8, .76], r: [.3, .44], p: [.62, .6]},
    {name: 'head', c: [.72, .56], r: [.2, .22], p: [.56, .5]}], wave: .01, flap: .09, muzzle: [.8, .52], attack: 'breath'},
  lion_sage: {h: 2.15, depth: .32, bones: [], wave: .02},
};

const VERT_HEAD = `
uniform vec4 uBC[3];
uniform vec3 uBP[3];
uniform vec2 uSize;
uniform float uTime, uWave, uBreath, uLean, uThrust;
`;
const VERT_BODY = `
#include <begin_vertex>
float hv = uv.y;
float chest = smoothstep(.15, .55, hv) * (1. - smoothstep(.62, .95, hv));
transformed.x *= 1. + uBreath * chest;
transformed.z *= 1. + uBreath * chest * 1.6;
transformed.x += sin(uTime * 2.1 + hv * 7. + uv.x * 3.) * uWave * uSize.x * (1. - hv) * (1. - hv);
transformed.x += uLean * hv * hv * uSize.y;
for (int i = 0; i < 3; i++) {
  vec2 q = (uv - uBC[i].xy) / max(uBC[i].zw, vec2(.001));
  float w = 1. - smoothstep(.45, 1., length(q));
  float a = uBP[i].z * w;
  vec2 d = transformed.xy - uBP[i].xy;
  float ca = cos(a), sa = sin(a);
  transformed.xy = uBP[i].xy + vec2(d.x * ca - d.y * sa, d.x * sa + d.y * ca);
  transformed.z += abs(a) * w * uThrust;
}
`;
const FRAG_HEAD = `
uniform float uHue, uSat, uVal, uDissolve;
vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1. - ca);
}
`;
const FRAG_BODY = `
#include <map_fragment>
if (uHue != 0.) diffuseColor.rgb = hueShift(diffuseColor.rgb, uHue);
float lum = dot(diffuseColor.rgb, vec3(.299, .587, .114));
diffuseColor.rgb = mix(vec3(lum), diffuseColor.rgb, uSat) * uVal;
if (uDissolve > 0.) {
  float n = fract(sin(dot(floor(vMapUv * 70.), vec2(12.9898, 78.233))) * 43758.5453);
  if (n < uDissolve) discard;
}
`;

const reliefCache = new Map();
const loader = new THREE.TextureLoader();

function loadImage(url) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
}

// Height from silhouette distance (two-pass chamfer), rounded into a pillow, plus a little emboss from the painting.
function heightField(img, cols, rows, emboss) {
  const c = document.createElement('canvas');
  c.width = cols; c.height = rows;
  const g = c.getContext('2d', {willReadFrequently: true});
  g.drawImage(img, 0, 0, cols, rows);
  const px = g.getImageData(0, 0, cols, rows).data, n = cols * rows;
  const dist = new Float32Array(n), BIG = 1e6;
  for (let i = 0; i < n; i++) dist[i] = px[i * 4 + 3] > 90 ? BIG : 0;
  const at = (x, y) => (x < 0 || y < 0 || x >= cols || y >= rows ? 0 : dist[y * cols + x]);
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const i = y * cols + x; if (!dist[i]) continue;
    dist[i] = Math.min(dist[i], at(x - 1, y) + 1, at(x, y - 1) + 1, at(x - 1, y - 1) + 1.41, at(x + 1, y - 1) + 1.41);
  }
  for (let y = rows - 1; y >= 0; y--) for (let x = cols - 1; x >= 0; x--) {
    const i = y * cols + x; if (!dist[i]) continue;
    dist[i] = Math.min(dist[i], at(x + 1, y) + 1, at(x, y + 1) + 1, at(x + 1, y + 1) + 1.41, at(x - 1, y + 1) + 1.41);
  }
  let max = 1;
  for (let i = 0; i < n; i++) if (dist[i] > max) max = dist[i];
  let h = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    if (!dist[i]) continue;
    const k = Math.min(1, dist[i] / (max * .82));
    const lum = (px[i * 4] * .3 + px[i * 4 + 1] * .59 + px[i * 4 + 2] * .11) / 255;
    h[i] = Math.sqrt(1 - (1 - k) ** 2) + (lum - .4) * emboss;
  }
  for (let pass = 0; pass < 4; pass++) {
    const o = new Float32Array(n);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let s = 0, m = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const a = x + dx, b = y + dy;
        if (a >= 0 && b >= 0 && a < cols && b < rows) { s += h[b * cols + a]; m++; }
      }
      o[y * cols + x] = s / m;
    }
    h = o;
  }
  return h;
}

async function relief(art, height, depth) {
  const key = `${art}:${height}:${depth}`;
  if (reliefCache.has(key)) return reliefCache.get(key);
  const job = (async () => {
    const url = `assets/actors/${art}.webp`;
    const [img, map] = await Promise.all([loadImage(url), loader.loadAsync(url)]);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    const aspect = img.width / img.height, w = height * aspect;
    const rows = 104, cols = Math.max(24, Math.round(rows * aspect));
    const geo = new THREE.PlaneGeometry(w, height, cols - 1, rows - 1);
    geo.translate(0, height / 2, 0);
    const field = heightField(img, cols, rows, .04), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, field[i] * depth * Math.min(w, height));
    geo.computeVertexNormals();
    return {geo, map, w, h: height};
  })();
  reliefCache.set(key, job);
  return job;
}

export class Actor {
  static async create(art, opts = {}) {
    const rig = RIGS[art] || {h: 2, depth: .3, bones: []};
    const height = (opts.h || rig.h) * (opts.scale || 1);
    const profile = !['crystal_bat','dragon','drake_hatchling'].includes(art);
    const r = await relief(art, height, profile?rig.depth*1.08:rig.depth);
    return new Actor(art, rig, r, opts);
  }

  constructor(art, rig, r, opts) {
    this.art = art; this.rig = rig; this.w = r.w; this.h = r.h;
    this.group = new THREE.Group();
    this.body = new THREE.Group();
    this.group.add(this.body);
    const u = this.u = {
      uBC: {value: [0, 1, 2].map(i => { const b = rig.bones[i]; return b ? new THREE.Vector4(b.c[0], b.c[1], b.r[0], b.r[1]) : new THREE.Vector4(-9, -9, .001, .001); })},
      uBP: {value: [0, 1, 2].map(i => { const b = rig.bones[i]; return b ? new THREE.Vector3((b.p[0] - .5) * r.w, b.p[1] * r.h, 0) : new THREE.Vector3(); })},
      uSize: {value: new THREE.Vector2(r.w, r.h)},
      uTime: {value: Math.random() * 10}, uWave: {value: rig.wave || 0}, uBreath: {value: 0}, uLean: {value: 0}, uThrust: {value: .25},
      uHue: {value: opts.hue || 0}, uSat: {value: opts.sat ?? 1}, uVal: {value: opts.val ?? 1}, uDissolve: {value: 0},
    };
    const mat = this.material = new THREE.MeshStandardMaterial({map: r.map, alphaTest: .42, side: THREE.DoubleSide, roughness: .62, metalness: .08, emissive: 0xffffff, emissiveMap: r.map, emissiveIntensity: 0});
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = VERT_HEAD + sh.vertexShader.replace('#include <begin_vertex>', VERT_BODY);
      sh.fragmentShader = FRAG_HEAD + sh.fragmentShader.replace('#include <map_fragment>', FRAG_BODY);
    };
    mat.customProgramCacheKey = () => 'emberwake-actor';
    this.mesh = new THREE.Mesh(r.geo, mat);
    // A static depth material cannot follow shader bends; omit the false moving shadow.
    this.mesh.castShadow = false;
    this.mesh.customDepthMaterial = new THREE.MeshDepthMaterial({depthPacking: THREE.RGBADepthPacking, map: r.map, alphaTest: .42});
    this.body.add(this.mesh);
    this.base = {x: 0, y: 0, z: 0, yaw: 0};
    this.pose = {bones: [0, 0, 0], lean: 0, lift: 0, squash: 0};   // what animations write to
    this.flip = opts.flip ? -1 : 1;
    this.mesh.scale.x = this.flip;
    this.phase = Math.random() * 6.28;
    this.alive = true;
    this.status = null;
    this.profile = !['crystal_bat','dragon','drake_hatchling'].includes(art);
  }

  place(x, y, z, yaw = 0) {
    this.base = {x, y, z, yaw};
    this.group.position.set(x, y, z);
    this.group.rotation.y = yaw;
  }

  boneIndex(name) { return this.rig.bones.findIndex(b => b.name === name); }

  faceCamera(camera){
    this.group.rotation.y=Math.atan2(camera.position.x-this.group.position.x,camera.position.z-this.group.position.z);
    this.mesh.scale.x=this.flip;this.heading=this.group.rotation.y;
  }

  face(yaw){
    this.heading=yaw;
    // Humanoids point their depth volume at the target. Directional creature
    // paintings use their supplied left profile and mirror only when facing right.
    if(this.profile){
      // A supplied front painting has no back/profile frames. Keep its face
      // visible in a strong three-quarter view while its heading tracks the target.
      this.group.rotation.y=Math.sign(Math.sin(yaw))*1.08;this.mesh.scale.x=this.flip;
    }
    else{this.group.rotation.y=0;this.mesh.scale.x=Math.sin(yaw)>0?-1:1;}
  }

  update(dt, t) {
    const {u, rig, pose} = this;
    u.uTime.value = t + this.phase;
    const idle = this.alive ? 1 : 0, wob = t * 1.7 + this.phase;
    u.uBreath.value = (.016 + .012 * Math.sin(wob)) * idle;
    u.uLean.value = pose.lean + .006 * Math.sin(wob * .6) * idle;
    const flap = rig.flap ? Math.sin(t * (rig.fly ? 9 : 3) + this.phase) * rig.flap : 0;
    for (let i = 0; i < 3; i++) {
      const name = rig.bones[i]?.name || '';
      const auto = name === 'wingL' ? -flap : name === 'wingR' ? flap : name === 'head' ? .03 * Math.sin(wob * .8) : .025 * Math.sin(wob + i);
      u.uBP.value[i].z = (pose.bones[i] + auto * idle) * this.flip;
    }
    const sq = pose.squash;
    this.body.scale.set(1 + sq * .6, 1 - sq, 1 + sq * .6);
    const hover = rig.hover ? Math.sin(wob * 1.6) * rig.hover + (rig.fly || 0) : 0;
    this.body.position.y = pose.lift + hover * idle;
  }

  worldPoint(uvx = .5, uvy = .6) {
    const v = new THREE.Vector3((uvx - .5) * this.w * this.flip, uvy * this.h + this.body.position.y, this.w * .1);
    return this.group.localToWorld(v);
  }
  muzzle() { const m = this.rig.muzzle || [.5, .62]; return this.worldPoint(m[0], m[1]); }
  chest() { return this.worldPoint(.5, .55); }

  flash(stage, color = 0xffffff, ms = 180, power = 1.4) {
    this.material.emissive.set(color);
    return stage.tween(ms, k => { this.material.emissiveIntensity = lerp(power, 0, k); });
  }

  dispose() { this.material.dispose(); this.mesh.customDepthMaterial?.dispose(); }
}
