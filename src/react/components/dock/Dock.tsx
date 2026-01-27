import React, { useState, useEffect, useRef, useCallback, useContext, type ReactNode } from 'react';
import {
  getModalsStore,
  subscribe,
} from '../../../core/state';
import { getLayerZIndex } from '../../../core/state/stacking';
import { CSS } from '../../../core/utils/constants';
import { getConfig, getConfigVersion } from '../../../core/config';
import {
  getMinimizedModals,
  calculateDockDragPosition,
  constrainDockPosition,
  getDockContainerClasses,
  getDockClasses,
} from '../../../core/utils/dock';
import { Portal } from '../Portal';
import { DockItem } from './DockItem';
import { ModalProviderConfigContext, RenderIconContext } from '../../context';

export interface DockProps {

  renderIcon?: (icon: string) => ReactNode;
}

export function Dock({ renderIcon: renderIconProp }: DockProps) {
  const contextRenderIcon = useContext(RenderIconContext);
  const providerConfig = useContext(ModalProviderConfigContext);
  const renderIcon = renderIconProp ?? contextRenderIcon;

  const [_stateVersion, setStateVersion] = useState(0);
  const [_configVersion, setConfigVersion] = useState(0);
  const [dockOrientation, _setDockOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [dockFreePosition, setDockFreePosition] = useState({ x: 100, y: 100 });
  const [isDockDragging, setIsDockDragging] = useState(false);

  const dockContainerRef = useRef<HTMLDivElement>(null);
  const dockDragOffsetRef = useRef({ x: 0, y: 0 });
  const activePointerIdRef = useRef<number | null>(null);

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setStateVersion(v => v + 1);
      setConfigVersion(getConfigVersion());
    });
    return unsubscribe;
  }, []);

  const config = getConfig();
  const dockZIndex = getLayerZIndex('DOCK');
  const dockPosition = providerConfig?.dock?.position ?? config.dock.position;
  const dockLabelMode = providerConfig?.dock?.labelMode ?? config.dock.labelMode;
  const dockEnabled = providerConfig?.features?.dock ?? config.features.dock;
  const portalTarget = providerConfig?.portalTarget ?? config.portalTarget;

  const modalsStore = getModalsStore();
  const minimizedModals = getMinimizedModals();

  const startDockDrag = useCallback((e: React.PointerEvent) => {
    if (dockPosition !== 'free') return;
    setIsDockDragging(true);
    activePointerIdRef.current = e.pointerId;
    dockDragOffsetRef.current = {
      x: e.clientX - dockFreePosition.x,
      y: e.clientY - dockFreePosition.y,
    };
    (e.currentTarget as HTMLElement)?.setPointerCapture(e.pointerId);
  }, [dockPosition, dockFreePosition]);

  useEffect(() => {
    if (!isDockDragging) return;

    const onDockDrag = (e: PointerEvent) => {
      if (e.pointerId !== activePointerIdRef.current || !dockContainerRef.current) return;
      const rect = dockContainerRef.current.getBoundingClientRect();
      const newPos = calculateDockDragPosition(
        e.clientX,
        e.clientY,
        dockDragOffsetRef.current,
        rect.width,
        rect.height
      );
      setDockFreePosition(newPos);
    };

    const stopDockDrag = (e: PointerEvent) => {
      if (e.pointerId !== activePointerIdRef.current) return;
      setIsDockDragging(false);
      activePointerIdRef.current = null;
    };

    window.addEventListener('pointermove', onDockDrag);
    window.addEventListener('pointerup', stopDockDrag);
    window.addEventListener('pointercancel', stopDockDrag);

    return () => {
      window.removeEventListener('pointermove', onDockDrag);
      window.removeEventListener('pointerup', stopDockDrag);
      window.removeEventListener('pointercancel', stopDockDrag);
    };
  }, [isDockDragging]);

  useEffect(() => {
    if (dockPosition !== 'free') return;

    const handleResize = () => {
      if (!dockContainerRef.current) return;
      const rect = dockContainerRef.current.getBoundingClientRect();
      const constrained = constrainDockPosition(dockFreePosition, rect.width, rect.height);
      if (constrained.x !== dockFreePosition.x || constrained.y !== dockFreePosition.y) {
        setDockFreePosition(constrained);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [dockPosition, dockFreePosition]);

  if (!dockEnabled) {
    return null;
  }

  const containerClassNames = getDockContainerClasses(dockPosition, minimizedModals.length === 0);
  const dockClassNames = getDockClasses(dockPosition, dockOrientation);

  const containerStyle: React.CSSProperties = {
    zIndex: dockZIndex,
    ...(dockPosition === 'free' ? { left: `${dockFreePosition.x}px`, top: `${dockFreePosition.y}px` } : {}),
  };

  return (
    <Portal target={portalTarget}>
      <div
        ref={dockContainerRef}
        className={containerClassNames}
        style={containerStyle}
        data-dock-container="true"
      >
        <div className={dockClassNames}>
          {dockPosition === 'free' && (
            <button
              type="button"
              className={`${CSS.dockHandle}${isDockDragging ? ` ${CSS.dockHandleDragging}` : ''}`}
              onPointerDown={startDockDrag}
              aria-label="Drag dock"
            />
          )}

          {minimizedModals.map((modal, i) => {
            const childModal = modal.lastChildId ? modalsStore.get(modal.lastChildId) : null;
            return (
              <DockItem
                key={String(modal.id)}
                modal={modal}
                childModal={childModal}
                labelMode={dockLabelMode}
                renderIcon={renderIcon ?? undefined}
                animationDelay={i * 50}
              />
            );
          })}
        </div>
      </div>
    </Portal>
  );
}
