import type { ModalBounds } from './types';

export function calculateOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): number {
  const overlapX = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
  const overlapY = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
  return overlapX * overlapY;
}

export function calculateTotalOverlap(
  x: number,
  y: number,
  width: number,
  height: number,
  existingModals: ModalBounds[],
  gap: number
): number {
  const newModal = { x: x - gap, y: y - gap, width: width + gap * 2, height: height + gap * 2 };
  let totalOverlap = 0;
  for (const modal of existingModals) {
    totalOverlap += calculateOverlap(newModal, modal);
  }
  return totalOverlap;
}

export function calculateMinDistance(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): number {

  const leftGap = b.x - (a.x + a.width);
  const rightGap = a.x - (b.x + b.width);
  const topGap = b.y - (a.y + a.height);
  const bottomGap = a.y - (b.y + b.height);

  const horizontalGap = Math.max(leftGap, rightGap, 0);
  const verticalGap = Math.max(topGap, bottomGap, 0);

  if (horizontalGap === 0 && verticalGap === 0) {
    return 0;
  }

  return Math.sqrt(horizontalGap * horizontalGap + verticalGap * verticalGap);
}

export function getElementBounds(selectors: string[]): ModalBounds[] {
  if (typeof document === 'undefined') return [];

  const bounds: ModalBounds[] = [];
  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          bounds.push({
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
          });
        }
      }
    } catch {

    }
  }
  return bounds;
}
