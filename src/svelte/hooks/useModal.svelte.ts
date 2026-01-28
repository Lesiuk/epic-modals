import type { ModalId, ModalState } from '../../core/types';
import { openModal, closeModal, openChildModal } from '../../core/state/open-close';
import { minimizeModal, restoreModal } from '../../core/state/minimize';
import {
  triggerAttention,
  bringToFront,
  isModalOpen,
  isModalRegistered,
  getModalsStore,
  getModalState,
} from '../../core/state';
import { assertModalRegistered } from '../../core/utils/helpers';
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

export function useModal(idOrGetter: ModalId | (() => ModalId)): UseModalReturn {

  const getId = typeof idOrGetter === 'function' ? idOrGetter : () => idOrGetter;

  return {
    shake: () => {
      const id = getId();
      assertModalRegistered(id, 'shake');
      triggerAttention(id);
    },
    bringToFront: () => {
      const id = getId();
      assertModalRegistered(id, 'bringToFront');
      bringToFront(id);
    },
    isOpen: () => isModalOpen(getId()),
    isMinimized: () => {
      getReactiveStateVersion();
      const state = getModalState(getId());
      return state?.isMinimized ?? false;
    },
    isRegistered: () => isModalRegistered(getId()),
    open: (sourceElement: HTMLElement) => {
      const id = getId();
      assertModalRegistered(id, 'open');
      openModal(id, sourceElement);
    },
    close: () => {
      const id = getId();
      assertModalRegistered(id, 'close');
      closeModal(id);
    },
    minimize: () => {
      const id = getId();
      assertModalRegistered(id, 'minimize');
      minimizeModal(id);
    },
    restore: () => {
      const id = getId();
      assertModalRegistered(id, 'restore');
      restoreModal(id);
    },
    openChild: (childId: ModalId, sourceElement?: HTMLElement) => {
      const id = getId();
      assertModalRegistered(id, 'openChild');
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
