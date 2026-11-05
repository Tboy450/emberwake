// Battle effects: the RPG's hand-painted fire animations as additive billboards, plus a pooled particle system.
import * as THREE from '../vendor/three/three.module.min.js';
import {ease} from './stage.js';
import {emissionCount} from './emission.js';

const SHEETS = {
  fireball: {cols: 4, rows: 3, frames: 12},
  tornado: {cols: 6, rows: 3, frames: 18},
  blast: {cols: 4, rows: 4, frames: 16},
};
const loader = new THREE.TextureLoader();
const textures = new Map();
let battleEffects;
export function loadBattleEffects(){
 if(!battleEffects)battleEffects=loader.loadAsync('assets/fx/fireball.webp').then(t=>{t.colorSpace=THREE.SRGBColorSpace;textures.set('fireball',t);}).catch(error=>{battleEffects=null;throw error;});
 return battleEffects;
}
function sheetTexture(name) {
  if (!textures.has(name)) {
    const t = loader.load(`assets/fx/${name}.webp`);
    t.colorSpace = THREE.SRGBColorSpace;
    textures.set(name, t);
  }
  return textures.get(name);
}
export function iconTexture(file) {
  const key = 'icon:' + file;
  if (!textures.has(key)) {
    const t = loader.load(`assets/items/${file}.png`);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.NearestFilter;
    textures.set(key, t);
  }
  return textures.get(key);
}

function softDot() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, '#fff'); r.addColorStop(.35, 'rgba(255,255,255,.55)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export class Fx {
  constructor(stage, scene) {
    this.stage = stage;
    this.scene = scene;
    this.live = new Set();
    this.dot = softDot();
    // Particle pool.
    const N = this.N = 700;
    this.p = Array.from({length: N}, () => ({life: 0}));
    this.pos = new Float32Array(N * 3);
    this.col = new Float32Array(N * 3);
    this.size = new Float32Array(N);
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    const m = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: {map: {value: this.dot}, scale: {value: 620}},
      vertexShader: 'attribute float psize; varying vec3 vC; uniform float scale; void main(){ vC = color; vec4 mv = modelViewMatrix * vec4(position, 1.); gl_PointSize = psize * scale / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; varying vec3 vC; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vC * t.rgb, t.a); }',
      vertexColors: true,
    });
    this.points = new THREE.Points(g, m);
    this.points.frustumCulled = false;
    scene.add(this.points);
    this.next = 0;
    this.ambient = null;
    this.emissionRemainder = 0;
    this.light = new THREE.PointLight(0xff9040, 0, 26, 1.6);
    scene.add(this.light);
  }

  spawn(o) {
    const i = this.next = (this.next + 1) % this.N, p = this.p[i];
    Object.assign(p, {x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, g: 0, drag: 0, life: 1, max: 1, r: 1, gc: .6, b: .3, s: .2}, o);
    p.max = p.life;
  }

  burst(at, n, o = {}) {
    const col = new THREE.Color(o.color ?? 0xffa040);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, e = (Math.random() - .3) * 2, sp = (o.speed ?? 3) * (.3 + Math.random());
      this.spawn({x: at.x, y: at.y, z: at.z, vx: Math.cos(a) * sp, vy: e * sp * .7 + (o.up ?? 0), vz: Math.sin(a) * sp, g: o.g ?? -4, drag: 2, life: (o.life ?? .7) * (.5 + Math.random()), r: col.r, gc: col.g, b: col.b, s: (o.size ?? .18) * (.6 + Math.random())});
    }
  }

  // Region weather: embers, snow, fireflies, ash.
  setAmbient(kind) { this.ambient = kind; this.emissionRemainder = 0; }

  update(dt) {
    if (this.ambient) {
      const a = this.ambient, emission = emissionCount(this.emissionRemainder,a.rate,dt);
      this.emissionRemainder = emission.remainder;
      for (let i = 0; i < emission.count; i++) {
        const c = new THREE.Color(a.color);
        this.spawn({x: (Math.random() - .5) * 30, y: a.fall ? 9 + Math.random() * 3 : Math.random() * 2, z: (Math.random() - .5) * 18 - 2, vx: (Math.random() - .5) * a.drift, vy: a.fall ? -a.speed : a.speed * (.5 + Math.random()), vz: (Math.random() - .5) * a.drift, life: a.life, r: c.r, gc: c.g, b: c.b, s: a.size * (.6 + Math.random())});
      }
    }
    for (let i = 0; i < this.N; i++) {
      const p = this.p[i], j = i * 3;
      if (p.life <= 0) { this.size[i] = 0; continue; }
      p.life -= dt;
      p.vy += p.g * dt;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d; p.vy *= d; p.vz *= d;
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      const k = Math.max(0, p.life / p.max), fade = Math.min(1, k * 2.2);
      this.pos[j] = p.x; this.pos[j + 1] = p.y; this.pos[j + 2] = p.z;
      this.col[j] = p.r * fade; this.col[j + 1] = p.gc * fade; this.col[j + 2] = p.b * fade;
      this.size[i] = p.s;
    }
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
    this.geo.attributes.psize.needsUpdate = true;
    for (const s of this.live) s.tick(dt);
  }

  // Plays a painted sprite sheet as a camera-facing additive billboard.
  sheet(name, at, size, ms, o = {}) {
    const info = SHEETS[name], tex = sheetTexture(name).clone();
    tex.needsUpdate = true;
    tex.repeat.set(1 / info.cols, 1 / info.rows);
    const m = new THREE.SpriteMaterial({map: tex, transparent: true, blending: o.blend ?? THREE.AdditiveBlending, depthWrite: false, depthTest: o.depthTest ?? true, opacity: o.opacity ?? 1, rotation: o.rotation ?? 0, color: o.color ?? 0xffffff});
    const s = new THREE.Sprite(m);
    s.scale.set(size * (o.aspect ?? 1), size, 1);
    s.position.copy(at);
    if (o.center) s.center.set(...o.center);
    this.scene.add(s);
    const frames = o.frames ?? [0, info.frames - 1];
    const set = f => { const i = Math.floor(f); tex.offset.set((i % info.cols) / info.cols, 1 - (Math.floor(i / info.cols) + 1) / info.rows); };
    set(frames[0]);
    return {sprite: s, done: this.stage.tween(ms, (_, k) => { set(frames[0] + (frames[1] - frames[0]) * k); if (o.onFrame) o.onFrame(k, s); }, ease.linear).then(() => { this.scene.remove(s); m.dispose(); tex.dispose(); })};
  }

  // An item-art effect (slash, sigil, guard) that scales up and fades.
  decal(file, at, size, ms, o = {}) {
    const m = new THREE.SpriteMaterial({map: iconTexture(file), transparent: true, blending: o.blend ?? THREE.AdditiveBlending, depthWrite: false, rotation: o.rotation ?? 0, color: o.color ?? 0xffffff});
    const s = new THREE.Sprite(m);
    s.position.copy(at);
    this.scene.add(s);
    return this.stage.tween(ms, (e, k) => {
      const q = size * ((o.from ?? .5) + (1 - (o.from ?? .5)) * e);
      s.scale.set(q, q, 1);
      m.opacity = k < .6 ? 1 : 1 - (k - .6) / .4;
      if (o.spin) m.rotation = (o.rotation ?? 0) + o.spin * k;
    }).then(() => { this.scene.remove(s); m.dispose(); });
  }

  // Ground ring of light, used for heals, sleep and guard.
  ring(at, color, size, ms) {
    const m = new THREE.MeshBasicMaterial({map: this.dot, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false});
    const r = new THREE.Mesh(new THREE.CircleGeometry(.5, 40), m);
    r.rotation.x = -Math.PI / 2;
    r.position.set(at.x, .04, at.z);
    this.scene.add(r);
    return this.stage.tween(ms, (e, k) => { r.scale.setScalar(size * e); m.opacity = 1 - k; }).then(() => { this.scene.remove(r); r.geometry.dispose(); m.dispose(); });
  }

  glow(at, color, power, ms) {
    this.light.position.copy(at);
    this.light.color.set(color);
    return this.stage.tween(ms, (_, k) => { this.light.intensity = power * (1 - k) ** 1.5; }, ease.linear);
  }
  hold(at, color, power) { this.light.position.copy(at); this.light.color.set(color); this.light.intensity = power; }

  dispose() {
    this.scene.remove(this.points,this.light);
    this.geo.dispose();this.points.material.dispose();this.dot.dispose();
    this.live.clear();this.ambient=null;
  }
}
