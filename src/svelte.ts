export { default as Modal } from './svelte/components/modal/Modal.svelte';
export { default as ModalProvider } from './svelte/components/ModalProvider.svelte';
export { default as Dock } from './svelte/components/dock/Dock.svelte';
export { default as Backdrop } from './svelte/components/Backdrop.svelte';
export { default as WizardModal } from './svelte/components/wizard/WizardModal.svelte';
export { default as WizardStep } from './svelte/components/wizard/WizardStep.svelte';
export { default as Portal } from './svelte/components/Portal.svelte';

export { useModal } from './svelte/hooks/useModal.svelte';
export { useModalZIndex } from './svelte/hooks/useModalZIndex.svelte';

export { openModal, closeModal, openChildModal, triggerAttention } from './core/state';

export { setConfig, getConfig } from './core/config';

export type { ModalId, DockPosition, DockLabelMode, HeaderLayout } from './core/types';
