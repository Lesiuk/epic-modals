export * from './types';

export * from './config';

export * from './state';

export {

  CSS,
  CSS_CLASSES,
  DATA_ATTRS,
  DATA_ATTRIBUTES,
  RESIZE_DIRECTIONS,
  RESIZE_DIRECTION_LABELS,
  ANIMATION_DURATIONS,
  DEFAULTS,
  FOCUSABLE_SELECTORS,

  onAnimationEnd,
  setupAnimationEndListener,
  whenHasDimensions,
  ANIMATION_NAMES,

  constrainToViewport,
  constrainSizeToViewport,
  calculateOverlap,
  calculateTotalOverlap,
  calculateMinDistance,
  getElementBounds,
  calculateEqualSpaceLayout,
  calculateSmartLayout,
  computeAvailableArea,
  type ModalBounds,
  type ViewportConstraintOptions,
  type SmartPositionOptions,
  type ModalBoundsWithId,
  type ModalLayoutInfo,
  type SmartLayoutOptions,
  type SmartLayoutResult,

  toDataId,
  getModalDialogElement,
  screenCenter,

  getMinimizedModals,
  calculateDockDragPosition,
  constrainDockPosition,
  getDockContainerClasses,
  getDockClasses,

  isBackdropEnabled,
  hasOpenModals,
  getBackdropConfig,
} from './utils';

export * from './behaviors';

export * from './animation';

export * from './modal';
