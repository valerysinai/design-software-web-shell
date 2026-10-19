import '@testing-library/jest-dom/vitest';

/**
 * HU-SHELL-006: `RemoteUnavailable` y `LoadingRemote` del shell ahora son Web
 * Components del design-system. Su markup vive en un shadow DOM, y Testing
 * Library **no** atraviesa shadow roots: `getByRole('alert')` no encuentra nada
 * dentro de un `<sena-remote-unavailable>`.
 *
 * En vez de parchear Testing Library (fragil y dependiente de la version), los
 * tests del shell usan estos helpers, que consultan el shadow root con las APIs
 * nativas del DOM.
 *
 * Nota: las queries de Testing Library rechazan un `ShadowRoot` como
 * `container` (`checkContainerType` solo admite Element, Document o
 * DocumentFragment), asi que aqui no se usan.
 *
 * El markup interno ya lo prueban los 85 tests del design-system; aqui importa
 * que el shell monte el elemento correcto con los atributos correctos.
 */

/** Devuelve el shadow root de un custom element, o falla con un mensaje claro. */
export const shadowOf = (element: Element): ShadowRoot => {
  const root = element.shadowRoot;
  if (root === null) {
    throw new Error(
      `${element.tagName.toLowerCase()} no tiene shadow root. ` +
        "Si es un Web Component, verifica que se importo 'design-system/register'.",
    );
  }
  return root;
};

/**
 * Primer elemento con el atributo `role` dado dentro del shadow root.
 * Equivalente acotado a `getByRole`, que no ve shadow DOM.
 */
export const shadowByRole = (element: Element, role: string): HTMLElement => {
  const found = shadowOf(element).querySelector<HTMLElement>(`[role="${role}"]`);
  if (found === null) {
    throw new Error(`No se encontro role="${role}" dentro de <${element.tagName.toLowerCase()}>.`);
  }
  return found;
};

/**
 * Texto visible dentro del shadow root, ya normalizado: es lo que un lector de
 * pantalla leeria.
 */
export const shadowText = (element: Element): string =>
  (shadowOf(element).textContent ?? '').replace(/\s+/g, ' ').trim();

/** El texto visible del shadow contiene el fragmento dado. */
export const shadowHasText = (element: Element, text: string | RegExp): boolean => {
  const visible = shadowText(element);
  return typeof text === 'string' ? visible.includes(text) : text.test(visible);
};

/** Primer elemento del shadow que coincide con el selector. */
export const shadowBySelector = <T extends Element>(element: Element, selector: string): T => {
  const found = shadowOf(element).querySelector<T>(selector);
  if (found === null) {
    throw new Error(`No se encontro "${selector}" dentro de <${element.tagName.toLowerCase()}>.`);
  }
  return found;
};

/** Primer boton dentro del shadow root. */
export const shadowButton = (element: Element): HTMLButtonElement =>
  shadowBySelector<HTMLButtonElement>(element, 'button');

/** Custom element indicado, montado en el documento. */
export const findSenaElement = (tagName: string): HTMLElement | null =>
  document.querySelector<HTMLElement>(tagName);