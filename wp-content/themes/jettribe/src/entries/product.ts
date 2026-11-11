import { gsap } from '../motion';

const buybar = document.querySelector<HTMLElement>('[data-jt-buybar]');
const buy = document.querySelector('.jt-pdp__buy .single_add_to_cart_button, .jt-pdp__buy form');
if (buybar) {
  const io = new IntersectionObserver(
    ([entry]) => {
      if (!entry) return;
      buybar.hidden = entry.isIntersecting;
      if (!entry.isIntersecting) {
        gsap.fromTo(buybar, { yPercent: 100 }, { yPercent: 0, duration: 0.35, ease: 'power3.out' });
      }
    },
    { threshold: 0 },
  );
  if (buy) io.observe(buy);
}

document.querySelector('[data-jt-buybar-add]')?.addEventListener('click', () => {
  const btn = document.querySelector<HTMLButtonElement>('.single_add_to_cart_button');
  btn?.click();
});
