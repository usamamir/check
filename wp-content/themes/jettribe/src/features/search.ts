import { gsap } from '../motion';

type SearchHit = { id: number; name: string; permalink: string; price_html?: string };

export function initSearch(): void {
  const root = document.querySelector<HTMLElement>('[data-jt-search]');
  const input = document.querySelector<HTMLInputElement>('[data-jt-search-input]');
  const results = document.querySelector<HTMLElement>('[data-jt-search-results]');
  if (!root || !input || !results) return;

  const open = () => {
    root.hidden = false;
    input.focus();
    gsap.fromTo(root, { opacity: 0 }, { opacity: 1, duration: 0.25 });
  };
  const close = () => {
    root.hidden = true;
    results.innerHTML = '';
  };

  document.querySelector('[data-jt-search-open]')?.addEventListener('click', open);
  document.querySelector('[data-jt-search-close]')?.addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  let timer = 0;
  input.addEventListener('input', () => {
    window.clearTimeout(timer);
    const q = input.value.trim();
    if (q.length < 2) {
      results.innerHTML = '';
      return;
    }
    timer = window.setTimeout(async () => {
      results.textContent = (window as unknown as { JT?: { i18n?: { loading?: string } } }).JT?.i18n?.loading ?? 'Loading…';
      try {
        const base = (window as unknown as { JT?: { restUrl?: string } }).JT?.restUrl ?? '/wp-json/';
        const url = new URL('wc/store/v1/products', base);
        url.searchParams.set('search', q);
        url.searchParams.set('per_page', '8');
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('search failed');
        const data = (await res.json()) as SearchHit[];
        results.innerHTML = data
          .map(
            (item) =>
              `<a class="jt-search__hit" href="${item.permalink}"><strong>${item.name}</strong></a>`,
          )
          .join('');
        if (!data.length) results.textContent = 'No matches';
      } catch {
        // Preview / offline fallback
        const demo = [
          'Circuit 2-Piece Wetsuit Set',
          'Hyper Tour Coat',
          'GRB Race Boot',
          'Classic Floating Goggles',
        ].filter((n) => n.toLowerCase().includes(q.toLowerCase()));
        results.innerHTML = demo.map((n) => `<a class="jt-search__hit" href="./shop.html"><strong>${n}</strong></a>`).join('') || 'No matches';
      }
    }, 180);
  });
}
