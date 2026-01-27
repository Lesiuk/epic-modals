import type { Position, Dimensions, AnimationTransform } from '../types';

export function calculateMinimizeTransform(
  modalPosition: Position,
  modalSize: Dimensions,
  targetPosition: Position
): AnimationTransform {
  const modalCenterX = modalPosition.x + modalSize.width / 2;
  const modalCenterY = modalPosition.y + modalSize.height / 2;

  const x = targetPosition.x - modalCenterX;
  const y = targetPosition.y - modalCenterY;

  const originX = targetPosition.x - modalPosition.x;
  const originY = targetPosition.y - modalPosition.y;

  return { x, y, originX, originY };
}

export function calculateRestoreTransform(
  modalPosition: Position,
  modalSize: Dimensions,
  sourcePosition: Position
): AnimationTransform {
  const modalCenterX = modalPosition.x + modalSize.width / 2;
  const modalCenterY = modalPosition.y + modalSize.height / 2;

  const x = sourcePosition.x - modalCenterX;
  const y = sourcePosition.y - modalCenterY;

  const originX = sourcePosition.x - modalPosition.x;
  const originY = sourcePosition.y - modalPosition.y;

  return { x, y, originX, originY };
}

export function calculateOpenTransform(
  modalPosition: Position,
  modalSize: Dimensions,
  sourcePosition: Position
): AnimationTransform {
  const modalCenterX = modalPosition.x + modalSize.width / 2;
  const modalCenterY = modalPosition.y + modalSize.height / 2;

  const x = sourcePosition.x - modalCenterX;
  const y = sourcePosition.y - modalCenterY;

  const originX = sourcePosition.x - modalPosition.x;
  const originY = sourcePosition.y - modalPosition.y;

  return { x, y, originX, originY };
}

export function transformToCSSVars(transform: AnimationTransform): Record<string, string> {
  return {
    '--modal-transform-x': `${transform.x}px`,
    '--modal-transform-y': `${transform.y}px`,
    '--modal-origin-x': `${transform.originX}px`,
    '--modal-origin-y': `${transform.originY}px`,
  };
}

export function getDefaultDockTarget(): Position {
  return {
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight - 40 : 0,
  };
}

export function getDockItemPosition(modalId: string, fallback?: Position): Position {

  const dockItem = document.querySelector(`.modal-dock-item[data-modal-id="${modalId}"]`);
  if (dockItem) {
    const rect = dockItem.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  const dockContainer = document.querySelector('[data-dock-container="true"]');
  if (dockContainer) {
    const rect = dockContainer.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }

  return fallback ?? getDefaultDockTarget();
}
