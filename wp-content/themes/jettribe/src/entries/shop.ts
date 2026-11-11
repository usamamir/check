import { gsap } from '../motion';

const grid = document.querySelector('[data-jt-product-grid]');
if (grid && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  gsap.from(grid.children, {
    opacity: 0,
    y: 24,
    duration: 0.55,
    stagger: 0.06,
    ease: 'power3.out',
  });
}

const count = document.querySelector('[data-jt-result-count]');
if (count && grid) {
  count.textContent = `${grid.children.length} products`;
}
