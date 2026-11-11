import { gsap } from '../motion';

export function initHeader(): void {
  const header = document.querySelector<HTMLElement>('[data-jt-header]');
  if (!header) return;

  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 80);
    if (y > 120 && y > lastY) header.classList.add('is-hidden');
    else header.classList.remove('is-hidden');
    lastY = y;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const mega = document.querySelector<HTMLElement>('[data-jt-mega-panel]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-jt-mega-toggle]');
  const closeMega = () => {
    if (!mega || !toggle) return;
    mega.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };
  const openMega = () => {
    if (!mega || !toggle) return;
    mega.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    gsap.fromTo(mega, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' });
  };
  toggle?.addEventListener('click', () => {
    if (mega?.hidden) openMega();
    else closeMega();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMega();
  });

  const mobile = document.querySelector<HTMLElement>('[data-jt-mobile]');
  document.querySelector('[data-jt-menu-open]')?.addEventListener('click', () => {
    if (!mobile) return;
    mobile.hidden = false;
    gsap.fromTo(mobile, { opacity: 0 }, { opacity: 1, duration: 0.25 });
  });
  document.querySelectorAll('[data-jt-menu-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (mobile) mobile.hidden = true;
    });
  });
}
