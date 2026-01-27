import type { Position, Bounds } from '../../types';
import type { ViewportConstraintOptions } from './types';

const DEFAULT_MARGIN = 8;
const MIN_VISIBLE = 40;

export function constrainToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  options: ViewportConstraintOptions = {}
): Position {
  const { margin = DEFAULT_MARGIN, allowPartialVisibility = false } = options;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;

  let minX: number, maxX: number, minY: number, maxY: number;

  if (allowPartialVisibility && width > vw - margin * 2) {
    minX = MIN_VISIBLE - width;
    maxX = vw - MIN_VISIBLE;
  } else {
    minX = margin;
    maxX = Math.max(margin, vw - width - margin);
  }

  if (allowPartialVisibility && height > vh - margin * 2) {
    minY = MIN_VISIBLE - height;
    maxY = vh - MIN_VISIBLE;
  } else {
    minY = margin;
    maxY = Math.max(margin, vh - height - margin);
  }

  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}

export function constrainSizeToViewport(
  x: number,
  y: number,
  width: number,
  height: number,
  options: ViewportConstraintOptions = {}
): Bounds {
  const { margin = DEFAULT_MARGIN } = options;

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;

  const maxWidth = vw - margin * 2;
  const maxHeight = vh - margin * 2;

  const clampedWidth = Math.min(width, maxWidth);
  const clampedHeight = Math.min(height, maxHeight);

  const pos = constrainToViewport(x, y, clampedWidth, clampedHeight, options);

  return {
    x: pos.x,
    y: pos.y,
    width: clampedWidth,
    height: clampedHeight,
  };
}
