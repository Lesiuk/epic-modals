export { default as Modal } from './svelte/components/modal/Modal.svelte';
export { default as ModalHeader } from './svelte/components/modal/ModalHeader.svelte';
export { default as ResizeHandles } from './svelte/components/modal/ResizeHandles.svelte';

export { default as WizardModal } from './svelte/components/wizard/WizardModal.svelte';
export { default as WizardStep } from './svelte/components/wizard/WizardStep.svelte';

export { default as Dock } from './svelte/components/dock/Dock.svelte';

export { default as Backdrop } from './svelte/components/Backdrop.svelte';
export { default as ModalProvider } from './svelte/components/ModalProvider.svelte';
export { default as Portal } from './svelte/components/Portal.svelte';

export { RENDER_ICON_CONTEXT, MODAL_ID_CONTEXT } from './svelte/context';

export * from './svelte/hooks';

export {
  openModal,
  closeModal,
  closeAllModals,
  minimizeModal,
  restoreModal,
  bringToFront,
  isModalOpen,
  isModalRegistered,
  isModalAnimating,
  getModalsStore,
  getStateVersion,
  getModalsToClose,
  openChildModal,
  restoreAllMinimizedModals,
  reorderDock,
  shakeElement,
  triggerAttention,
  toggleModalTransparency,
  setURLStateCallbacks,
  setRegistryFunctions,
  storeOpenSourcePosition,

  registerModal,
  linkModals,
  setModalAnimating,
  updateModalPosition,
} from './core/state';

export type { UseModalReturn } from './svelte/hooks/useModal.svelte';
export type { UseModalZIndexReturn } from './svelte/hooks/useModalZIndex.svelte';

export { getConfig, setConfig, resetConfig, getConfigVersion } from './core/config';
export type { ModalLibraryConfig, DockConfig, AnimationDurations, PositioningConfig, ParentChildConfig } from './core/config';

export { getReactiveStateVersion, getReactiveConfigVersion } from './svelte/stores.svelte';

export { screenCenter } from './core/utils/helpers';
