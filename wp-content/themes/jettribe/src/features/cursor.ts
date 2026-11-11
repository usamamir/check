import { prefersReducedMotion, isTouch } from '../motion/reduced';

export function initCursor(): void {
  if (prefersReducedMotion() || isTouch()) return;
  const cursor = document.querySelector<HTMLElement>('[data-jt-cursor]');
  if (!cursor) return;
  cursor.hidden = false;
  window.addEventListener(
    'pointermove',
    (e) => {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    },
    { passive: true },
  );
}
