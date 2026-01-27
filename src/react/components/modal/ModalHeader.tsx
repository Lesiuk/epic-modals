import React, { useContext, type ReactNode } from 'react';
import type { ModalHeaderBaseProps } from '../../../core/types';
import { CSS } from '../../../core/utils/constants';
import { RenderIconContext } from '../../context';

export interface ModalHeaderProps extends ModalHeaderBaseProps {

  customIcon?: ReactNode;
  onStartDrag?: (e: React.PointerEvent) => void;
  onToggleStyle: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export function ModalHeader({
  title,
  customIcon,
  icon,
  isTransparent = false,
  titleId,
  headerLayout = 'macos',
  onStartDrag,
  onToggleStyle,
  onMinimize,
  onClose,
  minimizable = true,
  minimizeDisabled = false,
  transparencyEnabled = true,
}: ModalHeaderProps) {

  const renderIcon = useContext(RenderIconContext);

  const isMac = headerLayout === 'macos';

  function handleDragStart(e: React.PointerEvent) {

    if ((e.target as HTMLElement).closest('button')) return;
    onStartDrag?.(e);
  }

  const headerClasses = [
    CSS.header,
    onStartDrag && CSS.headerDraggable,
    isTransparent && 'transparent',
  ].filter(Boolean).join(' ');

  const renderedIcon = customIcon ?? (icon && renderIcon ? renderIcon(icon) : null);

  if (isMac) {

    return (
      <header className={headerClasses} onPointerDown={handleDragStart}>
        <div className={CSS.headerTrafficLights}>
          <button
            type="button"
            className={`${CSS.headerLight} ${CSS.headerLightClose}`}
            onClick={onClose}
            aria-label="Close"
          />
          {minimizable && (
            <button
              type="button"
              className={`${CSS.headerLight} ${CSS.headerLightMinimize}${minimizeDisabled ? ` ${CSS.headerLightDisabled}` : ''}`}
              onClick={minimizeDisabled ? undefined : onMinimize}
              disabled={minimizeDisabled}
              aria-label="Minimize"
              title={minimizeDisabled ? 'Enable dock to minimize' : undefined}
            />
          )}
          {transparencyEnabled && (
            <button
              type="button"
              className={`${CSS.headerLight} ${CSS.headerLightStyle}`}
              onClick={onToggleStyle}
              aria-label="Toggle style"
            />
          )}
        </div>

        <div className={CSS.headerMacCenter}>
          {renderedIcon && <div className={CSS.headerIcon}>{renderedIcon}</div>}
          <div className={CSS.headerTitleGroup}>
            {titleId ? (
              <h2 id={titleId} className={CSS.headerTitle}>{title}</h2>
            ) : (
              <h2 className={CSS.headerTitle}>{title}</h2>
            )}
          </div>
        </div>

        <div className={CSS.headerMacSpacer} />
      </header>
    );
  }

  return (
    <header className={headerClasses} onPointerDown={handleDragStart}>
      <div className={CSS.headerTitleGroup}>
        {renderedIcon && <div className={CSS.headerIcon}>{renderedIcon}</div>}
        {titleId ? (
          <h2 id={titleId} className={CSS.headerTitle}>{title}</h2>
        ) : (
          <h2 className={CSS.headerTitle}>{title}</h2>
        )}
      </div>

      <div className={CSS.headerActions}>
        {transparencyEnabled && (
          <button
            type="button"
            className={`${CSS.headerBtnWindows} ${CSS.headerBtnWindowsStyle}`}
            onClick={onToggleStyle}
            aria-label="Toggle style"
          >
            &#9671;
          </button>
        )}
        {minimizable && (
          <button
            type="button"
            className={`${CSS.headerBtnWindows}${minimizeDisabled ? ` ${CSS.headerBtnWindowsDisabled}` : ''}`}
            onClick={minimizeDisabled ? undefined : onMinimize}
            disabled={minimizeDisabled}
            aria-label="Minimize"
            title={minimizeDisabled ? 'Enable dock to minimize' : undefined}
          >
            &#8211;
          </button>
        )}
        <button
          type="button"
          className={`${CSS.headerBtnWindows} ${CSS.headerBtnWindowsClose}`}
          onClick={onClose}
          aria-label="Close"
        >
          &times;
        </button>
      </div>
    </header>
  );
}
