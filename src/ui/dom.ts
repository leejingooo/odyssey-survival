type Props = Record<string, unknown>;

/** Tiny DOM builder — enough structure to keep the screens readable. */
export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props = {},
  children: (Node | string | null | undefined)[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (key === 'html') node.innerHTML = String(value);
    else if (key === 'style') Object.assign(node.style, value as object);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else node.setAttribute(key, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

export function clear(node: HTMLElement): void {
  while (node.firstChild) node.removeChild(node.firstChild);
}

/** Buttons get a press sound and a guard against double-fire on touch devices. */
export function button(
  label: string | Node,
  onClick: () => void,
  className = 'btn',
): HTMLButtonElement {
  const node = el('button', { class: className, type: 'button' });
  node.append(typeof label === 'string' ? document.createTextNode(label) : label);
  let busy = false;
  node.addEventListener('click', () => {
    if (busy) return;
    busy = true;
    setTimeout(() => (busy = false), 180);
    onClick();
  });
  return node;
}

export function showToast(root: HTMLElement, message: string, ms = 1800): void {
  const node = el('div', { class: 'toast', text: message });
  root.append(node);
  setTimeout(() => node.remove(), ms);
}
