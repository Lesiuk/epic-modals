export interface WhenDOMReadyOptions {

  timeout?: number;

  useObservers?: boolean;
}

export function whenDOMReady(
  element: () => HTMLElement | null,
  condition: (el: HTMLElement) => boolean,
  options: WhenDOMReadyOptions = {}
): Promise<HTMLElement> {
  const { timeout = 5000, useObservers = true } = options;

  return new Promise((resolve, reject) => {
    const startTime = performance.now();
    let mutationObserver: MutationObserver | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;
    let resolved = false;

    const cleanup = () => {
      resolved = true;
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
      if (timeoutId) clearTimeout(timeoutId);
      if (rafId) cancelAnimationFrame(rafId);
    };

    const checkCondition = () => {
      if (resolved) return;
      const el = element();
      if (el && condition(el)) {
        cleanup();
        resolve(el);
      }
    };

    timeoutId = setTimeout(() => {
      if (!resolved) {
        cleanup();
        reject(new Error(`DOM not ready after ${timeout}ms`));
      }
    }, timeout);

    const el = element();
    if (el && condition(el)) {
      cleanup();
      resolve(el);
      return;
    }

    if (useObservers && el) {

      mutationObserver = new MutationObserver(checkCondition);
      mutationObserver.observe(el, {
        attributes: true,
        attributeFilter: ['class', 'data-state', 'data-animation-phase', 'style'],
        childList: true,
        subtree: false,
      });

      resizeObserver = new ResizeObserver(checkCondition);
      resizeObserver.observe(el);

      const rafFallback = () => {
        if (resolved) return;
        checkCondition();

        if (!resolved) {
          rafId = requestAnimationFrame(() => {
            setTimeout(rafFallback, 100);
          });
        }
      };
      rafFallback();
    } else {

      const check = () => {
        if (resolved) return;
        const currentEl = element();
        const elapsed = performance.now() - startTime;

        if (currentEl && condition(currentEl)) {
          cleanup();
          resolve(currentEl);
          return;
        }

        if (elapsed >= timeout) {

          return;
        }

        rafId = requestAnimationFrame(check);
      };
      check();
    }
  });
}

export function whenHasDimensions(
  element: () => HTMLElement | null,
  options?: WhenDOMReadyOptions
): Promise<HTMLElement> {
  return whenDOMReady(
    element,
    (el) => el.offsetWidth > 0 && el.offsetHeight > 0,
    options
  );
}

export function whenExists(
  selector: string,
  options?: WhenDOMReadyOptions
): Promise<HTMLElement> {
  return whenDOMReady(
    () => document.querySelector(selector) as HTMLElement | null,
    () => true,
    options
  );
}

export function whenAnimationIdle(
  element: () => HTMLElement | null,
  options?: WhenDOMReadyOptions
): Promise<HTMLElement> {
  return whenDOMReady(
    element,
    (el) => {

      const state = el.getAttribute('data-state');
      if (state) {
        return state === 'open' || state === 'closed' || state === 'minimized';
      }

      return (
        !el.classList.contains('modal-opening') &&
        !el.classList.contains('modal-closing') &&
        !el.classList.contains('modal-minimizing') &&
        !el.classList.contains('modal-restoring')
      );
    },
    options
  );
}

export function onAnimationEnd(
  element: HTMLElement,
  animationName?: string,
  timeout = 2000
): Promise<AnimationEvent> {
  return new Promise((resolve, reject) => {
    let resolved = false;

    const handleAnimationEnd = (e: AnimationEvent) => {

      if (animationName && e.animationName !== animationName) {
        return;
      }

      if (resolved) return;
      resolved = true;

      element.removeEventListener('animationend', handleAnimationEnd);
      resolve(e);
    };

    element.addEventListener('animationend', handleAnimationEnd);

    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        element.removeEventListener('animationend', handleAnimationEnd);
        reject(new Error(`Animation '${animationName || 'any'}' did not complete within ${timeout}ms`));
      }
    }, timeout);
  });
}

export const ANIMATION_NAMES = {
  MINIMIZE: 'modal-genie-minimize',
  RESTORE: 'modal-genie-restore',
  OPEN: 'modal-genie-restore',
  CLOSE: 'modal-close',
  CLOSE_CENTERED: 'modal-close-centered',
  CHILD_APPEAR: 'modal-child-appear',
  CHILD_DISAPPEAR: 'modal-child-disappear',
} as const;

export type AnimationName = typeof ANIMATION_NAMES[keyof typeof ANIMATION_NAMES];

export function setupAnimationEndListener(
  element: HTMLElement,
  callback: (animationName: string) => void
): () => void {
  const handler = (e: AnimationEvent) => {

    if (e.target !== element) return;
    callback(e.animationName);
  };

  element.addEventListener('animationend', handler);
  return () => element.removeEventListener('animationend', handler);
}
