import { gsap } from '../motion';

type CartItem = {
  key: string;
  id: number;
  name: string;
  quantity: number;
  images?: { src: string }[];
  prices?: { line_subtotal: string; currency_symbol?: string };
};

type Cart = {
  items: CartItem[];
  totals?: { total_items: string; currency_symbol?: string };
  items_count?: number;
};

declare global {
  interface Window {
    JT?: {
      restUrl?: string;
      nonce?: string;
      cartNonce?: string;
      i18n?: Record<string, string>;
    };
  }
}

function storeBase(): string {
  return (window.JT?.restUrl ?? '/wp-json/').replace(/\/?$/, '/');
}

async function fetchCart(): Promise<Cart | null> {
  try {
    const res = await fetch(`${storeBase()}wc/store/v1/cart`, {
      headers: {
        Nonce: window.JT?.nonce ?? '',
      },
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    return (await res.json()) as Cart;
  } catch {
    return null;
  }
}

function renderCart(cart: Cart | null): void {
  const itemsEl = document.querySelector('[data-jt-cart-items]');
  const countEl = document.querySelector('[data-jt-cart-count]');
  const subtotalEl = document.querySelector('[data-jt-cart-subtotal]');
  if (!itemsEl || !countEl || !subtotalEl) return;

  if (!cart) {
    countEl.textContent = '0';
    itemsEl.innerHTML = '<p>Cart unavailable in preview. Connect WooCommerce Store API on WordPress.</p>';
    subtotalEl.textContent = '—';
    return;
  }

  countEl.textContent = String(cart.items_count ?? cart.items.length);
  subtotalEl.textContent = cart.totals
    ? `${cart.totals.currency_symbol ?? '$'}${(Number(cart.totals.total_items) / 100).toFixed(2)}`
    : '—';
  itemsEl.innerHTML = cart.items
    .map(
      (item) => `
      <article class="jt-cart-item" data-key="${item.key}">
        <strong>${item.name}</strong>
        <div>Qty ${item.quantity}</div>
      </article>`,
    )
    .join('');
}

export function initCart(): void {
  const drawer = document.querySelector<HTMLElement>('[data-jt-cart]');
  if (!drawer) return;

  const open = async () => {
    drawer.hidden = false;
    gsap.fromTo(drawer.querySelector('.jt-cart__panel'), { xPercent: 100 }, { xPercent: 0, duration: 0.4, ease: 'power3.out' });
    renderCart(await fetchCart());
  };
  const close = () => {
    drawer.hidden = true;
  };

  document.querySelector('[data-jt-cart-open]')?.addEventListener('click', () => void open());
  document.querySelectorAll('[data-jt-cart-close]').forEach((el) => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });

  void fetchCart().then(renderCart);

  document.querySelectorAll<HTMLElement>('[data-jt-quick-add]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.productId;
      if (!id) return;
      try {
        await fetch(`${storeBase()}wc/store/v1/cart/add-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Nonce: window.JT?.nonce ?? '',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ id: Number(id), quantity: 1 }),
        });
        toast(window.JT?.i18n?.added ?? 'Added to cart');
        await open();
      } catch {
        toast('Preview mode — enable WooCommerce to add items');
      }
    });
  });
}

export function toast(message: string): void {
  const region = document.querySelector('[data-jt-toasts]');
  if (!region) return;
  const el = document.createElement('div');
  el.className = 'jt-toast';
  el.textContent = message;
  region.appendChild(el);
  gsap.fromTo(el, { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3 });
  window.setTimeout(() => {
    gsap.to(el, {
      opacity: 0,
      y: 8,
      duration: 0.25,
      onComplete: () => el.remove(),
    });
  }, 2400);
}
