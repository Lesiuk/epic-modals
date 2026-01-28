import { FOCUSABLE_SELECTORS } from '../utils/constants';

const focusableCache = new WeakMap<HTMLElement, {
  elements: HTMLElement[];
  observer: MutationObserver | null;
}>();

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const cached = focusableCache.get(container);
  if (cached) {
    return cached.elements;
  }

  const elements = computeFocusableElements(container);

  const observer = new MutationObserver(() => {
    invalidateFocusableCache(container);
  });

  observer.observe(container, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['disabled', 'tabindex', 'href', 'hidden'],
  });

  focusableCache.set(container, { elements, observer });
  return elements;
}

function computeFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => el.offsetParent !== null || el.tagName === 'A'
  );
}

export function invalidateFocusableCache(container: HTMLElement): void {
  const cached = focusableCache.get(container);
  if (cached) {

    cached.elements = computeFocusableElements(container);
  }
}

export function cleanupFocusableCache(container: HTMLElement): void {
  const cached = focusableCache.get(container);
  if (cached) {
    cached.observer?.disconnect();
    focusableCache.delete(container);
  }
}

export function trapFocus(event: KeyboardEvent, container: HTMLElement): void {
  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableElements(container);

  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement as HTMLElement;

  if (event.shiftKey) {
    if (activeElement === firstElement) {
      lastElement.focus();
      event.preventDefault();
    }
  }

  else {
    if (activeElement === lastElement) {
      firstElement.focus();
      event.preventDefault();
    }
  }
}

export function focusFirstElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length > 0) {
    focusableElements[0].focus();
    return true;
  }

  return false;
}

export function focusLastElement(container: HTMLElement): boolean {
  const focusableElements = getFocusableElements(container);

  if (focusableElements.length > 0) {
    focusableElements[focusableElements.length - 1].focus();
    return true;
  }

  return false;
}

export function containsFocus(container: HTMLElement): boolean {
  return container.contains(document.activeElement);
}

export function createFocusTrap(container: HTMLElement) {
  let previousActiveElement: HTMLElement | null = null;

  return {

    activate(): void {
      previousActiveElement = document.activeElement as HTMLElement;
      focusFirstElement(container);
    },

    deactivate(): void {
      if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
        previousActiveElement.focus();
      }
      previousActiveElement = null;
      cleanupFocusableCache(container);
    },

    handleKeyDown(event: KeyboardEvent): void {
      trapFocus(event, container);
    },

    containsFocus(): boolean {
      return containsFocus(container);
    },

    invalidateCache(): void {
      invalidateFocusableCache(container);
    },
  };
}
