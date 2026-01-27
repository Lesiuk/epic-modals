export type {
  ModalBounds,
  ViewportConstraintOptions,
  SmartPositionOptions,
  ModalBoundsWithId,
  ModalLayoutInfo,
  SmartLayoutOptions,
  SmartLayoutResult,
} from './types';

export {
  constrainToViewport,
  constrainSizeToViewport,
} from './constraints';

export {
  calculateOverlap,
  calculateTotalOverlap,
  calculateMinDistance,
  getElementBounds,
} from './overlap';

export {
  calculateEqualSpaceLayout,
  computeAvailableArea,
  tryGridConfig,
  findLeastOverlapPosition,
  createCascadeLayout,
} from './smart-position';

export {
  calculateSmartLayout,
} from './smart-layout';
