export * from './types';

export {

  type DockConfig,
  type AnimationDurations,
  type ZIndexConfig,
  type ParentChildConfig,
  type PositioningConfig,
  type ModalLibraryConfig,
  type PartialModalLibraryConfig,

  getConfig,
  setConfig,
  resetConfig,
  isFeatureEnabled,

  defaultConfig,
} from './config';

export {

  openModal,
  closeModal,
  closeAllModals,
  createModal,

  minimizeModal,
  restoreModal,
  restoreAllMinimizedModals,

  getModalState,
  isModalOpen,
  isModalRegistered,

  bringToFront,
  isTopModal,

  updateModalPosition,
  updateModalSize,

  triggerAttention,

  type OpenModalOptions,
} from './state';

export {
  CSS,
  DATA_ATTRS,
} from './utils';

export {
  screenCenter,
} from './utils';
