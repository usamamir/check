import { prefersReducedMotion, isTouch } from '../motion/reduced';

export function initCards(): void {
  if (prefersReducedMotion() || isTouch()) return;
  document.querySelectorAll<HTMLElement>('[data-jt-card]').forEach((card) => {
    const media = card.querySelector<HTMLElement>('.jt-card__media');
    if (!media) return;
    media.addEventListener('pointermove', (e) => {
      const rect = media.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      media.style.transform = `perspective(900px) rotateX(${(-py * 8).toFixed(2)}deg) rotateY(${(px * 10).toFixed(2)}deg)`;
    });
    media.addEventListener('pointerleave', () => {
      media.style.transform = '';
    });
  });
}
