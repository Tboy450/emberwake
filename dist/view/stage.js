// One WebGL renderer shared by the overworld and battles, plus a small tween clock used by every animation.
import * as THREE from '../vendor/three/three.module.min.js';

export const ease = {
  linear: t => t,
  out: t => 1 - (1 - t) ** 3,
  in: t => t ** 3,
  inOut: t => (t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2),
  back: t => { const c = 1.70158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2; },
  pulse: t => Math.sin(t * Math.PI),
};
export const lerp = (a, b, t) => a + (b - a) * t;
export const REDUCED_MOTION = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch { return false; }
}

export class Stage {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({canvas, antialias: true, powerPreference: 'high-performance'});
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera = new THREE.PerspectiveCamera(36, 16 / 9, .1, 400);
    this.view = null;          // the active view: {scene, update(dt, t)}
    this.tweens = [];
    this.time = 0;
    this.timeScale = 1;
    this.shake = 0;
    this.last = 0;
    this.paused = false;
    this.resize();
    this.disposed = false;
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas.parentElement);
    const loop = now => {
      if(this.disposed)return;
      this.frameRequest = requestAnimationFrame(loop);
      const dt = Math.min(.05, (now - this.last) / 1000 || 0);
      this.last = now;
      if (!this.paused) this.frame(dt);
    };
    this.frameRequest = requestAnimationFrame(loop);
  }

  resize() {
    const own = this.canvas.getBoundingClientRect();
    const box = own.width&&own.height?own:this.canvas.parentElement.getBoundingClientRect();
    const w = Math.max(1, Math.round(box.width)), h = Math.max(1, Math.round(box.height));
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, w < 700 ? 1.5 : 2));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.width = w; this.height = h;
  }

  frame(dt) {
    const sdt = dt * this.timeScale;
    this.time += sdt;
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const w = this.tweens[i];
      w.t += (w.real ? dt : sdt) * 1000;
      const k = Math.min(1, w.t / w.ms);
      w.fn(w.ease(k), k);
      if (k >= 1) { this.tweens.splice(i, 1); w.res(); }
    }
    if (!this.view) return;
    this.view.update?.(sdt, this.time);
    const cam = this.camera, s = this.shake;
    let ox = 0, oy = 0;
    if (s > .001 && !REDUCED_MOTION) { ox = (Math.random() - .5) * s; oy = (Math.random() - .5) * s; cam.position.x += ox; cam.position.y += oy; }
    this.shake *= Math.exp(-dt * 9);
    this.renderer.render(this.view.scene, cam);
    if (ox || oy) { cam.position.x -= ox; cam.position.y -= oy; }
  }

  tween(ms, fn, easing = ease.out, real = false) {
    if(this.disposed)return Promise.resolve();
    if (ms <= 0) { fn(1, 1); return Promise.resolve(); }
    return new Promise(res => this.tweens.push({t: 0, ms, fn, ease: easing, res, real}));
  }
  wait(ms) { return this.tween(ms, () => {}, ease.linear); }
  clearTweens() { for (const w of this.tweens) w.res(); this.tweens = []; }

  dispose() {
    if(this.disposed)return;
    this.disposed=true;
    cancelAnimationFrame(this.frameRequest);
    this.observer.disconnect();
    this.clearTweens();
    this.view=null;
    this.renderer.dispose();
  }

  // Projects a world point to CSS pixels inside the stage.
  project(v) {
    const p = v.clone().project(this.camera);
    return {x: (p.x + 1) / 2 * this.width, y: (1 - p.y) / 2 * this.height, behind: p.z > 1};
  }
}
