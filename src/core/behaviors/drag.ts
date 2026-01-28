import type { Position, Dimensions } from '../types';
import { constrainToViewport } from '../utils/viewport';
import { createEventEmitter } from '../state/events';

export interface DragState {
  isDragging: boolean;
  position: Position;
  hasBeenDragged: boolean;
}

export interface DragEvents {
  change: DragState;
  dragStart: Position;
  dragMove: Position;
  dragEnd: Position;
}

export interface DragBehaviorOptions {
  initialPosition?: Position;
  constrain?: boolean;
}

export interface DragBehavior {

  getState(): DragState;
  getPosition(): Position;
  isDragging(): boolean;
  hasBeenDragged(): boolean;

  setPosition(position: Position): void;
  setHasBeenDragged(value: boolean): void;
  reset(): void;
  constrainToViewport(modalSize: Dimensions): void;

  onPointerDown(e: PointerEvent, element: HTMLElement): void;
  onPointerMove(e: PointerEvent, modalSize: Dimensions): void;
  onPointerUp(e: PointerEvent, element: HTMLElement): void;

  subscribe(callback: (state: DragState) => void): () => void;

  destroy(): void;
}

export function createDragBehavior(options: DragBehaviorOptions = {}): DragBehavior {
  const { initialPosition = { x: 0, y: 0 }, constrain = true } = options;

  const position: Position = { ...initialPosition };
  let isDragging = false;
  let hasBeenDragged = false;

  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;

  let rafId: number | null = null;
  let pendingEvent: PointerEvent | null = null;
  let pendingModalSize: Dimensions | null = null;

  const emitter = createEventEmitter<DragEvents>();

  function getState(): DragState {
    return {
      isDragging,
      position: { ...position },
      hasBeenDragged,
    };
  }

  function notify() {
    emitter.emit('change', getState());
  }

  function onPointerDown(event: PointerEvent, element: HTMLElement) {

    if (event.button !== 0) return;

    if (!hasBeenDragged) {
      const rect = element.getBoundingClientRect();
      position.x = rect.left;
      position.y = rect.top;
    }

    isDragging = true;
    startX = event.clientX;
    startY = event.clientY;
    initialX = position.x;
    initialY = position.y;

    element.setPointerCapture(event.pointerId);

    emitter.emit('dragStart', { ...position });
    notify();
  }

  function processPendingMove() {
    rafId = null;
    if (!pendingEvent || !pendingModalSize || !isDragging) return;

    const event = pendingEvent;
    const modalSize = pendingModalSize;
    pendingEvent = null;
    pendingModalSize = null;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    let newX = initialX + dx;
    let newY = initialY + dy;

    if (constrain) {
      const constrained = constrainToViewport(newX, newY, modalSize.width, modalSize.height);
      newX = constrained.x;
      newY = constrained.y;
    }

    position.x = newX;
    position.y = newY;
    hasBeenDragged = true;

    emitter.emit('dragMove', { ...position });
    notify();
  }

  function onPointerMove(event: PointerEvent, modalSize: Dimensions) {
    if (!isDragging) return;

    pendingEvent = event;
    pendingModalSize = modalSize;

    if (rafId === null) {
      rafId = requestAnimationFrame(processPendingMove);
    }
  }

  function onPointerUp(event: PointerEvent, element: HTMLElement) {
    if (!isDragging) return;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    if (pendingEvent && pendingModalSize) {
      const dx = pendingEvent.clientX - startX;
      const dy = pendingEvent.clientY - startY;
      let newX = initialX + dx;
      let newY = initialY + dy;

      if (constrain) {
        const constrained = constrainToViewport(newX, newY, pendingModalSize.width, pendingModalSize.height);
        newX = constrained.x;
        newY = constrained.y;
      }

      position.x = newX;
      position.y = newY;
      hasBeenDragged = true;
    }

    pendingEvent = null;
    pendingModalSize = null;
    isDragging = false;
    element.releasePointerCapture(event.pointerId);

    emitter.emit('dragEnd', { ...position });
    notify();
  }

  function setPosition(newPosition: Position) {
    position.x = newPosition.x;
    position.y = newPosition.y;
    notify();
  }

  function setHasBeenDragged(value: boolean) {
    hasBeenDragged = value;
    notify();
  }

  function reset() {
    position.x = initialPosition.x;
    position.y = initialPosition.y;
    hasBeenDragged = false;
    isDragging = false;
    notify();
  }

  function subscribe(callback: (state: DragState) => void): () => void {
    return emitter.on('change', callback);
  }

  function constrainToViewportFn(modalSize: Dimensions) {
    if (!hasBeenDragged) return;
    const constrained = constrainToViewport(position.x, position.y, modalSize.width, modalSize.height);
    position.x = constrained.x;
    position.y = constrained.y;
    notify();
  }

  function destroy() {

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    pendingEvent = null;
    pendingModalSize = null;
    emitter.off();
  }

  return {
    getState,
    getPosition: () => ({ ...position }),
    isDragging: () => isDragging,
    hasBeenDragged: () => hasBeenDragged,
    setPosition,
    setHasBeenDragged,
    reset,
    constrainToViewport: constrainToViewportFn,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    subscribe,
    destroy,
  };
}
