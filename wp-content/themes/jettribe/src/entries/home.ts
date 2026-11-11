import { gsap, ScrollTrigger } from '../motion';

const pin = document.querySelector('[data-jt-pin-story]');
if (pin && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const swatches = pin.querySelectorAll('.jt-featured__swatch');
  gsap
    .timeline({
      scrollTrigger: {
        trigger: pin,
        start: 'top top',
        end: '+=120%',
        scrub: true,
        pin: true,
      },
    })
    .fromTo(swatches, { xPercent: 8, opacity: 0.4 }, { xPercent: 0, opacity: 1, stagger: 0.15, ease: 'none' });
}

ScrollTrigger.refresh();
