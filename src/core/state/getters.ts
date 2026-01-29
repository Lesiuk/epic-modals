import type { ModalState, ModalId, Position } from '../types';
import type { ModalLayoutInfo, ModalBounds } from '../utils/viewport';
import { getModalDialogElement, toDataId } from '../utils/helpers';
import {
  modals,
  dockOrder,
  animatingModals,
  closingModals,
  getStateVersion,
  subscribe,
} from './store';

export { getStateVersion, subscribe };

export function getModalState(id: ModalId): ModalState | undefined {
  return modals.get(id);
}

export function isModalOpen(id: ModalId): boolean {
  const modal = modals.get(id);
  return modal?.isOpen ?? false;
}

export function isModalRegistered(id: ModalId): boolean {
  return modals.has(id);
}

export function isModalAnimating(id: ModalId): boolean {
  return animatingModals.has(id);
}

export function setModalAnimating(id: ModalId, animating: boolean): void {
  if (animating) {
    animatingModals.add(id);
  } else {
    animatingModals.delete(id);
  }
}

export function getModalsStore(): Map<ModalId, ModalState> {
  return modals;
}

export function getDockOrder(): ModalId[] {
  return dockOrder;
}

export function getDockItemElement(id: ModalId): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return document.querySelector(`[data-dock-item="${toDataId(id)}"]`);
}

export function getModalLayoutInfos(): ModalLayoutInfo[] {
  const result: ModalLayoutInfo[] = [];

  for (const modal of modals.values()) {
    if (!modal.isOpen || modal.isMinimized || modal.isHiddenWithParent) continue;

    if (closingModals.has(modal.id)) continue;

    const element = getModalDialogElement(modal.id);

    if (!element) continue;

    const position = modal.position ?? {
      x: element.getBoundingClientRect().left,
      y: element.getBoundingClientRect().top,
    };
    const size = modal.size ?? {
      width: element.offsetWidth,
      height: element.offsetHeight,
    };

    result.push({
      id: modal.id as string,
      width: size.width,
      height: size.height,
      currentPosition: position,
      parentId: modal.parentId as string | undefined,
    });
  }

  return result;
}

export function getOpenModalBounds(excludeId?: ModalId): ModalBounds[] {
  const bounds: ModalBounds[] = [];

  for (const modal of modals.values()) {
    if (!modal.isOpen || modal.isMinimized || modal.isHiddenWithParent) continue;
    if (excludeId && modal.id === excludeId) continue;

    if (modal.position && modal.size) {
      bounds.push({
        x: modal.position.x,
        y: modal.position.y,
        width: modal.size.width,
        height: modal.size.height,
      });
    } else {
      const element = getModalDialogElement(modal.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        bounds.push({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  }

  return bounds;
}

export function getMinimizedModals(): ModalState[] {
  return dockOrder
    .map((id) => modals.get(id))
    .filter((m): m is ModalState => m !== undefined && m.isMinimized);
}

export function getOpenSourcePositionFromState(id: ModalId): Position | null {
  const modal = modals.get(id);
  if (!modal) return null;

  return modal.position;
}

export function getOpenModalBoundsWithIds(excludeId?: ModalId): Array<{ id: string; x: number; y: number; width: number; height: number }> {
  const bounds: Array<{ id: string; x: number; y: number; width: number; height: number }> = [];

  for (const modal of modals.values()) {
    if (!modal.isOpen || modal.isMinimized || modal.isHiddenWithParent) continue;
    if (excludeId && modal.id === excludeId) continue;

    if (modal.position && modal.size) {
      bounds.push({
        id: modal.id as string,
        x: modal.position.x,
        y: modal.position.y,
        width: modal.size.width,
        height: modal.size.height,
      });
    } else {
      const element = getModalDialogElement(modal.id);
      if (element) {
        const rect = element.getBoundingClientRect();
        bounds.push({
          id: modal.id as string,
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      }
    }
  }

  return bounds;
}
