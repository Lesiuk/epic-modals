import type { ModalId, ModalState, Position } from '../types';
import { getConfig } from '../config';
import {
  modals,
  dockOrder,
  setDockOrder,
  pendingOpen,
  pendingClose,
  pendingForceClose,
  setPendingOpen,
  setPendingClose,
  setPendingForceClose,
  openSourcePositions,
  pendingParentLink,
  setPendingParentLink,
  closingModals,
  urlCallbacks,
  registryCallbacks,
  incrementVersion,
} from './internal';
import { registerModal } from './registration';
import { restoreModal, clearPendingParentAnimation } from './minimize';
import { bringToFront } from './zindex';
import { triggerAttention } from './effects';

export interface OpenModalOptions {

  parentId?: ModalId;
}

export function openChildModal(
  childId: ModalId,
  parentId: ModalId,
  source: HTMLElement | Position
): void {
  openModal(childId, source, { parentId });
}

export function openModal(
  id: ModalId,
  source: HTMLElement | Position,
  options?: OpenModalOptions
): void {
  const config = getConfig();

  const modal = modals.get(id);

  if (modal && modal.isOpen && !modal.isMinimized && !modal.isHiddenWithParent) {
    triggerAttention(id);
    bringToFront(id);
    return;
  }

  if (modal && modal.isMinimized) {
    restoreModal(id);
    return;
  }

  if ('x' in source && 'y' in source) {
    openSourcePositions.set(id, source);
  } else {
    const rect = source.getBoundingClientRect();
    openSourcePositions.set(id, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  }

  if (options?.parentId && config.features.parentChild) {
    const parent = modals.get(options.parentId);
    if (parent?.childId && parent.childId !== id) {
      closeModal(parent.childId, true);
    }
    setPendingParentLink({ parentId: options.parentId, childId: id });
  }

  if (!pendingOpen.includes(id)) {
    setPendingOpen([...pendingOpen, id]);
  }
  incrementVersion();

  if (!modal) {

    if (registryCallbacks?.isRegisteredInRegistry(id)) {
      registryCallbacks.mountModal(id);
    }
    return;
  }

  const updates: Partial<ModalState> = { isOpen: true };
  if (options?.parentId && config.features.parentChild) {
    updates.parentId = options.parentId;
  }
  modals.set(id, { ...modal, ...updates });

  bringToFront(id);

  urlCallbacks?.push(id);
}

export function createModal(modal: Omit<ModalState, 'zIndex' | 'isAnimating'>): void {
  registerModal(modal);

  const registered = modals.get(modal.id);
  if (registered) {
    modals.set(modal.id, { ...registered, isOpen: true });
    incrementVersion();
  }
  setPendingOpen([...pendingOpen, modal.id]);
  incrementVersion();
  bringToFront(modal.id);

  urlCallbacks?.push(modal.id);
}

export function closeModal(id: ModalId, force = false): void {
  const modal = modals.get(id);
  if (!modal) return;

  if (!modal.isOpen && !modal.isMinimized) return;

  clearPendingParentAnimation(id);

  if (modal.childId) {
    closeModal(modal.childId, force);
  }

  if (modal.isMinimized) {
    setDockOrder(dockOrder.filter((d) => d !== id));
    finalizeModalClose(id);
    urlCallbacks?.pop();
    return;
  }

  closingModals.add(id);

  if (force) {
    setPendingForceClose([...pendingForceClose, id]);
  } else {
    setPendingClose([...pendingClose, id]);
  }

  incrementVersion();

  urlCallbacks?.pop();
}

export function closeAllModals(exclude?: ModalId[]): void {
  const excludeSet = new Set(exclude ?? []);
  const ids = Array.from(modals.keys()).filter((id) => !excludeSet.has(id));
  ids.forEach((id) => closeModal(id, true));
}

export function finalizeModalClose(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal) return;

  closingModals.delete(id);

  if (modal.parentId) {
    const parent = modals.get(modal.parentId);
    if (parent && parent.childId === id) {
      modals.set(modal.parentId, { ...parent, childId: undefined, lastChildId: id });
    }
  }

  modals.set(id, {
    ...modal,
    isOpen: false,
    isMinimized: false,
    isHiddenWithParent: false,
    isTransparent: false,
    position: null,
    size: null,
    hasBeenDragged: false,
    parentId: undefined,
    childId: undefined,
    offsetFromParent: undefined,
  });
  incrementVersion();
}

export function getModalsToClose(fromIdOrExclude: ModalId | ModalId[]): ModalId[] {
  if (Array.isArray(fromIdOrExclude)) {
    const excludeSet = new Set(fromIdOrExclude);
    return Array.from(modals.entries())
      .filter(([id, modal]) => modal.isOpen && !excludeSet.has(id))
      .map(([id]) => id);
  }

  const modal = modals.get(fromIdOrExclude);
  if (!modal) return [fromIdOrExclude];

  const toClose: ModalId[] = [fromIdOrExclude];

  if (modal.childId) {
    toClose.push(...getModalsToClose(modal.childId));
  }

  return toClose;
}
