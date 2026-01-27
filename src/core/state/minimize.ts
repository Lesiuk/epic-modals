import type { ModalId } from '../types';
import {
  modals,
  dockOrder,
  setDockOrder,
  pendingMinimize,
  pendingRestore,
  pendingChildRestore,
  pendingMinimizeWithParent,
  setPendingMinimize,
  setPendingRestore,
  setPendingChildRestore,
  setPendingMinimizeWithParent,
  dockPositionGetter,
  setPendingMinimizeTarget,
  pendingParentAnimations,
  incrementVersion,
} from './internal';
import { bringToFront } from './zindex';
import { triggerRearrangement } from './layout';

export function clearPendingParentAnimation(parentId: ModalId): void {
  pendingParentAnimations.delete(parentId);
}

function queueChildrenForMinimize(parentId: ModalId): void {
  const parent = modals.get(parentId);
  if (!parent?.childId) return;

  const child = modals.get(parent.childId);
  if (!child) return;

  if (!pendingMinimizeWithParent.includes(parent.childId)) {
    setPendingMinimizeWithParent([...pendingMinimizeWithParent, parent.childId]);
  }

  if (child.childId) {
    queueChildrenForMinimize(parent.childId);
  }
}

export function minimizeModal(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal || modal.isMinimized) return;

  clearPendingParentAnimation(id);

  if (modal.parentId) {
    const parent = modals.get(modal.parentId);
    if (parent && !parent.isMinimized) {
      minimizeModal(modal.parentId);
      return;
    }
  }

  setPendingMinimize([...pendingMinimize, id]);

  if (modal.position && modal.size && dockPositionGetter) {
    const dock = dockPositionGetter();
    const dockIndex = dockOrder.indexOf(id);

    const targetX = dock.x + (dockIndex * (dock.height + 8));
    const targetY = dock.y;

    setPendingMinimizeTarget({
      x: targetX,
      y: targetY,
      originX: modal.position.x + modal.size.width / 2,
      originY: modal.position.y + modal.size.height / 2,
    });
  }

  const childIdToRemember = modal.childId;

  modals.set(id, { ...modal, isMinimized: true, lastChildId: childIdToRemember });

  if (!dockOrder.includes(id)) {
    setDockOrder([...dockOrder, id]);
  }

  incrementVersion();

  if (modal.childId) {
    queueChildrenForMinimize(id);
  }

  triggerRearrangement(null);
}

export function restoreModal(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal || !modal.isMinimized) return;

  modals.set(id, { ...modal, isMinimized: false, isOpen: true });
  setPendingRestore([...pendingRestore, id]);
  bringToFront(id);

  const childId = modal.lastChildId || modal.childId;
  if (childId) {
    restoreChildModal(childId);
  }

  incrementVersion();
}

export function restoreAllMinimizedModals(): void {
  const minimizedIds = Array.from(modals.values())
    .filter(m => m.isMinimized)
    .map(m => m.id);

  minimizedIds.forEach(id => {
    const modal = modals.get(id);
    if (modal) {
      modals.set(id, { ...modal, isMinimized: false, isOpen: true });
      setPendingRestore([...pendingRestore, id]);
      bringToFront(id);

      const childId = modal.lastChildId || modal.childId;
      if (childId) {
        restoreChildModal(childId);
      }
    }
  });

  setDockOrder([]);
  incrementVersion();
}

export function restoreChildModal(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal) return;

  if (modal.isHiddenWithParent) {
    setPendingChildRestore([...pendingChildRestore, id]);

    const childId = modal.lastChildId || modal.childId;
    if (childId) {
      restoreChildModal(childId);
    }
  }
}

export function unhideChildModal(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal || !modal.isHiddenWithParent) return;

  modals.set(id, { ...modal, isHiddenWithParent: false });
  incrementVersion();
}

export function finalizeChildMinimize(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal) return;

  modals.set(id, { ...modal, isHiddenWithParent: true });
  incrementVersion();
}

export function hideChildWithParent(parentId: ModalId): void {
  const parent = modals.get(parentId);
  if (!parent?.childId) return;

  const child = modals.get(parent.childId);
  if (!child) return;

  if (child.childId) {
    hideChildWithParent(parent.childId);
  }

  modals.set(parent.childId, { ...child, isHiddenWithParent: true });
  incrementVersion();
}
