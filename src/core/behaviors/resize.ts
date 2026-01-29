import type { Position, Dimensions } from '../types';
import { constrainSizeToViewport } from '../utils/viewport';
import { createEventEmitter } from '../state/store';
import { DEFAULTS } from '../utils/constants';

export type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw' | '';

export interface ResizeState {
  isResizing: boolean;
  direction: ResizeDirection;
  size: Dimensions;
  hasBeenResized: boolean;
}

export interface ResizeEvents {
  change: ResizeState;
  resizeStart: { direction: ResizeDirection };
  resizeMove: { size: Dimensions; position: Position };
  resizeEnd: { size: Dimensions; position: Position };
}

export interface ResizeBehaviorOptions {
  minWidth?: number;
  minHeight?: number;
  getPosition: () => Position;
  setPosition: (pos: Position) => void;
  getHasBeenDragged: () => boolean;
  setHasBeenDragged: (value: boolean) => void;
  getElement: () => HTMLElement | null;
  getSymmetricResize?: () => boolean;
  onResizeEnd?: (position: Position, size: Dimensions) => void;
}

export interface ResizeBehavior {

  getState(): ResizeState;
  getSize(): Dimensions;
  isResizing(): boolean;
  hasBeenResized(): boolean;
  justFinishedResizing(): boolean;

  setSize(size: Dimensions): void;
  reset(): void;
  constrainToViewport(): void;

  startResize(e: PointerEvent, direction: ResizeDirection): void;

  subscribe(callback: (state: ResizeState) => void): () => void;

  destroy(): void;
}

export function createResizeBehavior(options: ResizeBehaviorOptions): ResizeBehavior {
  const {
    minWidth = DEFAULTS.minWidth,
    minHeight = DEFAULTS.minHeight,
    getPosition,
    setPosition,
    getHasBeenDragged,
    setHasBeenDragged,
    getElement,
    getSymmetricResize,
    onResizeEnd,
  } = options;

  let isResizing = false;
  let direction: ResizeDirection = '';
  let size: Dimensions = { width: 0, height: 0 };
  let hasBeenResized = false;
  let _justFinishedResizing = false;

  let resizeStart = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
    centerX: 0,
    centerY: 0,
  };
  let activePointerId: number | null = null;

  const emitter = createEventEmitter<ResizeEvents>();

  let boundOnResize: ((e: PointerEvent) => void) | null = null;
  let boundStopResize: ((e: PointerEvent) => void) | null = null;

  function getState(): ResizeState {
    return {
      isResizing,
      direction,
      size: { ...size },
      hasBeenResized,
    };
  }

  function notify() {
    emitter.emit('change', getState());
  }

  function startResize(e: PointerEvent, dir: ResizeDirection) {
    e.preventDefault();
    e.stopPropagation();

    const modalEl = getElement();
    if (!modalEl) return;

    const rect = modalEl.getBoundingClientRect();

    if (!getHasBeenDragged()) {
      setPosition({ x: rect.left, y: rect.top });
      setHasBeenDragged(true);
    }

    if (!hasBeenResized) {
      size = { width: rect.width, height: rect.height };
      hasBeenResized = true;
    }

    const pos = getPosition();
    isResizing = true;
    direction = dir;
    activePointerId = e.pointerId;
    resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: pos.x,
      posY: pos.y,
      centerX: pos.x + size.width / 2,
      centerY: pos.y + size.height / 2,
    };

    boundOnResize = onResize;
    boundStopResize = stopResize;

    window.addEventListener('pointermove', boundOnResize);
    window.addEventListener('pointerup', boundStopResize);
    window.addEventListener('pointercancel', boundStopResize);

    emitter.emit('resizeStart', { direction: dir });
    notify();
  }

  function onResize(e: PointerEvent) {
    if (e.pointerId !== activePointerId) return;

    const dx = e.clientX - resizeStart.x;
    const dy = e.clientY - resizeStart.y;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const symmetric = getSymmetricResize?.() ?? false;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = resizeStart.posX;
    let newY = resizeStart.posY;

    if (symmetric) {

      if (direction.includes('e') || direction.includes('w')) {
        const horizontalDelta = direction.includes('e') ? dx : -dx;
        newWidth = Math.max(minWidth, resizeStart.width + horizontalDelta * 2);
        newX = resizeStart.centerX - newWidth / 2;
      }

      if (direction.includes('s') || direction.includes('n')) {
        const verticalDelta = direction.includes('s') ? dy : -dy;
        newHeight = Math.max(minHeight, resizeStart.height + verticalDelta * 2);
        newY = resizeStart.centerY - newHeight / 2;
      }
    } else {

      if (direction.includes('e')) {
        const maxWidth = vw - newX;
        newWidth = Math.max(minWidth, Math.min(resizeStart.width + dx, maxWidth));
      }
      if (direction.includes('w')) {
        const maxDelta = resizeStart.width - minWidth;
        const delta = Math.min(dx, maxDelta);
        newWidth = resizeStart.width - delta;
        newX = resizeStart.posX + delta;
      }

      if (direction.includes('s')) {
        const maxHeight = vh - newY;
        newHeight = Math.max(minHeight, Math.min(resizeStart.height + dy, maxHeight));
      }
      if (direction.includes('n')) {
        const maxDelta = resizeStart.height - minHeight;
        const delta = Math.min(dy, maxDelta);
        newHeight = resizeStart.height - delta;
        newY = resizeStart.posY + delta;
      }
    }

    const constrained = constrainSizeToViewport(newX, newY, newWidth, newHeight);
    size = { width: constrained.width, height: constrained.height };
    setPosition({ x: constrained.x, y: constrained.y });

    emitter.emit('resizeMove', { size: { ...size }, position: { x: constrained.x, y: constrained.y } });
    notify();
  }

  function stopResize(e: PointerEvent) {
    if (e.pointerId !== activePointerId) return;

    isResizing = false;
    direction = '';
    activePointerId = null;

    if (boundOnResize) {
      window.removeEventListener('pointermove', boundOnResize);
    }
    if (boundStopResize) {
      window.removeEventListener('pointerup', boundStopResize);
      window.removeEventListener('pointercancel', boundStopResize);
    }
    boundOnResize = null;
    boundStopResize = null;

    _justFinishedResizing = true;

    const pos = getPosition();
    emitter.emit('resizeEnd', { size: { ...size }, position: pos });

    if (onResizeEnd) {
      onResizeEnd(pos, { ...size });
    }

    notify();

    setTimeout(() => {
      _justFinishedResizing = false;
    }, 0);
  }

  function setSize(newSize: Dimensions) {
    size = { ...newSize };
    hasBeenResized = true;
    notify();
  }

  function reset() {
    hasBeenResized = false;
    size = { width: 0, height: 0 };
    isResizing = false;
    direction = '';
    notify();
  }

  function constrainToViewportFn() {
    const currentPos = getPosition();
    const modalEl = getElement();
    if (!modalEl) return;

    const constrained = constrainSizeToViewport(
      currentPos.x,
      currentPos.y,
      size.width || modalEl.offsetWidth,
      size.height || modalEl.offsetHeight
    );
    size = { width: constrained.width, height: constrained.height };
    setPosition({ x: constrained.x, y: constrained.y });
    notify();
  }

  function subscribe(callback: (state: ResizeState) => void): () => void {
    return emitter.on('change', callback);
  }

  function destroy() {

    if (boundOnResize) {
      window.removeEventListener('pointermove', boundOnResize);
    }
    if (boundStopResize) {
      window.removeEventListener('pointerup', boundStopResize);
      window.removeEventListener('pointercancel', boundStopResize);
    }
    emitter.off();
  }

  return {
    getState,
    getSize: () => ({ ...size }),
    isResizing: () => isResizing,
    hasBeenResized: () => hasBeenResized,
    justFinishedResizing: () => _justFinishedResizing,
    setSize,
    reset,
    constrainToViewport: constrainToViewportFn,
    startResize,
    subscribe,
    destroy,
  };
}
