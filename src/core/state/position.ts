import type { ModalId, ModalState, Position, Dimensions } from '../types';
import { constrainToViewport } from '../utils/viewport';
import { getConfig } from '../config';
import {
  modals,
  pendingParentAnimations,
  validatePosition,
  validateDimensions,
  warnIfUnregistered,
  incrementVersion,
} from './internal';

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

  let childId: string | undefined = modal.childId;
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
  incrementVersion();
}
