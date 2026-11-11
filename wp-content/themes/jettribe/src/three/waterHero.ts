import {
  Scene,
  PerspectiveCamera,
  PlaneGeometry,
  ShaderMaterial,
  Mesh,
  Vector2,
  Color,
  Group,
  MeshStandardMaterial,
  BoxGeometry,
  AmbientLight,
  DirectionalLight,
} from 'three';
import type { SceneManager } from './SceneManager';
import type { QualityTier } from './tiers';

const waterVert = /* glsl */ `
uniform float uTime;
uniform float uTier;
varying vec2 vUv;
varying float vElevation;

void main() {
  vUv = uv;
  vec3 pos = position;
  float t = uTime;
  float e1 = sin(pos.x * 0.35 + t * 1.4) * 0.22;
  float e2 = sin(pos.y * 0.55 + t * 1.1) * 0.14;
  float e3 = sin((pos.x + pos.y) * 0.25 + t * 0.8) * 0.1;
  float elev = (e1 + e2 + e3) * (uTier > 1.5 ? 1.0 : 0.65);
  pos.z += elev;
  vElevation = elev;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const waterFrag = /* glsl */ `
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
uniform vec2 uPointer;
varying vec2 vUv;
varying float vElevation;

void main() {
  float fresnel = pow(1.0 - abs(vElevation * 2.5 + 0.35), 2.0);
  vec3 col = mix(uDeep, uShallow, fresnel + vUv.y * 0.25);
  float foam = smoothstep(0.18, 0.28, vElevation);
  col = mix(col, vec3(0.75, 0.95, 1.0), foam * 0.55);
  float caustic = sin((vUv.x + uTime * 0.08) * 40.0) * sin((vUv.y + uTime * 0.05) * 30.0);
  col += caustic * 0.03;
  float parallax = length(vUv - (uPointer * 0.08 + 0.5));
  col *= 1.0 - parallax * 0.15;
  gl_FragColor = vec4(col, 0.92);
}
`;

export function mountWaterHero(manager: SceneManager, root: HTMLElement, tier: QualityTier): () => void {
  const canvasSlot = root.querySelector<HTMLCanvasElement>('[data-jt-hero-canvas]');
  const poster = root.querySelector<HTMLElement>('[data-jt-hero-poster]');
  if (!canvasSlot || tier === 'off') return () => undefined;

  const scene = new Scene();
  const camera = new PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 3.2, 7.5);
  camera.lookAt(0, 0.4, 0);

  const segs = tier === 'high' ? 160 : tier === 'medium' ? 96 : 48;
  const geo = new PlaneGeometry(28, 18, segs, segs);
  geo.rotateX(-Math.PI / 2.35);

  const mat = new ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uTier: { value: tier === 'high' ? 2 : tier === 'medium' ? 1.5 : 1 },
      uDeep: { value: new Color('#04121d') },
      uShallow: { value: new Color('#00e5ff') },
      uPointer: { value: new Vector2(0, 0) },
    },
    vertexShader: waterVert,
    fragmentShader: waterFrag,
    transparent: true,
  });
  const water = new Mesh(geo, mat);
  water.position.y = -0.8;
  scene.add(water);

  const product = new Group();
  const body = new Mesh(
    new BoxGeometry(1.4, 0.35, 0.9),
    new MeshStandardMaterial({ color: new Color('#1a2430'), metalness: 0.35, roughness: 0.45 }),
  );
  const accent = new Mesh(
    new BoxGeometry(1.42, 0.08, 0.92),
    new MeshStandardMaterial({ color: new Color('#00e5ff'), metalness: 0.2, roughness: 0.3, emissive: new Color('#003844'), emissiveIntensity: 0.4 }),
  );
  accent.position.y = 0.18;
  product.add(body, accent);
  product.position.set(0, 1.1, 0);
  scene.add(product);

  scene.add(new AmbientLight(0x88aacc, 0.8));
  const sun = new DirectionalLight(0xffffff, 1.4);
  sun.position.set(4, 8, 2);
  scene.add(sun);

  const pointer = new Vector2(0, 0);
  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onPointer, { passive: true });

  let firstFrame = true;
  const handle = {
    scene,
    camera,
    element: root.querySelector('.jt-hero__stage') ?? root,
    update: (_dt: number, elapsed: number) => {
      mat.uniforms.uTime!.value = elapsed;
      mat.uniforms.uPointer!.value.lerp(pointer, 0.06);
      product.rotation.y = elapsed * 0.25;
      product.position.y = 1.1 + Math.sin(elapsed * 1.2) * 0.08;
      const scroll = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
      camera.position.z = 7.5 - scroll * 2.2;
      camera.position.y = 3.2 - scroll * 1.1;
      camera.lookAt(0, 0.4 + scroll * 0.4, 0);

      if (firstFrame) {
        firstFrame = false;
        canvasSlot.hidden = false;
        if (poster) poster.style.opacity = '0.35';
        manager.renderer.domElement.style.opacity = '1';
      }
    },
    dispose: () => {
      window.removeEventListener('pointermove', onPointer);
      geo.dispose();
      mat.dispose();
      body.geometry.dispose();
      (body.material as MeshStandardMaterial).dispose();
      accent.geometry.dispose();
      (accent.material as MeshStandardMaterial).dispose();
    },
  };

  manager.attach(handle);
  return () => manager.detach(handle.element);
}
