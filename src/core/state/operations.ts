import type { ModalState, ModalId, ModalGlow, Position } from '../types';
import { getConfig } from '../config';
import { getModalDialogElement } from '../utils/helpers';
import {
  modals,
  maxZIndex,
  updateMaxZIndex,
  recalcMaxZIndex,
  dockOrder,
  setDockOrder,
  openSourcePositions,
  pendingParentLink,
  setPendingParentLink,
  closingModals,
  urlCallbacks,
  registryCallbacks,
  transparentModals,
  animatingModals,
  dockPositionGetter,
  setPendingMinimizeTarget,
  pendingParentAnimations,
  warnIfUnregistered,
  incrementVersion,
  validateModalId,
  validateSource,
  validateParentId,
} from './store';
import { pending } from './pending-factory';
import { bringToFront } from './position';
import { triggerRearrangement } from './layout';
import { forEachDescendant } from './hierarchy';

export interface CreateModalRegistrationProps {
  id: ModalId;
  title: string;
  icon?: string;
  autoOpen?: boolean;
  glow?: ModalGlow | null;
}

export function createModalRegistration(props: CreateModalRegistrationProps): Omit<ModalState, 'zIndex' | 'isAnimating'> {
  return {
    id: props.id,
    title: props.title,
    icon: props.icon ?? '',
    isOpen: props.autoOpen ?? false,
    isMinimized: false,
    isHiddenWithParent: false,
    isTransparent: false,
    isRejected: false,
    position: null,
    size: null,
    hasBeenDragged: false,
    dockPosition: 0,
    glow: props.glow ?? null,
    parentId: undefined,
    childId: undefined,
    offsetFromParent: undefined,
  };
}

export function registerModal(modal: Omit<ModalState, 'zIndex' | 'isAnimating'>): void {
  const existing = modals.get(modal.id);

  let zIndex: number;
  if (existing?.zIndex) {
    zIndex = existing.zIndex;
  } else {
    const baseZ = getConfig().zIndex.base - 2;
    const currentMax = maxZIndex > baseZ ? maxZIndex : baseZ;
    zIndex = currentMax + 2;
    updateMaxZIndex(zIndex);
  }

  const hasPending = pending.has('open', modal.id);
  const shouldBeOpen = modal.isOpen || hasPending;

  if (existing) {

    modals.set(modal.id, {
      ...existing,
      title: modal.title,
      icon: modal.icon,
      glow: modal.glow,
      zIndex,
    });
  } else {

    modals.set(modal.id, {
      ...modal,
      isOpen: shouldBeOpen,
      zIndex,
      isAnimating: false,
    });
  }
  incrementVersion();

  if (modal.isMinimized && !dockOrder.includes(modal.id)) {
    setDockOrder([...dockOrder, modal.id]);
  }
}

export function unregisterModal(id: ModalId): void {
  const modal = modals.get(id);
  if (!modal) return;

  setDockOrder(dockOrder.filter((d) => d !== id));

  pending.consume('open', id);
  pending.consume('close', id);
  pending.consume('forceClose', id);
  pending.consume('minimize', id);
  pending.consume('restore', id);
  pending.consume('childRestore', id);
  pending.consume('minimizeWithParent', id);
  pending.consume('attention', id);

  if (modal.childId) {
    const child = modals.get(modal.childId);
    if (child) {
      modals.set(modal.childId, { ...child, parentId: undefined });
    }
  }
  if (modal.parentId) {
    const parent = modals.get(modal.parentId);
    if (parent) {
      modals.set(modal.parentId, { ...parent, childId: undefined, lastChildId: modal.id });
    }
  }

  const removedZIndex = modal.zIndex;
  modals.delete(id);
  if (removedZIndex >= maxZIndex) {
    recalcMaxZIndex();
  }
  incrementVersion();
  transparentModals.delete(id);
  animatingModals.delete(id);
}

export interface OpenModalOptions {

  parentId?: ModalId;
}

export function openChildModal(
  childId: ModalId,
  parentId: ModalId,
  source: HTMLElement | Position
): void {
  validateModalId(childId, 'openChildModal');
  validateParentId(parentId, 'openChildModal');
  validateSource(source, 'openChildModal');
  openModal(childId, source, { parentId });
}

export function openModal(
  id: ModalId,
  source: HTMLElement | Position,
  options?: OpenModalOptions
): void {
  validateModalId(id, 'openModal');
  validateSource(source, 'openModal');

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

  pending.add('open', id);
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
  pending.add('open', modal.id);
  incrementVersion();
  bringToFront(modal.id);

  urlCallbacks?.push(modal.id);
}

export function closeModal(id: ModalId, force = false): void {
  validateModalId(id, 'closeModal');

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
    pending.add('forceClose', id);
  } else {
    pending.add('close', id);
  }

  if (!modal.parentId) {
    triggerRearrangement(null);
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

export function clearPendingParentAnimation(parentId: ModalId): void {
  pendingParentAnimations.delete(parentId);
}

export function minimizeModal(id: ModalId): void {
  validateModalId(id, 'minimizeModal');

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

  pending.add('minimize', id);

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

  if (modal.childId) {
    forEachDescendant(id, (childId) => {
      pending.add('minimizeWithParent', childId);
    });
    hideChildWithParent(id);
  }

  incrementVersion();
  triggerRearrangement(null);
}

export function restoreModal(id: ModalId): void {
  validateModalId(id, 'restoreModal');

  const modal = modals.get(id);
  if (!modal || !modal.isMinimized) return;

  modals.set(id, { ...modal, isMinimized: false, isOpen: true });
  pending.add('restore', id);
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
      pending.add('restore', id);
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
  if (!modal?.isHiddenWithParent) return;

  pending.consume('minimizeWithParent', id);
  pending.add('childRestore', id);

  forEachDescendant(id, (childId) => {
    pending.consume('minimizeWithParent', childId);
    pending.add('childRestore', childId);
  }, { useLastChildId: true });
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
  forEachDescendant(parentId, (childId, child) => {
    modals.set(childId, { ...child, isHiddenWithParent: true });
    incrementVersion();
  }, { postOrder: true });
}

export function toggleModalTransparency(id: ModalId): void {
  if (!warnIfUnregistered(id, 'toggleModalTransparency')) return;

  const modal = modals.get(id)!;
  const wasTransparent = transparentModals.has(id);

  if (wasTransparent) {
    transparentModals.delete(id);
    modals.set(id, { ...modal, isTransparent: false });
  } else {
    transparentModals.add(id);
    modals.set(id, { ...modal, isTransparent: true });
  }

  incrementVersion();
}

export function triggerAttention(id: ModalId): void {
  if (!warnIfUnregistered(id, 'triggerAttention')) return;

  pending.add('attention', id);
  incrementVersion();
}

export function shakeElement(element: HTMLElement): void {
  element.classList.add('modal-shake');
  element.addEventListener(
    'animationend',
    () => {
      element.classList.remove('modal-shake');
    },
    { once: true }
  );
}

export function triggerRejection(id: ModalId): void {
  if (!warnIfUnregistered(id, 'triggerRejection')) return;

  const modal = modals.get(id)!;
  modals.set(id, { ...modal, isRejected: true });
  incrementVersion();

  setTimeout(() => {
    const current = modals.get(id);
    if (current) {
      modals.set(id, { ...current, isRejected: false });
      incrementVersion();
    }
  }, 300);

  const element = getModalDialogElement(id);
  if (element) {
    shakeElement(element);
  }
}

export function resetModalTransparency(id: ModalId): void {
  if (!warnIfUnregistered(id, 'resetModalTransparency')) return;

  const modal = modals.get(id)!;
  transparentModals.delete(id);
  modals.set(id, { ...modal, isTransparent: false });
  incrementVersion();
}
