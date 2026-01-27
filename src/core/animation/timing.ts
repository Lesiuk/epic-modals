export const DURATIONS = {
  minimize: 500,
  restore: 400,
  open: 400,
  close: 250,
  attention: 300,
  parentMove: 300,

  parentRetargetInterval: 100,
  centerAfterResize: 200,
  glowStabilize: 1000,
  overlayFade: 200,
} as const;

export const TIMEOUT_SAFETY_MARGIN = 100;

export const EASINGS = {

  easeOut: 'ease-out',

  easeOutCubic: 'cubic-bezier(0.25, 0.1, 0.25, 1)',

  linear: 'linear',

  easeInOut: 'ease-in-out',
} as const;

export type AnimationType = 'open' | 'close' | 'minimize' | 'restore' | 'attention' | 'none';

export function getDuration(type: AnimationType): number {
  switch (type) {
    case 'open': return DURATIONS.open;
    case 'close': return DURATIONS.close;
    case 'minimize': return DURATIONS.minimize;
    case 'restore': return DURATIONS.restore;
    case 'attention': return DURATIONS.attention;
    default: return 0;
  }
}

export function getEasing(type: AnimationType): string {
  switch (type) {
    case 'open':
    case 'restore':
      return EASINGS.easeOut;
    case 'close':
    case 'minimize':
      return EASINGS.easeOutCubic;
    case 'attention':
      return EASINGS.easeInOut;
    default:
      return EASINGS.linear;
  }
}
