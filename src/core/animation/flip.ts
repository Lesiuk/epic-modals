import type { Position } from '../types';
import { DURATIONS, TIMEOUT_SAFETY_MARGIN } from './timing';

export function flipAnimate(
  element: HTMLElement,
  oldPosition: Position,
  newPosition: Position,
  options?: {
    duration?: number;
    easing?: string;
    onComplete?: () => void;
  },
): () => void {
  const dx = oldPosition.x - newPosition.x;
  const dy = oldPosition.y - newPosition.y;

  if (dx === 0 && dy === 0) {
    options?.onComplete?.();
    return () => {};
  }

  const duration = options?.duration ?? DURATIONS.parentMove;
  const easing = options?.easing ?? 'ease-out';

  let cleaned = false;

  function handleComplete() {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(fallback);
    options?.onComplete?.();
  }

  element.style.left = `${newPosition.x}px`;
  element.style.top = `${newPosition.y}px`;

  const animation = element.animate(
    [
      { transform: `translate(${dx}px, ${dy}px)` },
      { transform: 'translate(0, 0)' },
    ],
    {
      duration,
      easing,
      fill: 'none',
    },
  );

  animation.onfinish = handleComplete;

  const fallback = setTimeout(handleComplete, duration + TIMEOUT_SAFETY_MARGIN);

  function cancel() {
    if (cleaned) return;
    cleaned = true;
    clearTimeout(fallback);
    animation.cancel();
  }

  return cancel;
}
