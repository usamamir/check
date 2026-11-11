import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { prefersReducedMotion, isTouch } from './reduced';
import { splitLines } from './split';

gsap.registerPlugin(ScrollTrigger);

export type MotionContext = {
  reduced: boolean;
  lenis: Lenis | null;
};

let ctx: MotionContext | null = null;

export function initMotion(): MotionContext {
  if (ctx) return ctx;
  const reduced = prefersReducedMotion();
  let lenis: Lenis | null = null;

  if (!reduced && !isTouch()) {
    lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis?.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  document.querySelectorAll<HTMLElement>('[data-jt-split]').forEach((el) => {
    const lines = splitLines(el);
    if (reduced) {
      gsap.set(lines, { opacity: 1, y: 0 });
      return;
    }
    gsap.fromTo(
      lines,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
      },
    );
  });

  document.querySelectorAll<HTMLElement>('[data-jt-reveal]').forEach((el) => {
    if (reduced) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%' },
      },
    );
  });

  document.querySelectorAll<HTMLElement>('[data-jt-count]').forEach((el) => {
    const end = Number(el.textContent || '0');
    if (reduced || Number.isNaN(end)) return;
    const obj = { val: 0 };
    gsap.to(obj, {
      val: end,
      duration: 1.2,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
      onUpdate: () => {
        el.textContent = String(Math.round(obj.val));
      },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-jt-magnetic]').forEach((btn) => {
    if (reduced || isTouch()) return;
    const strength = 18;
    btn.addEventListener('pointermove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      gsap.to(btn, { x: x / strength, y: y / strength, duration: 0.3, ease: 'power3.out' });
    });
    btn.addEventListener('pointerleave', () => {
      gsap.to(btn, { x: 0, y: 0, duration: 0.45, ease: 'expo.out' });
    });
  });

  ctx = { reduced, lenis };
  return ctx;
}

export function whenInteractive(cb: () => void): void {
  const run = () => {
    if (document.prerendering) {
      document.addEventListener('prerenderingchange', () => cb(), { once: true });
      return;
    }
    cb();
  };
  if (document.readyState === 'complete') {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => run(), { timeout: 1800 });
    } else {
      setTimeout(run, 200);
    }
  } else {
    window.addEventListener('load', () => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => run(), { timeout: 1800 });
      } else {
        setTimeout(run, 200);
      }
    });
  }
}

export { gsap, ScrollTrigger };
