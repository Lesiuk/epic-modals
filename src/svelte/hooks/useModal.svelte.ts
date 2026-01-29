import type { ModalId, ModalState } from '../../core/types';
import {
  isModalOpen,
  isModalRegistered,
  getModalsStore,
  getModalState,
} from '../../core/state';
import { createModalOperations, type ModalOperations } from '../../core/modal-operations';
import { getReactiveStateVersion } from '../stores.svelte';

export interface UseModalReturn extends ModalOperations {

  isOpen: () => boolean;

  isMinimized: () => boolean;

  isRegistered: () => boolean;
}

export interface UseModalsReturn {
  getModals: () => Map<ModalId, ModalState>;
  getMinimizedCount: () => number;
  getOpenCount: () => number;
}

export function useModal(idOrGetter: ModalId | (() => ModalId)): UseModalReturn {
  const getId = typeof idOrGetter === 'function' ? idOrGetter : () => idOrGetter;
  const ops = createModalOperations(getId);

  return {
    ...ops,
    isOpen: () => {
      getReactiveStateVersion();
      return isModalOpen(getId());
    },
    isMinimized: () => {
      getReactiveStateVersion();
      return getModalState(getId())?.isMinimized ?? false;
    },
    isRegistered: () => isModalRegistered(getId()),
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
