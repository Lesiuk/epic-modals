export const CSS = {

  modal: 'modal-dialog',
  modalDragging: 'modal-dragging',
  modalResizing: 'modal-resizing',
  modalPositioned: 'modal-positioned',
  modalMinimizing: 'modal-minimizing',
  modalRestoring: 'modal-restoring',
  modalOpening: 'modal-opening',
  modalClosing: 'modal-closing',
  modalCentered: 'modal-centered',
  modalSolid: 'modal-solid',
  modalTransparent: 'modal-transparent',
  modalGlow: 'modal-glow',
  modalHasGlow: 'modal-has-glow',
  modalHasChild: 'modal-has-child',
  modalIsChild: 'modal-is-child',
  modalWasRestored: 'modal-was-restored',
  modalVisibleByAnimation: 'modal-visible-by-animation',
  modalAwaitingRestore: 'modal-awaiting-restore',
  modalAwaitingChildOpen: 'modal-awaiting-child-open',
  modalAnimatingToCenter: 'modal-animating-to-center',
  modalAnimatingPosition: 'modal-animating-position',
  modalAttention: 'modal-attention',
  modalGlowStabilizing: 'modal-glow-stabilizing',

  header: 'modal-header',
  headerDraggable: 'modal-header-draggable',
  body: 'modal-body',
  footer: 'modal-footer',
  childOverlay: 'modal-child-overlay',
  overlayClosing: 'modal-overlay-closing',

  headerTitle: 'modal-header-title',
  headerIcon: 'modal-header-icon',
  headerTitleGroup: 'modal-header-title-group',
  headerActions: 'modal-header-actions',

  headerTrafficLights: 'modal-header-traffic-lights',
  headerLight: 'modal-header-light',
  headerLightClose: 'modal-header-light-close',
  headerLightMinimize: 'modal-header-light-minimize',
  headerLightStyle: 'modal-header-light-style',
  headerLightDisabled: 'modal-header-light-disabled',
  headerMacCenter: 'modal-header-mac-center',
  headerMacSpacer: 'modal-header-mac-spacer',

  headerBtnWindows: 'modal-header-btn-windows',
  headerBtnWindowsClose: 'modal-header-btn-windows-close',
  headerBtnWindowsStyle: 'modal-header-btn-windows-style',
  headerBtnWindowsDisabled: 'modal-header-btn-windows-disabled',

  resizeHandles: 'modal-resize-handles',
  resizeHandle: 'modal-resize-handle',
  resizeN: 'modal-resize-n',
  resizeS: 'modal-resize-s',
  resizeE: 'modal-resize-e',
  resizeW: 'modal-resize-w',
  resizeNE: 'modal-resize-ne',
  resizeNW: 'modal-resize-nw',
  resizeSE: 'modal-resize-se',
  resizeSW: 'modal-resize-sw',
  resizePrefix: 'modal-resize-',

  dock: 'modal-dock',
  dockContainer: 'modal-dock-container',
  dockItem: 'modal-dock-item',
  dockItemActive: 'modal-dock-item-active',
  dockItemHasGlow: 'modal-dock-item-has-glow',
  dockItemHasChild: 'modal-dock-item-has-child',
  dockItemLabelBeside: 'modal-dock-item-label-beside',
  dockItemLabelBelow: 'modal-dock-item-label-below',
  dockItemIcon: 'modal-dock-item-icon',
  dockItemIconPlaceholder: 'modal-dock-item-icon-placeholder',
  dockItemLabel: 'modal-dock-item-label',
  dockItemGlow: 'modal-dock-item-glow',
  dockChildIndicator: 'modal-dock-child-indicator',
  dockHandle: 'modal-dock-handle',
  dockHandleDragging: 'modal-dock-handle-dragging',
  dockLeft: 'modal-dock-left',
  dockRight: 'modal-dock-right',
  dockBottom: 'modal-dock-bottom',
  dockFree: 'modal-dock-free',
  dockEmpty: 'modal-dock-empty',
  dockFreeHorizontal: 'modal-dock-free-horizontal',
  dockFreeVertical: 'modal-dock-free-vertical',

  backdrop: 'modal-backdrop',
  backdropVisible: 'modal-backdrop-visible',

  srOnly: 'sr-only',

  reactBodyContent: 'react-modal-body-content',
  reactFooterContent: 'react-modal-footer-content',
} as const;

export const DATA_ATTRS = {
  modalId: 'data-modal-id',
  dockContainer: 'data-dock-container',
  resizeDir: 'data-resize-dir',
  modalBridge: 'data-modal-bridge',
} as const;

export const RESIZE_DIRECTIONS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;
export type ResizeDirection = typeof RESIZE_DIRECTIONS[number];

export const RESIZE_DIRECTION_LABELS: Record<ResizeDirection, string> = {
  n: 'Resize north',
  s: 'Resize south',
  e: 'Resize east',
  w: 'Resize west',
  ne: 'Resize northeast',
  nw: 'Resize northwest',
  se: 'Resize southeast',
  sw: 'Resize southwest',
};

export const ANIMATION_DURATIONS = {
  minimize: 500,
  restore: 400,
  open: 400,
  close: 250,
  overlay: 200,
  centerAfterResize: 200,
  glowStabilize: 1000,
} as const;

export const DEFAULTS = {
  minWidth: 280,
  minHeight: 200,
  maxWidth: '600px',
  zIndexBase: 1000,
} as const;

export const FOCUSABLE_SELECTORS = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');
