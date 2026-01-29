import type { ModalId, Position } from '../types';
import { isModalRegistered } from '../state';

export const SYMBOL_PREFIX = '$s:';
const symbolIds = new Map<symbol, string>();
let symbolCounter = 0;

export function toDataId(id: ModalId): string {
  if (typeof id === 'string') return id;
  let dataId = symbolIds.get(id);
  if (!dataId) {
    const desc = id.description ?? 'modal';
    dataId = `${SYMBOL_PREFIX}${desc}-${symbolCounter++}`;
    symbolIds.set(id, dataId);
  }
  return dataId;
}

export function _resetSymbolIds(): void {
  symbolIds.clear();
  symbolCounter = 0;
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
