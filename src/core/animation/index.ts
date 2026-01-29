export { DURATIONS, EASINGS, TIMEOUT_SAFETY_MARGIN, type AnimationType } from './timing';
export {
  calculateMinimizeTransform,
  calculateRestoreTransform,
  calculateOpenTransform,
  transformToCSSVars,
  getDefaultDockTarget,
  getDockItemPosition,
} from './genie';
export {
  createAnimationController,
  type AnimationController,
  type AnimationState,
  type AnimationEvents,
  type AnimationControllerOptions,
} from './controller';
export { flipAnimate } from './flip';
