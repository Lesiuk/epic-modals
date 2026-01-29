import type { ModalId } from './types';
import { openModal, closeModal, openChildModal } from './state/operations';
import { minimizeModal, restoreModal } from './state/operations';
import { triggerAttention, bringToFront } from './state';
import { assertModalRegistered } from './utils/helpers';

export interface ModalOperations {

  open: (sourceElement: HTMLElement) => void;

  close: () => void;

  minimize: () => void;

  restore: () => void;

  openChild: (childId: ModalId, sourceElement?: HTMLElement) => void;

  shake: () => void;

  bringToFront: () => void;
}

export function createModalOperations(getId: () => ModalId): ModalOperations {
  return {
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
  };
}
