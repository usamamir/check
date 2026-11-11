/** Lightweight SplitText alternative (Club plugin not available). */
export function splitLines(el: HTMLElement): HTMLElement[] {
  const text = el.textContent?.trim() ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const word = document.createElement('span');
  word.className = 'jt-split-line';
  word.style.display = 'block';
  word.style.overflow = 'hidden';
  const inner = document.createElement('span');
  inner.className = 'jt-split-line__inner';
  inner.style.display = 'block';
  inner.textContent = text;
  word.appendChild(inner);
  el.appendChild(word);
  return [inner];
}

export function splitChars(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? '';
  el.setAttribute('aria-label', text);
  el.textContent = '';
  const chars: HTMLElement[] = [];
  for (const ch of text) {
    const span = document.createElement('span');
    span.className = 'jt-split-char';
    span.style.display = 'inline-block';
    span.textContent = ch === ' ' ? '\u00a0' : ch;
    el.appendChild(span);
    chars.push(span);
  }
  return chars;
}
