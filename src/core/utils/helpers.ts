import type { ModalId, Position } from '../types';

export function toDataId(id: ModalId): string {
  return id;
}

export function getModalDialogElement(id: ModalId): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(`.modal-dialog[data-modal-id="${toDataId(id)}"]`);
}

export function screenCenter(): Position {
  return {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  };
}
