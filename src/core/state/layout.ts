import type { ModalId, Position } from '../types';
import { getConfig } from '../config';
import { calculateEqualSpaceLayout, getElementBounds } from '../utils/viewport';
import { getModalDialogElement } from '../utils/helpers';
import { flipAnimate } from '../animation/flip';
import { DURATIONS, TIMEOUT_SAFETY_MARGIN } from '../animation/timing';
import {
  modals,
  rearrangementTimeout,
  setRearrangementTimeout,
  resizeTimeout,
  setResizeTimeout,
  incrementVersion,
} from './internal';
import { getModalLayoutInfos } from './getters';
import { clearPositionAnimation } from './position';

export function triggerRearrangement(newModal: { id: string; width: number; height: number } | null): void {
  const config = getConfig();
  if (config.positioning.strategy !== 'smart') return;

  if (rearrangementTimeout) {
    clearTimeout(rearrangementTimeout);
  }

  setRearrangementTimeout(setTimeout(() => {
    const existingModals = getModalLayoutInfos();

    const avoidBounds = getElementBounds(config.positioning.avoidElements);

    const result = calculateEqualSpaceLayout(existingModals, newModal, {
      modalGap: config.positioning.modalGap,
      viewportMargin: config.positioning.modalGap,
      avoidBounds,
      avoidMargin: config.positioning.modalGap,
    });

    applyLayoutPositions(result.positions);
    setRearrangementTimeout(null);
  }, 50));
}

export function applyLayoutPositions(positions: Map<string, Position>): void {
  if (positions.size === 0) return;

  const animationTargets: Array<{
    id: ModalId;
    element: HTMLElement | null;
    oldPosition: Position;
    newPosition: Position;
    size: { width: number; height: number };
  }> = [];

  for (const [id, newPosition] of positions) {
    const modal = modals.get(id);
    if (!modal) continue;

    const element = getModalDialogElement(id);

    const oldPosition = modal.position ?? (element ? {
      x: element.getBoundingClientRect().left,
      y: element.getBoundingClientRect().top,
    } : { x: 0, y: 0 });

    const size = modal.size ?? (element ? {
      width: element.offsetWidth,
      height: element.offsetHeight,
    } : { width: 0, height: 0 });

    animationTargets.push({ id, element, oldPosition, newPosition, size });

    collectChildAnimationTargets(id, oldPosition, newPosition, animationTargets);
  }

  for (const { id, newPosition, size } of animationTargets) {
    const modal = modals.get(id);
    if (!modal) continue;

    modals.set(id, {
      ...modal,
      position: newPosition,
      size,
      hasBeenDragged: true,
      isAnimatingPosition: true,
    });
  }

  incrementVersion();

  for (const { id, element, oldPosition, newPosition } of animationTargets) {
    if (element) {
      flipAnimate(element, oldPosition, newPosition, {
        duration: DURATIONS.parentMove,
        onComplete: () => clearPositionAnimation(id),
      });
    } else {

      setTimeout(() => clearPositionAnimation(id), DURATIONS.parentMove + TIMEOUT_SAFETY_MARGIN);
    }
  }
}

function collectChildAnimationTargets(
  parentId: ModalId,
  parentOldPosition: Position,
  parentNewPosition: Position,
  targets: Array<{ id: ModalId; element: HTMLElement | null; oldPosition: Position; newPosition: Position }>,
): void {
  const parent = modals.get(parentId);
  if (!parent?.childId) return;

  const child = modals.get(parent.childId);
  if (!child?.offsetFromParent) return;

  const element = getModalDialogElement(parent.childId);

  const childOldPosition = {
    x: parentOldPosition.x + child.offsetFromParent.x,
    y: parentOldPosition.y + child.offsetFromParent.y,
  };
  const childNewPosition = {
    x: parentNewPosition.x + child.offsetFromParent.x,
    y: parentNewPosition.y + child.offsetFromParent.y,
  };

  targets.push({
    id: parent.childId,
    element,
    oldPosition: childOldPosition,
    newPosition: childNewPosition,
  });

  modals.set(parent.childId, {
    ...child,
    position: childNewPosition,
    hasBeenDragged: true,
    isAnimatingPosition: true,
  });

  if (child.childId) {
    collectChildAnimationTargets(parent.childId, childOldPosition, childNewPosition, targets);
  }
}

export function handleWindowResize(): void {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout);
  }

  setResizeTimeout(setTimeout(() => {
    triggerRearrangement(null);
    setResizeTimeout(null);
  }, 100));
}

let resizeListenerInitialized = false;

export function initializeResizeListener(): void {
  if (resizeListenerInitialized || typeof window === 'undefined') return;

  window.addEventListener('resize', handleWindowResize);
  resizeListenerInitialized = true;
}

export function cleanupResizeListener(): void {
  if (typeof window === 'undefined') return;

  window.removeEventListener('resize', handleWindowResize);
  resizeListenerInitialized = false;
}

export function animateModalsToPositions(moves: Map<string, Position>): void {
  if (moves.size === 0) return;

  const animationTargets: Array<{
    id: ModalId;
    element: HTMLElement | null;
    oldPosition: Position;
    newPosition: Position;
  }> = [];

  for (const [id, newPosition] of moves) {
    const modal = modals.get(id);
    if (!modal) continue;

    const element = getModalDialogElement(id);

    const oldPosition = modal.position ?? (element ? {
      x: element.getBoundingClientRect().left,
      y: element.getBoundingClientRect().top,
    } : { x: 0, y: 0 });

    animationTargets.push({ id, element, oldPosition, newPosition });
  }

  for (const { id, newPosition } of animationTargets) {
    const modal = modals.get(id);
    if (!modal) continue;

    modals.set(id, {
      ...modal,
      position: newPosition,
      hasBeenDragged: true,
      isAnimatingPosition: true,
    });
  }

  incrementVersion();

  for (const { id, element, oldPosition, newPosition } of animationTargets) {
    if (element) {
      flipAnimate(element, oldPosition, newPosition, {
        duration: DURATIONS.parentMove,
        onComplete: () => clearPositionAnimation(id),
      });
    } else {

      setTimeout(() => clearPositionAnimation(id), DURATIONS.parentMove + TIMEOUT_SAFETY_MARGIN);
    }
  }
}
