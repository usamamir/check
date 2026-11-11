import '../styles/main.css';
import { initMotion, whenInteractive } from '../motion';
import { initHeader } from '../features/header';
import { initSearch } from '../features/search';
import { initCart } from '../features/cart';
import { initCursor } from '../features/cursor';
import { initCards } from '../features/cards';

function boot(): void {
  initMotion();
  initHeader();
  initSearch();
  initCart();
  initCursor();
  initCards();
}

if (document.prerendering) {
  document.addEventListener('prerenderingchange', () => boot(), { once: true });
} else {
  boot();
}

whenInteractive(async () => {
  if (!document.querySelector('[data-jt-3d], [data-jt-pdp-viewer]')) return;
  const { bootThree } = await import('../three');
  await bootThree();
});

window.addEventListener('pageshow', (e) => {
  if (e.persisted) {
    document.documentElement.classList.add('jt-restored');
  }
});
