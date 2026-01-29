import type { ModalId, ModalState } from '../types';
import { modals } from './store';

export interface ForEachDescendantOptions {

  useLastChildId?: boolean;

  postOrder?: boolean;
}

export function forEachDescendant(
  parentId: ModalId,
  callback: (childId: ModalId, child: ModalState, depth: number) => void,
  options: ForEachDescendantOptions = {}
): void {
  const { useLastChildId = false, postOrder = false } = options;

  function traverse(id: ModalId, depth: number): void {
    const modal = modals.get(id);
    if (!modal) return;

    const childId = useLastChildId
      ? (modal.lastChildId || modal.childId)
      : modal.childId;

    if (!childId) return;

    const child = modals.get(childId);
    if (!child) return;

    if (!postOrder) {
      callback(childId, child, depth);
    }

    traverse(childId, depth + 1);

    if (postOrder) {
      callback(childId, child, depth);
    }
  }

  traverse(parentId, 0);
}

export function findRootParent(id: ModalId): ModalId {
  let current = id;
  let modal = modals.get(current);

  while (modal?.parentId) {
    current = modal.parentId;
    modal = modals.get(current);
  }

  return current;
}

export function getAncestors(id: ModalId): ModalId[] {
  const ancestors: ModalId[] = [];
  let modal = modals.get(id);

  while (modal?.parentId) {
    ancestors.push(modal.parentId);
    modal = modals.get(modal.parentId);
  }

  return ancestors;
}

export function getHierarchyDepth(id: ModalId): number {
  return getAncestors(id).length;
}
