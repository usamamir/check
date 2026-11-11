import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Clock,
  Color,
  SRGBColorSpace,
} from 'three';
import type { QualityTier } from './tiers';

export type SceneHandle = {
  scene: Scene;
  camera: PerspectiveCamera;
  element: HTMLElement;
  update?: (dt: number, elapsed: number) => void;
  dispose?: () => void;
};

export class SceneManager {
  readonly renderer: WebGLRenderer;
  readonly clock = new Clock();
  private views: SceneHandle[] = [];
  private raf = 0;
  private running = false;
  private tier: QualityTier = 'medium';
  private frameTimes: number[] = [];

  constructor(tier: QualityTier) {
    this.tier = tier;
    this.renderer = new WebGLRenderer({
      antialias: tier === 'high',
      alpha: true,
      powerPreference: tier === 'high' ? 'high-performance' : 'default',
    });
    this.renderer.setClearColor(new Color(0x000000), 0);
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.domElement.style.position = 'fixed';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.pointerEvents = 'none';
    this.renderer.domElement.style.zIndex = '1';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.renderer.domElement);

    const maxDpr = tier === 'high' ? 2 : 1.5;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr));
    this.onResize();
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else if (this.views.length) this.start();
    });
    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      this.stop();
      this.views.forEach((v) => v.dispose?.());
      this.views = [];
    });
  }

  setTier(tier: QualityTier): void {
    this.tier = tier;
  }

  getTier(): QualityTier {
    return this.tier;
  }

  attach(handle: SceneHandle): void {
    this.views.push(handle);
    this.start();
  }

  detach(element: HTMLElement): void {
    const idx = this.views.findIndex((v) => v.element === element);
    if (idx >= 0) {
      this.views[idx]?.dispose?.();
      this.views.splice(idx, 1);
    }
    if (!this.views.length) this.stop();
  }

  private onResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
  }

  private start(): void {
    if (this.running || this.tier === 'off') return;
    this.running = true;
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      const dt = this.clock.getDelta();
      const elapsed = this.clock.elapsedTime;
      const start = performance.now();
      this.renderViews(dt, elapsed);
      this.frameTimes.push(performance.now() - start);
      if (this.frameTimes.length > 60) {
        const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
        this.frameTimes = [];
        const fps = 1000 / Math.max(avg, 0.001);
        const floor = window.matchMedia('(max-width: 768px)').matches ? 30 : 45;
        if (fps < floor) this.stepDown();
      }
    };
    loop();
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private stepDown(): void {
    const order: QualityTier[] = ['high', 'medium', 'low', 'off'];
    const i = order.indexOf(this.tier);
    if (i >= 0 && i < order.length - 1) {
      this.tier = order[i + 1]!;
      if (this.tier === 'off') this.stop();
    }
  }

  private renderViews(dt: number, elapsed: number): void {
    const canvas = this.renderer.domElement;
    this.renderer.setScissorTest(true);
    this.renderer.clear();
    for (const view of this.views) {
      const rect = view.element.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.width === 0) continue;
      const left = rect.left;
      const bottom = canvas.clientHeight - rect.bottom;
      const width = rect.width;
      const height = rect.height;
      this.renderer.setViewport(left, bottom, width, height);
      this.renderer.setScissor(left, bottom, width, height);
      view.camera.aspect = width / Math.max(height, 1);
      view.camera.updateProjectionMatrix();
      view.update?.(dt, elapsed);
      this.renderer.render(view.scene, view.camera);
    }
    this.renderer.setScissorTest(false);
  }

  dispose(): void {
    this.stop();
    this.views.forEach((v) => v.dispose?.());
    this.views = [];
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
