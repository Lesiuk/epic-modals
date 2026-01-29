import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import type { BaseModalProps } from '../../../core/types';
import type { ModalLibraryConfig } from '../../../core/config';
import type { ResizeDirection } from '../../../core/behaviors/resize';
import { CSS } from '../../../core/utils/constants';
import { toDataId } from '../../../core/utils/helpers';
import { ModalController, type ComputedModalState } from '../../../core/modal';
import { bringToFront, isTopModal } from '../../../core/state';
import { Portal } from '../Portal';
import { ModalHeader } from './ModalHeader';
import { ResizeHandles } from './ResizeHandles';
import { useModalConfig } from '../../hooks/useConfig';
import { ModalProviderConfigContext, ModalIdContext } from '../../context';

function kebabToCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function toReactStyle(style: Record<string, string | number>): React.CSSProperties {
  const result: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(style)) {

    if (key.startsWith('--')) {
      result[key] = value;
    } else {
      result[kebabToCamelCase(key)] = value;
    }
  }
  return result as React.CSSProperties;
}

export interface ModalInnerProps extends BaseModalProps {

  renderIcon?: () => ReactNode;

  providerConfig?: Partial<ModalLibraryConfig>;

  children?: ReactNode;

  footer?: ReactNode;

  skipRegistration?: boolean;
}

const INITIAL_STATE: ComputedModalState = {
  position: { x: 0, y: 0 },
  size: { width: 0, height: 0 },
  zIndex: 1000,
  isDragging: false,
  isResizing: false,
  hasBeenDragged: false,
  hasBeenResized: false,
  isMinimizing: false,
  isRestoring: false,
  isOpening: false,
  isClosing: false,
  isAnyAnimating: false,
  animationTransform: null,
  isVisible: false,
  showCentered: false,
  isAwaitingRestore: false,
  isAwaitingChildOpen: false,
  isVisibleByAnimation: false,
  hasChild: false,
  isChildModal: false,
  showOverlay: false,
  isTransparent: false,
  isAttentionAnimating: false,
  glowStabilizing: false,
  isAnimatingPosition: false,
  isAnimatingToCenter: false,
  wasRestored: false,
  overlayClosing: false,
  glowEnabled: false,
  draggable: true,
  resizable: true,
  minimizable: true,
  dataState: 'closed',
  dataAnimationPhase: 'none',
  style: {},
  cssClasses: [CSS.modal],
};

export function ModalInner({
  id,
  title,
  renderIcon,
  icon,
  description,
  maxWidth = '600px',
  preferredHeight,
  autoOpen = false,
  openSourcePosition: propOpenSourcePosition,
  glow,
  config: modalConfig,
  providerConfig: propProviderConfig,
  closeOnEscape = true,
  onClose,
  children,
  footer,
  skipRegistration = false,
}: ModalInnerProps) {

  const modalRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<ModalController | null>(null);

  const contextProviderConfig = useContext(ModalProviderConfigContext);
  const providerConfig = propProviderConfig ?? contextProviderConfig;

  const configHelper = useModalConfig({
    modalConfig,
  });

  const portalTarget = configHelper.getEffectiveConfig().portalTarget;
  const minimizeDisabled = !configHelper.isFeatureEnabled('dock');
  const transparencyEnabled = configHelper.isFeatureEnabled('transparency');
  const headerLayout = configHelper.getAppearance('headerLayout');

  const [state, setState] = useState<ComputedModalState>(INITIAL_STATE);

  const dataId = toDataId(id);
  const titleId = `modal-title-${dataId}`;
  const descriptionId = description ? `modal-desc-${dataId}` : undefined;

  useEffect(() => {
    const controller = new ModalController({
      id,
      title,
      icon,
      config: modalConfig,
      providerConfig,
      maxWidth,
      preferredHeight,
      glow,
      closeOnEscape,
      autoOpen,
      openSourcePosition: propOpenSourcePosition,
      onClose,
      skipRegistration,
      configHelper,
    });
    controllerRef.current = controller;

    const unsubscribe = controller.subscribe((newState) => {
      setState(newState);
    });

    setState(controller.getState());

    return () => {
      unsubscribe();
      controller.destroy();
      controllerRef.current = null;
    };
  }, [id]);

  useEffect(() => {
    if (modalRef.current && controllerRef.current && state.isVisible) {
      controllerRef.current.mount(modalRef.current);
    }
  }, [state.isVisible]);

  useEffect(() => {
    controllerRef.current?.updateOptions({ glow, maxWidth, preferredHeight, closeOnEscape });
  }, [glow, maxWidth, preferredHeight, closeOnEscape]);

  const isVisibleRef = useRef(state.isVisible);
  isVisibleRef.current = state.isVisible;

  useEffect(() => {
    if (!closeOnEscape) return;

    const handleGlobalEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key !== 'Escape') return;

      if (!isVisibleRef.current) return;

      if ((e as unknown as { _modalEscapeHandled?: boolean })._modalEscapeHandled) return;

      if (controllerRef.current && isTopModal(id)) {
        controllerRef.current.handleKeyDown(e);

        (e as unknown as { _modalEscapeHandled?: boolean })._modalEscapeHandled = true;
      }
    };

    document.addEventListener('keydown', handleGlobalEscape, true);
    return () => document.removeEventListener('keydown', handleGlobalEscape, true);
  }, [closeOnEscape, id]);

  useEffect(() => {
    if (controllerRef.current && propOpenSourcePosition !== undefined) {
      controllerRef.current.setOpenSourcePosition(propOpenSourcePosition);
    }
  }, [propOpenSourcePosition]);

  const handleDragStart = useCallback((e: ReactPointerEvent) => {
    controllerRef.current?.startDrag(e.nativeEvent);
  }, []);

  const handlePointerMove = useCallback((e: ReactPointerEvent) => {
    controllerRef.current?.handlePointerMove(e.nativeEvent);
  }, []);

  const handlePointerUp = useCallback((e: ReactPointerEvent) => {
    controllerRef.current?.handlePointerUp(e.nativeEvent);
  }, []);

  const handleKeyDown = useCallback((e: ReactKeyboardEvent) => {
    controllerRef.current?.handleKeyDown(e.nativeEvent);
  }, []);

  const handleMinimize = useCallback(() => {
    controllerRef.current?.minimize();
  }, []);

  const handleClose = useCallback(() => {
    controllerRef.current?.close();
  }, []);

  const handleToggleStyle = useCallback(() => {
    controllerRef.current?.toggleTransparency();
  }, []);

  const handleResizeStart = useCallback((e: React.PointerEvent, direction: ResizeDirection) => {
    controllerRef.current?.startResize(e.nativeEvent, direction);
  }, []);

  const reactStyle = useMemo(() => toReactStyle(state.style), [state.style]);

  if (!state.isVisible) {
    return null;
  }

  return (
    <Portal target={portalTarget}>
      <ModalIdContext.Provider value={id}>
        <div
          ref={modalRef}
          className={state.cssClasses.join(' ')}
          data-modal-id={dataId}
          data-state={state.dataState}
          data-animation-phase={state.dataAnimationPhase}
          style={reactStyle}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerDownCapture={() => bringToFront(id)}
        >
          {description && (
            <span id={descriptionId} className="sr-only">{description}</span>
          )}

          <ModalHeader
            title={title}
            customIcon={renderIcon?.()}
            icon={icon}
            isTransparent={state.isTransparent}
            titleId={titleId}
            headerLayout={headerLayout}
            onStartDrag={state.draggable ? handleDragStart : undefined}
            onToggleStyle={handleToggleStyle}
            onMinimize={handleMinimize}
            onClose={handleClose}
            minimizable={state.minimizable}
            minimizeDisabled={minimizeDisabled}
            transparencyEnabled={transparencyEnabled}
          />

          <div className={CSS.body}>
            {children}
          </div>

          {footer && (
            <div className={CSS.footer}>
              {footer}
            </div>
          )}

          <ResizeHandles
            onStartResize={state.resizable && !state.hasChild ? handleResizeStart : undefined}
          />

          {state.showOverlay && (
            <div
              className={`${CSS.childOverlay}${state.overlayClosing ? ` ${CSS.overlayClosing}` : ''}`}
            />
          )}
        </div>
      </ModalIdContext.Provider>
    </Portal>
  );
}
