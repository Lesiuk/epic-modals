import type { ModalId } from '../types';

export type PendingType =
  | 'minimize'
  | 'open'
  | 'close'
  | 'forceClose'
  | 'restore'
  | 'childRestore'
  | 'minimizeWithParent'
  | 'attention';

export interface PendingStateManager {

  has: (type: PendingType, id: ModalId) => boolean;

  add: (type: PendingType, id: ModalId) => void;

  consume: (type: PendingType, id: ModalId) => boolean;

  clear: (type: PendingType) => void;

  reset: () => void;
}

export function createPendingStateManager(): PendingStateManager {
  const states = new Map<PendingType, Set<ModalId>>();

  const getSet = (type: PendingType): Set<ModalId> => {
    let set = states.get(type);
    if (!set) {
      set = new Set();
      states.set(type, set);
    }
    return set;
  };

  return {
    has: (type, id) => getSet(type).has(id),
    add: (type, id) => { getSet(type).add(id); },
    consume: (type, id) => getSet(type).delete(id),
    clear: (type) => { states.delete(type); },
    reset: () => { states.clear(); },
  };
}

export const pending = createPendingStateManager();
