import type { ModalId, Position } from '../types';
import { getConfig } from '../config';
import { toDataId, getModalDialogElement } from '../utils/helpers';
import {
  modals,
  pendingParentLink,
  setPendingParentLink,
  pendingParentAnimations,
  incrementVersion,
} from './internal';
import { bringToFront } from './zindex';

export function linkModals(parentId: ModalId, childId: ModalId, offset: Position): void {
  const parent = modals.get(parentId);
  const child = modals.get(childId);

  if (!parent || !child) return;

  modals.set(parentId, { ...parent, childId });
  modals.set(childId, { ...child, parentId, offsetFromParent: offset });

  bringToFront(childId);
  incrementVersion();
}

export function getPendingParentLink(): { parentId: ModalId; childId: ModalId } | null {
  return pendingParentLink;
}

export function triggerCascadingParentAnimations(childId: ModalId): void {
  const config = getConfig();
  if (config.parentChild.movementMode !== 'animated') return;

  const child = modals.get(childId);
  if (!child?.parentId || !child.offsetFromParent || !child.position) return;

  const targetPosition = {
    x: child.position.x - child.offsetFromParent.x,
    y: child.position.y - child.offsetFromParent.y,
  };

  pendingParentAnimations.set(child.parentId, targetPosition);
  incrementVersion();
}

export function getPendingParentAnimation(id: ModalId): Position | null {
  return pendingParentAnimations.get(id) ?? null;
}

export function clearPendingParentAnimation(id: ModalId): void {
  pendingParentAnimations.delete(id);
}

export function calculateChildCenterPosition(
  parentId: ModalId,
  childWidth: number,
  childHeight: number
): Position | null {
  const parent = modals.get(parentId);
  if (!parent) return null;

  const parentEl = getModalDialogElement(parentId);

  if (!parentEl) return null;

  const parentPos = parent.position ?? {
    x: parentEl.getBoundingClientRect().left,
    y: parentEl.getBoundingClientRect().top,
  };
  const parentSize = parent.size ?? {
    width: parentEl.offsetWidth,
    height: parentEl.offsetHeight,
  };

  return {
    x: parentPos.x + (parentSize.width - childWidth) / 2,
    y: parentPos.y + (parentSize.height - childHeight) / 2,
  };
}
