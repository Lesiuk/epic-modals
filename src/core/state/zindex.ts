import type { ModalId } from '../types';
import { modals, dockOrder, setDockOrder, incrementVersion } from './internal';

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
  ensureDescendantsAbove(parent.childId, newChildZ);
}

export function bringToFront(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal) return;

  const maxZ = Math.max(...Array.from(modals.values()).map((m) => m.zIndex), 0);

  const rootId = findRootAncestor(id);
  const root = modals.get(rootId);
  if (!root) return;

  const newRootZ = maxZ + 2;
  modals.set(rootId, { ...root, zIndex: newRootZ });

  ensureDescendantsAbove(rootId, newRootZ);

  incrementVersion();
}

export function isTopModal(id: ModalId): boolean {
  const modal = modals.get(id);
  if (!modal) return false;

  const maxZ = Math.max(...Array.from(modals.values()).map((m) => m.zIndex), 0);
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
