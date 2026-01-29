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

  easeOut: 'cubic-bezier(0.33, 0, 0.2, 1)',

  easeOutCubic: 'cubic-bezier(0.16, 1, 0.3, 1)',

  linear: 'linear',

  easeInOut: 'ease-in-out',
} as const;

export type AnimationType = 'open' | 'close' | 'minimize' | 'restore' | 'attention' | 'none';
