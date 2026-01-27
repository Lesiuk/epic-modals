import type { Position, Dimensions } from '../types';
import { getModalDialogElement } from '../utils/helpers';

export function calculateOffsetFromParent(
  childPosition: Position,
  parentPosition: Position
): Position {
  return {
    x: childPosition.x - parentPosition.x,
    y: childPosition.y - parentPosition.y,
  };
}

export function calculateChildPosition(
  parentPosition: Position,
  offset: Position
): Position {
  return {
    x: parentPosition.x + offset.x,
    y: parentPosition.y + offset.y,
  };
}

export function calculateParentPosition(
  childPosition: Position,
  offset: Position
): Position {
  return {
    x: childPosition.x - offset.x,
    y: childPosition.y - offset.y,
  };
}

export function calculateCenteredChildPosition(
  parentPosition: Position,
  parentSize: Dimensions,
  childSize: Dimensions
): Position {
  return {
    x: parentPosition.x + (parentSize.width - childSize.width) / 2,
    y: parentPosition.y + (parentSize.height - childSize.height) / 2,
  };
}

export function getModalBounds(element: HTMLElement): { position: Position; size: Dimensions } {
  const rect = element.getBoundingClientRect();
  return {
    position: { x: rect.left, y: rect.top },
    size: { width: rect.width, height: rect.height },
  };
}

export function findParentModalElement(parentId: string): HTMLElement | null {
  return getModalDialogElement(parentId);
}

export function findChildModalElement(childId: string): HTMLElement | null {
  return getModalDialogElement(childId);
}

export function shouldChildBeVisible(
  parentIsOpen: boolean,
  parentIsMinimized: boolean,
  parentIsHiddenWithParent: boolean
): boolean {
  return parentIsOpen && !parentIsMinimized && !parentIsHiddenWithParent;
}

export function getDescendantIds(
  modalId: string,
  getChildId: (id: string) => string | undefined
): string[] {
  const descendants: string[] = [];
  let currentId: string | undefined = getChildId(modalId);

  while (currentId) {
    descendants.push(currentId);
    currentId = getChildId(currentId);
  }

  return descendants;
}

export function getAncestorIds(
  modalId: string,
  getParentId: (id: string) => string | undefined
): string[] {
  const ancestors: string[] = [];
  let currentId: string | undefined = getParentId(modalId);

  while (currentId) {
    ancestors.push(currentId);
    currentId = getParentId(currentId);
  }

  return ancestors;
}

export function findRootAncestor(
  modalId: string,
  getParentId: (id: string) => string | undefined
): string {
  let currentId = modalId;
  let parentId = getParentId(currentId);

  while (parentId) {
    currentId = parentId;
    parentId = getParentId(currentId);
  }

  return currentId;
}
