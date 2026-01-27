import { FOCUSABLE_SELECTORS } from '../../core/utils/constants';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)).filter(
    (el) => el.offsetParent !== null || el.tagName === 'A'
  );
}

export function trapFocus(event: KeyboardEvent, container: HTMLElement) {
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

export function useFocusTrap() {
  return {
    trapFocus,
    focusFirstElement,
  };
}
