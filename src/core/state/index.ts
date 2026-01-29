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
} from './store';

export {
  registerModal,
  unregisterModal,
  createModalRegistration,
  type CreateModalRegistrationProps,
} from './operations';

export {
  minimizeModal,
  restoreModal,
  restoreAllMinimizedModals,
  restoreChildModal,
  unhideChildModal,
  finalizeChildMinimize,
  hideChildWithParent,
  clearPendingParentAnimation,
} from './operations';

export {
  bringToFront,
  isTopModal,
  reorderDock,
} from './position';

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
} from './operations';

export { pending } from './pending-factory';
export type { PendingType, PendingStateManager } from './pending-factory';

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
} from './operations';

export {
  triggerRearrangement,
  applyLayoutPositions,
  handleWindowResize,
  initializeResizeListener,
  cleanupResizeListener,
} from './layout';

export {
  forEachDescendant,
  findRootParent,
  getAncestors,
  getHierarchyDepth,
  type ForEachDescendantOptions,
} from './hierarchy';

export {
  linkModals,
  getPendingParentLink,
  triggerCascadingParentAnimations,
  getPendingParentAnimation,
  calculateChildCenterPosition,
} from './parent-child';

export {
  initializeStacking,
  acquireModalZIndex,
  getLayerZIndex,
  resetStacking,
} from './parent-child';

export {
  createEventEmitter,
  type EventCallback,
  type EventEmitter,
} from './store';

export {
  validateModalId,
  validateSource,
  validateParentId,
} from './store';

export { setURLCallbacks as setURLStateCallbacks } from './store';
export { setRegistryCallbacksInternal as setRegistryFunctions } from './store';
