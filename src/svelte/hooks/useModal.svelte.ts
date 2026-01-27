import type { ModalId, ModalState } from '../../core/types';
import {
  triggerAttention,
  bringToFront,
  isModalOpen,
  isModalRegistered,
  openModal,
  closeModal,
  minimizeModal,
  restoreModal,
  openChildModal,
  getModalsStore,
  getModalState,
} from '../../core/state';
import { getReactiveStateVersion } from '../stores.svelte';

export interface UseModalReturn {

  shake: () => void;

  bringToFront: () => void;

  isOpen: () => boolean;

  isMinimized: () => boolean;

  isRegistered: () => boolean;

  open: (sourceElement: HTMLElement) => void;

  close: () => void;

  minimize: () => void;

  restore: () => void;

  openChild: (childId: ModalId, sourceElement?: HTMLElement) => void;
}

export interface UseModalsReturn {

  getModals: () => Map<ModalId, ModalState>;

  getMinimizedCount: () => number;

  getOpenCount: () => number;
}

function assertRegistered(id: ModalId, method: string): void {
  if (!isModalRegistered(id)) {
    throw new Error(
      `Cannot call ${method}() on unregistered modal "${String(id)}". Ensure the Modal component is rendered.`
    );
  }
}

export function useModal(id: ModalId): UseModalReturn {
  return {
    shake: () => {
      assertRegistered(id, 'shake');
      triggerAttention(id);
    },
    bringToFront: () => {
      assertRegistered(id, 'bringToFront');
      bringToFront(id);
    },
    isOpen: () => isModalOpen(id),
    isMinimized: () => {
      getReactiveStateVersion();
      const state = getModalState(id);
      return state?.isMinimized ?? false;
    },
    isRegistered: () => isModalRegistered(id),
    open: (sourceElement: HTMLElement) => {
      assertRegistered(id, 'open');
      openModal(id, sourceElement);
    },
    close: () => {
      assertRegistered(id, 'close');
      closeModal(id);
    },
    minimize: () => {
      assertRegistered(id, 'minimize');
      minimizeModal(id);
    },
    restore: () => {
      assertRegistered(id, 'restore');
      restoreModal(id);
    },
    openChild: (childId: ModalId, sourceElement?: HTMLElement) => {
      assertRegistered(id, 'openChild');
      openChildModal(childId, id, sourceElement ?? document.body);
    },
  };
}

export function useModals(): UseModalsReturn {
  return {
    getModals: () => {
      getReactiveStateVersion();
      return getModalsStore();
    },
    getMinimizedCount: () => {
      getReactiveStateVersion();
      return Array.from(getModalsStore().values()).filter(m => m.isMinimized).length;
    },
    getOpenCount: () => {
      getReactiveStateVersion();
      return Array.from(getModalsStore().values()).filter(m => !m.isMinimized && m.isOpen).length;
    },
  };
}
