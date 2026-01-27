import type { ModalId, AnimationTransform, Position } from '../types';
import {
  pendingMinimize,
  pendingOpen,
  pendingClose,
  pendingForceClose,
  pendingRestore,
  pendingChildRestore,
  pendingMinimizeWithParent,
  pendingAttention,
  activeAttention,
  setPendingMinimize,
  setPendingOpen,
  setPendingClose,
  setPendingForceClose,
  setPendingRestore,
  setPendingChildRestore,
  setPendingMinimizeWithParent,
  setPendingAttention,
  setActiveAttention,
  pendingMinimizeTarget,
  setPendingMinimizeTarget,
  openSourcePositions,
  pendingParentLink,
  setPendingParentLink,
  pendingParentAnimations,
} from './internal';

export function hasPendingMinimize(id: ModalId): boolean {
  return pendingMinimize.includes(id);
}

export function consumePendingMinimize(id: ModalId): AnimationTransform | null {
  setPendingMinimize(pendingMinimize.filter((m) => m !== id));
  const target = pendingMinimizeTarget;
  setPendingMinimizeTarget(null);
  return target;
}

export function hasPendingMinimizeWithParent(id: ModalId): boolean {
  return pendingMinimizeWithParent.includes(id);
}

export function consumePendingMinimizeWithParent(id: ModalId): void {
  setPendingMinimizeWithParent(pendingMinimizeWithParent.filter((m) => m !== id));
}

export function hasPendingOpen(id: ModalId): boolean {
  return pendingOpen.includes(id);
}

export function consumePendingOpen(id: ModalId): void {
  setPendingOpen(pendingOpen.filter((m) => m !== id));
}

export function hasPendingClose(id: ModalId): boolean {
  return pendingClose.includes(id);
}

export function consumePendingClose(id: ModalId): void {
  setPendingClose(pendingClose.filter((m) => m !== id));
}

export function hasPendingForceClose(id: ModalId): boolean {
  return pendingForceClose.includes(id);
}

export function consumePendingForceClose(id: ModalId): void {
  setPendingForceClose(pendingForceClose.filter((m) => m !== id));
}

export function hasPendingRestore(id: ModalId): boolean {
  return pendingRestore.includes(id);
}

export function consumePendingRestore(id: ModalId): void {
  setPendingRestore(pendingRestore.filter((m) => m !== id));
}

export function hasPendingChildRestore(id: ModalId): boolean {
  return pendingChildRestore.includes(id);
}

export function consumePendingChildRestore(id: ModalId): void {
  setPendingChildRestore(pendingChildRestore.filter((m) => m !== id));
}

export function hasPendingAttention(id: ModalId): boolean {
  return pendingAttention.includes(id);
}

export function consumePendingAttention(id: ModalId): void {
  setPendingAttention(pendingAttention.filter((m) => m !== id));
  if (!activeAttention.includes(id)) {
    setActiveAttention([...activeAttention, id]);
  }
}

export function clearActiveAttention(id: ModalId): void {
  setActiveAttention(activeAttention.filter((m) => m !== id));
}

export function hasPendingParentLinkFor(id: ModalId): boolean {
  return pendingParentLink?.childId === id;
}

export function hasPendingParentAnimation(id: ModalId): boolean {
  return pendingParentAnimations.has(id);
}

export function consumePendingParentAnimation(id: ModalId): Position | null {
  const target = pendingParentAnimations.get(id) ?? null;
  pendingParentAnimations.delete(id);
  return target;
}

export function storeOpenSourcePosition(id: ModalId, position: Position): void {
  openSourcePositions.set(id, position);
}

export function getOpenSourcePosition(id: ModalId): Position | null {
  return openSourcePositions.get(id) ?? null;
}

export function consumeOpenSourcePosition(id: ModalId): Position | null {
  const source = openSourcePositions.get(id) ?? null;
  openSourcePositions.delete(id);
  return source;
}

export function consumePendingMinimizeTarget(): AnimationTransform | null {
  const target = pendingMinimizeTarget;
  setPendingMinimizeTarget(null);
  return target;
}

export function consumePendingParentLink(modalId?: ModalId): { parentId: ModalId; childId: ModalId } | null {
  const link = pendingParentLink;
  if (modalId && link?.childId !== modalId) {
    return null;
  }
  setPendingParentLink(null);
  return link;
}
