import { getGPUTier } from 'detect-gpu';
import { prefersReducedMotion } from '../motion/reduced';

export type QualityTier = 'high' | 'medium' | 'low' | 'off';

export async function resolveTier(): Promise<QualityTier> {
  if (prefersReducedMotion()) return 'off';
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) {
    return 'low';
  }

  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const cores = navigator.hardwareConcurrency ?? 4;

  try {
    const { tier } = await getGPUTier();
    if (tier >= 3 && memory >= 4 && cores >= 4) return 'high';
    if (tier >= 2) return 'medium';
    if (tier >= 1) return 'low';
    return 'off';
  } catch {
    if (memory <= 2 || cores <= 2) return 'low';
    return 'medium';
  }
}
