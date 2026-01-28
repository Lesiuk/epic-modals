import type { ModalId, Position } from '../types';
import { isModalRegistered } from '../state';

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

export function assertModalRegistered(id: ModalId, method: string): void {
  if (!isModalRegistered(id)) {
    throw new Error(
      `Cannot call ${method}() on unregistered modal "${String(id)}". Ensure the Modal component is rendered.`
    );
  }
}
