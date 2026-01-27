export {
  batchUpdates,
  getStateVersion,
  subscribe,
  setDockPositionGetterInternal,
  setRegistryCallbacksInternal,
  setURLCallbacks,
  _resetInternalState,
  _getInternalState,
  type URLStateCallbacks,
  type RegistryCallbacks,
  type DockPositionGetter,
} from './internal';

export {
  registerModal,
  unregisterModal,
  createModalRegistration,
  type CreateModalRegistrationProps,
} from './registration';

export {
  minimizeModal,
  restoreModal,
  restoreAllMinimizedModals,
  restoreChildModal,
  unhideChildModal,
  finalizeChildMinimize,
  hideChildWithParent,
  clearPendingParentAnimation,
} from './minimize';

export {
  bringToFront,
  isTopModal,
  reorderDock,
} from './zindex';

export {
  updateModalPosition,
  clearPositionAnimation,
  updateModalSize,
  updateModal,
} from './position';

export {
  openModal,
  openChildModal,
  createModal,
  closeModal,
  closeAllModals,
  finalizeModalClose,
  getModalsToClose,
  type OpenModalOptions,
} from './open-close';

export {
  hasPendingMinimize,
  consumePendingMinimize,
  hasPendingMinimizeWithParent,
  consumePendingMinimizeWithParent,
  hasPendingOpen,
  consumePendingOpen,
  hasPendingClose,
  consumePendingClose,
  hasPendingForceClose,
  consumePendingForceClose,
  hasPendingRestore,
  consumePendingRestore,
  hasPendingChildRestore,
  consumePendingChildRestore,
  hasPendingAttention,
  consumePendingAttention,
  clearActiveAttention,
  hasPendingParentLinkFor,
  hasPendingParentAnimation,
  consumePendingParentAnimation,
  storeOpenSourcePosition,
  getOpenSourcePosition,
  consumeOpenSourcePosition,
  consumePendingMinimizeTarget,
  consumePendingParentLink,
} from './pending';

export {
  getModalState,
  isModalOpen,
  isModalRegistered,
  isModalAnimating,
  setModalAnimating,
  getModalsStore,
  getDockOrder,
  getDockItemElement,
  getModalLayoutInfos,
  getOpenModalBounds,
  getOpenModalBoundsWithIds,
  getMinimizedModals,
} from './getters';

export {
  toggleModalTransparency,
  triggerAttention,
  shakeElement,
  triggerRejection,
  resetModalTransparency,
  startAttentionAnimation,
  endAttentionAnimation,
} from './effects';

export {
  triggerRearrangement,
  applyLayoutPositions,
  animateModalsToPositions,
  handleWindowResize,
  initializeResizeListener,
  cleanupResizeListener,
} from './layout';

export {
  linkModals,
  getPendingParentLink,
  triggerCascadingParentAnimations,
  getPendingParentAnimation,
  calculateChildCenterPosition,
} from './parent-child';

export * from './stacking';

export * from './events';

export { setURLCallbacks as setURLStateCallbacks } from './internal';
export { setRegistryCallbacksInternal as setRegistryFunctions } from './internal';
