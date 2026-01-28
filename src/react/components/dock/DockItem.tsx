import React, { useContext, useCallback, type ReactNode } from 'react';
import { restoreModal } from '../../../core/state/minimize';
import { isModalAnimating, shakeElement } from '../../../core/state';
import { toDataId } from '../../../core/utils';
import { CSS } from '../../../core/utils/constants';
import type { ModalState } from '../../../core/types';
import { RenderIconContext } from '../../context';

export interface DockItemProps {

  modal: ModalState;

  childModal?: ModalState | null;

  labelMode?: 'beside' | 'below' | 'hidden';

  renderIcon?: (icon: string) => ReactNode;

  animationDelay?: number;
}

export function DockItem({
  modal,
  childModal,
  labelMode = 'beside',
  renderIcon: renderIconProp,
  animationDelay = 0,
}: DockItemProps) {

  const contextRenderIcon = useContext(RenderIconContext);
  const renderIcon = renderIconProp ?? contextRenderIcon;

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (isModalAnimating(modal.id)) {
      shakeElement(e.currentTarget);
    } else {
      restoreModal(modal.id);
    }
  }, [modal.id]);

  const dataId = toDataId(modal.id);
  const hasGlow = !!modal.glow;
  const hasChild = !!modal.lastChildId;

  const classNames = [
    CSS.dockItem,
    hasGlow && CSS.dockItemHasGlow,
    hasChild && CSS.dockItemHasChild,
    labelMode === 'beside' && CSS.dockItemLabelBeside,
    labelMode === 'below' && CSS.dockItemLabelBelow,
  ].filter(Boolean).join(' ');

  const style: React.CSSProperties = {
    ...(modal.glow ? { '--modal-dock-glow-color': modal.glow.color } as React.CSSProperties : {}),
    animationDelay: animationDelay > 0 ? `${animationDelay}ms` : undefined,
  };

  return (
    <button
      className={classNames}
      data-modal-id={dataId}
      aria-label={`Restore ${modal.title}`}
      onClick={handleClick}
      style={style}
    >
      <span className={CSS.dockItemIcon}>
        {modal.icon && renderIcon ? (
          renderIcon(modal.icon)
        ) : (
          <span className={CSS.dockItemIconPlaceholder}>
            {modal.title.charAt(0)}
          </span>
        )}
      </span>

      {labelMode !== 'hidden' && (
        <span className={CSS.dockItemLabel}>{modal.title}</span>
      )}

      <span className={CSS.dockItemGlow} />

      {hasChild && childModal && (
        <span className={CSS.dockChildIndicator}>
          {childModal.icon && renderIcon ? (
            renderIcon(childModal.icon)
          ) : (
            <span>+</span>
          )}
        </span>
      )}
    </button>
  );
}
