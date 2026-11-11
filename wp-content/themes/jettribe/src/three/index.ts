import { resolveTier } from './tiers';
import { SceneManager } from './SceneManager';
import { mountWaterHero } from './waterHero';

export async function bootThree(): Promise<void> {
  const tier = await resolveTier();
  if (tier === 'off') return;

  const manager = new SceneManager(tier);
  manager.renderer.domElement.style.opacity = '0';
  manager.renderer.domElement.style.transition = 'opacity 0.5s ease';

  const hero = document.querySelector<HTMLElement>('[data-jt-3d="water-line"]');
  if (hero) {
    mountWaterHero(manager, hero, tier);
  }

  // Local viewer canvas fade for PDP posters without GLB — keep poster as LCP.
  document.querySelectorAll<HTMLElement>('[data-jt-pdp-viewer]').forEach((viewer) => {
    const glb = viewer.dataset.glb;
    if (glb) {
      // GLB path reserved for model pipeline; poster remains until assets exist.
      viewer.querySelector<HTMLElement>('[data-jt-viewer-controls]')!.hidden = false;
    }
  });

  (window as unknown as { __jtSceneManager?: SceneManager }).__jtSceneManager = manager;
}

export { SceneManager, resolveTier };
