import type { ModalId, ModalState, Position, Dimensions } from '../types';
import { constrainToViewport } from '../utils/viewport';
import { getConfig } from '../config';
import {
  modals,
  maxZIndex,
  updateMaxZIndex,
  dockOrder,
  setDockOrder,
  pendingParentAnimations,
  validatePosition,
  validateDimensions,
  warnIfUnregistered,
  incrementVersion,
} from './store';

export function updateModalPosition(
  id: ModalId,
  position: Position,
  options?: { constrain?: boolean; drag?: boolean; size?: Dimensions; realtime?: boolean }
): void {
  if (!warnIfUnregistered(id, 'updateModalPosition')) return;
  validatePosition(position, 'updateModalPosition');
  if (options?.size) {
    validateDimensions(options.size, 'updateModalPosition');
  }

  const modal = modals.get(id);
  if (!modal) return;

  let finalPosition = position;
  if (options?.constrain && modal.size) {
    finalPosition = constrainToViewport(
      position.x,
      position.y,
      modal.size.width,
      modal.size.height
    );
  }

  modals.set(id, {
    ...modal,
    position: finalPosition,
    size: options?.size ?? modal.size,
    hasBeenDragged: modal.hasBeenDragged || options?.drag || false,
  });

  if (modal.childId) {
    let currentParentId = id;
    let currentParentPosition = finalPosition;

    while (true) {
      const currentParent = modals.get(currentParentId);
      if (!currentParent?.childId) break;

      const child = modals.get(currentParent.childId);
      if (!child?.offsetFromParent) break;

      const childPosition = {
        x: currentParentPosition.x + child.offsetFromParent.x,
        y: currentParentPosition.y + child.offsetFromParent.y,
      };

      modals.set(currentParent.childId, {
        ...child,
        position: childPosition,
        hasBeenDragged: true,
      });

      currentParentId = currentParent.childId;
      currentParentPosition = childPosition;
    }
  }

  if (modal.parentId && modal.offsetFromParent) {
    const config = getConfig();

    let currentChildId = id;
    let currentChild = modal;

    while (currentChild.parentId && currentChild.offsetFromParent) {
      const parent = modals.get(currentChild.parentId);
      if (!parent) break;

      const currentChildPosition: Position = currentChildId === id
        ? finalPosition
        : modals.get(currentChildId)!.position!;

      const targetParentPosition: Position = {
        x: currentChildPosition.x - currentChild.offsetFromParent.x,
        y: currentChildPosition.y - currentChild.offsetFromParent.y,
      };

      if (config.parentChild.movementMode === 'animated' && !options?.realtime) {

        pendingParentAnimations.set(currentChild.parentId, targetParentPosition);
        break;
      } else {
        modals.set(currentChild.parentId, {
          ...parent,
          position: targetParentPosition,
          hasBeenDragged: true,
        });
      }

      currentChildId = currentChild.parentId;
      currentChild = parent;
    }
  }

  incrementVersion();
}

export function clearPositionAnimation(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal) return;

  if (!modal.isAnimatingPosition) return;

  modal.isAnimatingPosition = false;

  let childId: ModalId | undefined = modal.childId;
  while (childId) {
    const child = modals.get(childId);
    if (child) child.isAnimatingPosition = false;
    childId = child?.childId;
  }

  incrementVersion();
}

export function updateModalSize(id: ModalId, size: Dimensions): void {
  if (!warnIfUnregistered(id, 'updateModalSize')) return;
  validateDimensions(size, 'updateModalSize');

  const modal = modals.get(id);
  if (!modal) return;

  modals.set(id, { ...modal, size });
  incrementVersion();
}

export function updateModal(id: ModalId, updates: Partial<ModalState>): void {
  const modal = modals.get(id);
  if (!modal) return;

  modals.set(id, { ...modal, ...updates });
  if (updates.zIndex !== undefined) {
    updateMaxZIndex(updates.zIndex);
  }
  incrementVersion();
}

function findRootAncestor(id: ModalId): ModalId {
  let currentId = id;
  let modal = modals.get(currentId);
  while (modal?.parentId) {
    currentId = modal.parentId;
    modal = modals.get(currentId);
  }
  return currentId;
}

function ensureDescendantsAbove(parentId: ModalId, parentZIndex: number): void {
  const parent = modals.get(parentId);
  if (!parent?.childId) return;

  const child = modals.get(parent.childId);
  if (!child) return;

  const newChildZ = parentZIndex + 2;
  modals.set(parent.childId, { ...child, zIndex: newChildZ });
  updateMaxZIndex(newChildZ);
  ensureDescendantsAbove(parent.childId, newChildZ);
}

export function bringToFront(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal) return;

  const maxZ = maxZIndex;

  const rootId = findRootAncestor(id);
  const root = modals.get(rootId);
  if (!root) return;

  const newRootZ = maxZ + 2;
  modals.set(rootId, { ...root, zIndex: newRootZ });
  updateMaxZIndex(newRootZ);

  ensureDescendantsAbove(rootId, newRootZ);

  incrementVersion();
}

export function isTopModal(id: ModalId): boolean {
  const modal = modals.get(id);
  if (!modal) return false;

  const maxZ = maxZIndex;
  return modal.zIndex === maxZ && !modal.isMinimized && !modal.isHiddenWithParent;
}

export function reorderDock(newOrderOrFromIndex: ModalId[] | number, toIndex?: number): void {
  if (Array.isArray(newOrderOrFromIndex)) {
    setDockOrder(newOrderOrFromIndex);
  } else if (typeof toIndex === 'number') {
    const fromIndex = newOrderOrFromIndex;
    const newOrder = [...dockOrder];
    const [item] = newOrder.splice(fromIndex, 1);
    newOrder.splice(toIndex, 0, item);
    setDockOrder(newOrder);
  }
}
