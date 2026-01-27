import type { ModalState, ModalId, ModalGlow } from '../types';
import { getConfig } from '../config';
import {
  modals,
  dockOrder,
  setDockOrder,
  pendingOpen,
  pendingClose,
  pendingForceClose,
  pendingMinimize,
  pendingRestore,
  pendingChildRestore,
  pendingMinimizeWithParent,
  pendingAttention,
  setPendingOpen,
  setPendingClose,
  setPendingForceClose,
  setPendingMinimize,
  setPendingRestore,
  setPendingChildRestore,
  setPendingMinimizeWithParent,
  setPendingAttention,
  transparentModals,
  animatingModals,
  incrementVersion,
} from './internal';

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
    const maxZ = Math.max(...Array.from(modals.values()).map((m) => m.zIndex), getConfig().zIndex.base - 2);
    zIndex = maxZ + 2;
  }

  const hasPending = pendingOpen.includes(modal.id);
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

  setPendingOpen(pendingOpen.filter((m) => m !== id));
  setPendingClose(pendingClose.filter((m) => m !== id));
  setPendingForceClose(pendingForceClose.filter((m) => m !== id));
  setPendingMinimize(pendingMinimize.filter((m) => m !== id));
  setPendingRestore(pendingRestore.filter((m) => m !== id));
  setPendingChildRestore(pendingChildRestore.filter((m) => m !== id));
  setPendingMinimizeWithParent(pendingMinimizeWithParent.filter((m) => m !== id));
  setPendingAttention(pendingAttention.filter((m) => m !== id));

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

  modals.delete(id);
  incrementVersion();
  transparentModals.delete(id);
  animatingModals.delete(id);
}
