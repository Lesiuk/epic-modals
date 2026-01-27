import type { ModalId } from '../types';
import { toDataId, getModalDialogElement } from '../utils/helpers';
import {
  modals,
  transparentModals,
  pendingAttention,
  setPendingAttention,
  warnIfUnregistered,
  incrementVersion,
} from './internal';

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

  if (!pendingAttention.includes(id)) {
    setPendingAttention([...pendingAttention, id]);
    incrementVersion();
  }
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

export function startAttentionAnimation(_id: ModalId): void {

}

export function endAttentionAnimation(_id: ModalId): void {

}
