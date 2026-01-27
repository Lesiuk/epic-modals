import { getContext } from 'svelte';
import type { ModalId } from '../../core/types';
import { getModalState } from '../../core/state';
import { getConfig } from '../../core/config';
import { MODAL_ID_CONTEXT } from '../context';

export interface UseModalZIndexReturn {

  zIndex: number;

  portalTarget: string | HTMLElement;
}

export function useModalZIndex(modalId?: ModalId): UseModalZIndexReturn {

  const contextId = getContext<ModalId | undefined>(MODAL_ID_CONTEXT);
  const resolvedId = modalId ?? contextId;

  if (!resolvedId) {
    throw new Error(
      'useModalZIndex: No modal ID provided and no modal context found. ' +
      'Either pass a modal ID or use this hook inside a Modal component.'
    );
  }

  return {
    get zIndex() {
      const modal = getModalState(resolvedId);

      return (modal?.zIndex ?? getConfig().zIndex.base) + 1;
    },
    get portalTarget() {
      return getConfig().portalTarget;
    },
  };
}
