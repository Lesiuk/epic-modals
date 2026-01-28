import { CSS_CLASSES, DATA_ATTRIBUTES, RESIZE_DIRECTIONS } from '../core/utils/constants';
import {
  ModalController,
  type ComputedModalState,
  type ModalControllerOptions,
} from '../core/modal';
import { registerModal, unregisterModal, createModalRegistration } from '../core/state/registration';
import { bringToFront } from '../core/state';
import { createConfigHelper, type ModalConfigHelper } from '../core/config';
import type { ModalId, ModalGlow, ModalConfigOverrides, Position } from '../core/types';
import type { ResizeDirection } from '../core/behaviors/resize';

export interface VanillaModalOptions {

  id: ModalId;

  title: string;

  container: HTMLElement;

  icon?: string;

  iconElement?: HTMLElement;

  renderIcon?: (icon: string) => HTMLElement | null;

  config?: ModalConfigOverrides;

  maxWidth?: string;

  preferredHeight?: string;

  glow?: ModalGlow;

  closeOnEscape?: boolean;

  autoOpen?: boolean;

  openSourcePosition?: Position | null;

  onClose?: () => void;

  content?: HTMLElement;

  footer?: HTMLElement;
}

export class VanillaModal {
  private controller: ModalController;
  private dialogEl: HTMLElement;
  private headerEl: HTMLElement;
  private bodyEl: HTMLElement;
  private footerEl: HTMLElement | null = null;
  private resizeHandlesContainer: HTMLElement | null = null;
  private container: HTMLElement;
  private options: VanillaModalOptions;
  private configHelper: ModalConfigHelper;
  private unsubscribe: (() => void) | null = null;
  private abortController = new AbortController();

  constructor(options: VanillaModalOptions) {
    this.options = options;
    this.container = options.container;

    this.configHelper = createConfigHelper(options.config);

    registerModal(createModalRegistration({
      id: options.id,
      title: options.title,
      icon: options.icon,
      autoOpen: options.autoOpen ?? true,
      glow: options.glow,
    }));

    if (options.autoOpen ?? true) {
      bringToFront(options.id);
    }

    this.dialogEl = this.createDialogElement();
    this.headerEl = this.createHeaderElement();
    this.bodyEl = this.createBodyElement();

    if (options.footer) {
      this.footerEl = this.createFooterElement();
      this.footerEl.appendChild(options.footer);
    }

    if (this.configHelper.isFeatureEnabled('resize')) {
      this.resizeHandlesContainer = this.createResizeHandles();
    }

    this.dialogEl.appendChild(this.headerEl);
    this.dialogEl.appendChild(this.bodyEl);
    if (this.footerEl) {
      this.dialogEl.appendChild(this.footerEl);
    }
    if (this.resizeHandlesContainer) {
      this.dialogEl.appendChild(this.resizeHandlesContainer);
    }

    if (options.content) {
      this.bodyEl.appendChild(options.content);
    }

    const controllerOptions: ModalControllerOptions = {
      id: options.id,
      title: options.title,
      icon: options.icon,
      config: options.config,
      maxWidth: options.maxWidth,
      preferredHeight: options.preferredHeight,
      glow: options.glow,
      closeOnEscape: options.closeOnEscape ?? true,
      autoOpen: options.autoOpen ?? true,
      openSourcePosition: options.openSourcePosition,
      onClose: options.onClose,
      skipRegistration: true,
      configHelper: this.configHelper,
    };

    this.controller = new ModalController(controllerOptions);

    this.container.appendChild(this.dialogEl);

    this.controller.mount(this.dialogEl);

    this.unsubscribe = this.controller.subscribe((state) => {
      this.updateFromState(state);
    });

    this.updateFromState(this.controller.getState());

    this.setupEventHandlers();
  }

  update(options: Partial<VanillaModalOptions>): void {

    if (options.title !== undefined && options.title !== this.options.title) {
      this.options.title = options.title;
      const titleEl = this.headerEl.querySelector(`.${CSS_CLASSES.headerTitle}`);
      if (titleEl) {
        titleEl.textContent = options.title;
      }
    }

    if (options.content !== undefined) {
      this.options.content = options.content;
      this.bodyEl.innerHTML = '';
      this.bodyEl.appendChild(options.content);
    }

    if (options.footer !== undefined) {
      this.options.footer = options.footer;
      if (this.footerEl) {
        this.footerEl.innerHTML = '';
        this.footerEl.appendChild(options.footer);
      } else if (options.footer) {

        this.footerEl = this.createFooterElement();
        this.footerEl.appendChild(options.footer);

        if (this.resizeHandlesContainer) {
          this.dialogEl.insertBefore(this.footerEl, this.resizeHandlesContainer);
        } else {
          this.dialogEl.appendChild(this.footerEl);
        }
      }
    }

    this.controller.updateOptions({
      maxWidth: options.maxWidth,
      preferredHeight: options.preferredHeight,
      glow: options.glow,
      closeOnEscape: options.closeOnEscape,
    });

    if (options.maxWidth !== undefined) this.options.maxWidth = options.maxWidth;
    if (options.preferredHeight !== undefined) this.options.preferredHeight = options.preferredHeight;
    if (options.glow !== undefined) this.options.glow = options.glow;
    if (options.closeOnEscape !== undefined) this.options.closeOnEscape = options.closeOnEscape;
  }

  destroy(): void {
    this.abortController.abort();
    this.unsubscribe?.();
    this.controller.destroy();
    unregisterModal(this.options.id);
    this.dialogEl.remove();
  }

  private createDialogElement(): HTMLElement {
    const dialog = document.createElement('div');
    dialog.className = CSS_CLASSES.dialog;
    dialog.setAttribute(DATA_ATTRIBUTES.modalId, String(this.options.id));
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', `${this.options.id}-title`);
    dialog.setAttribute('tabindex', '-1');
    return dialog;
  }

  private createHeaderElement(): HTMLElement {
    const header = document.createElement('header');
    const draggable = this.configHelper.isFeatureEnabled('drag');
    const headerLayout = this.configHelper.getAppearance('headerLayout');
    const minimizable = this.configHelper.isFeatureEnabled('minimize');
    const minimizeDisabled = !this.configHelper.isFeatureEnabled('dock');
    const transparencyEnabled = this.configHelper.isFeatureEnabled('transparency');

    header.className = draggable
      ? `${CSS_CLASSES.header} ${CSS_CLASSES.headerDraggable}`
      : CSS_CLASSES.header;

    const iconElement = this.getIconElement();

    if (headerLayout === 'macos') {

      this.createMacOSHeader(header, iconElement, minimizable, minimizeDisabled, transparencyEnabled);
    } else {

      this.createWindowsHeader(header, iconElement, minimizable, minimizeDisabled, transparencyEnabled);
    }

    return header;
  }

  private getIconElement(): HTMLElement | null {
    if (this.options.iconElement) {
      return this.options.iconElement;
    }
    if (this.options.icon && this.options.renderIcon) {
      return this.options.renderIcon(this.options.icon);
    }
    return null;
  }

  private createMacOSHeader(
    header: HTMLElement,
    iconElement: HTMLElement | null,
    minimizable: boolean,
    minimizeDisabled: boolean,
    transparencyEnabled: boolean
  ): void {

    const trafficLights = document.createElement('div');
    trafficLights.className = CSS_CLASSES.headerTrafficLights;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = `${CSS_CLASSES.headerLight} ${CSS_CLASSES.headerLightClose}`;
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.setAttribute('data-control', 'close');
    trafficLights.appendChild(closeBtn);

    if (minimizable) {
      const minimizeBtn = document.createElement('button');
      minimizeBtn.type = 'button';
      minimizeBtn.className = `${CSS_CLASSES.headerLight} ${CSS_CLASSES.headerLightMinimize}${minimizeDisabled ? ` ${CSS_CLASSES.headerLightDisabled}` : ''}`;
      minimizeBtn.setAttribute('aria-label', 'Minimize');
      minimizeBtn.setAttribute('data-control', 'minimize');
      if (minimizeDisabled) {
        minimizeBtn.disabled = true;
        minimizeBtn.title = 'Enable dock to minimize';
      }
      trafficLights.appendChild(minimizeBtn);
    }

    if (transparencyEnabled) {
      const styleBtn = document.createElement('button');
      styleBtn.type = 'button';
      styleBtn.className = `${CSS_CLASSES.headerLight} ${CSS_CLASSES.headerLightStyle}`;
      styleBtn.setAttribute('aria-label', 'Toggle style');
      styleBtn.setAttribute('data-control', 'style');
      trafficLights.appendChild(styleBtn);
    }

    header.appendChild(trafficLights);

    const macCenter = document.createElement('div');
    macCenter.className = CSS_CLASSES.headerMacCenter;

    if (iconElement) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = CSS_CLASSES.headerIcon;
      iconWrapper.appendChild(iconElement);
      macCenter.appendChild(iconWrapper);
    }

    const titleGroup = document.createElement('div');
    titleGroup.className = CSS_CLASSES.headerTitleGroup;

    const title = document.createElement('h2');
    title.className = CSS_CLASSES.headerTitle;
    title.id = `${this.options.id}-title`;
    title.textContent = this.options.title;
    titleGroup.appendChild(title);

    macCenter.appendChild(titleGroup);
    header.appendChild(macCenter);

    const spacer = document.createElement('div');
    spacer.className = CSS_CLASSES.headerMacSpacer;
    header.appendChild(spacer);
  }

  private createWindowsHeader(
    header: HTMLElement,
    iconElement: HTMLElement | null,
    minimizable: boolean,
    minimizeDisabled: boolean,
    transparencyEnabled: boolean
  ): void {

    const titleGroup = document.createElement('div');
    titleGroup.className = CSS_CLASSES.headerTitleGroup;

    if (iconElement) {
      const iconWrapper = document.createElement('div');
      iconWrapper.className = CSS_CLASSES.headerIcon;
      iconWrapper.appendChild(iconElement);
      titleGroup.appendChild(iconWrapper);
    }

    const title = document.createElement('h2');
    title.className = CSS_CLASSES.headerTitle;
    title.id = `${this.options.id}-title`;
    title.textContent = this.options.title;
    titleGroup.appendChild(title);

    header.appendChild(titleGroup);

    const actions = document.createElement('div');
    actions.className = CSS_CLASSES.headerActions;

    if (transparencyEnabled) {
      const styleBtn = document.createElement('button');
      styleBtn.type = 'button';
      styleBtn.className = `${CSS_CLASSES.headerBtnWindows} ${CSS_CLASSES.headerBtnWindowsStyle}`;
      styleBtn.setAttribute('aria-label', 'Toggle style');
      styleBtn.setAttribute('data-control', 'style');
      styleBtn.innerHTML = '&#9671;';
      actions.appendChild(styleBtn);
    }

    if (minimizable) {
      const minimizeBtn = document.createElement('button');
      minimizeBtn.type = 'button';
      minimizeBtn.className = `${CSS_CLASSES.headerBtnWindows}${minimizeDisabled ? ` ${CSS_CLASSES.headerBtnWindowsDisabled}` : ''}`;
      minimizeBtn.setAttribute('aria-label', 'Minimize');
      minimizeBtn.setAttribute('data-control', 'minimize');
      minimizeBtn.innerHTML = '&#8211;';
      if (minimizeDisabled) {
        minimizeBtn.disabled = true;
        minimizeBtn.title = 'Enable dock to minimize';
      }
      actions.appendChild(minimizeBtn);
    }

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = `${CSS_CLASSES.headerBtnWindows} ${CSS_CLASSES.headerBtnWindowsClose}`;
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.setAttribute('data-control', 'close');
    closeBtn.innerHTML = '&times;';
    actions.appendChild(closeBtn);

    header.appendChild(actions);
  }

  private createBodyElement(): HTMLElement {
    const body = document.createElement('div');
    body.className = CSS_CLASSES.body;
    return body;
  }

  private createFooterElement(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = CSS_CLASSES.footer;
    return footer;
  }

  private createResizeHandles(): HTMLElement {
    const container = document.createElement('div');
    container.className = CSS_CLASSES.resizeHandles;
    container.setAttribute('role', 'group');
    container.setAttribute('aria-label', 'Resize handles');

    for (const direction of RESIZE_DIRECTIONS) {
      const handle = document.createElement('div');
      handle.className = `${CSS_CLASSES.resizeHandle} ${CSS_CLASSES.resizePrefix}${direction}`;
      handle.setAttribute('role', 'separator');
      handle.setAttribute('tabindex', '0');
      handle.setAttribute('aria-label', `Resize ${direction}`);
      handle.setAttribute('aria-orientation', direction === 'n' || direction === 's' ? 'horizontal' : 'vertical');
      handle.setAttribute(DATA_ATTRIBUTES.resizeDirection, direction);
      container.appendChild(handle);
    }

    return container;
  }

  private updateFromState(state: ComputedModalState): void {

    this.dialogEl.className = state.cssClasses.join(' ');

    this.updateStyles(state.style);

    this.dialogEl.setAttribute('data-state', state.dataState);
    this.dialogEl.setAttribute('data-animation-phase', state.dataAnimationPhase);
  }

  private updateStyles(style: Record<string, string | number>): void {
    for (const [key, value] of Object.entries(style)) {
      if (key.startsWith('--')) {

        this.dialogEl.style.setProperty(key, String(value));
      } else {

        this.dialogEl.style.setProperty(key, typeof value === 'number' ? String(value) : value);
      }
    }
  }

  private setupEventHandlers(): void {
    const signal = this.abortController.signal;
    const headerLayout = this.configHelper.getAppearance('headerLayout');

    const buttonSelector = headerLayout === 'macos'
      ? `.${CSS_CLASSES.headerLight}`
      : `.${CSS_CLASSES.headerBtnWindows}`;

    this.headerEl.addEventListener(
      'pointerdown',
      (e) => {
        if ((e.target as HTMLElement).closest(buttonSelector)) {
          return;
        }
        this.controller.startDrag(e);
      },
      { signal }
    );

    this.dialogEl.addEventListener(
      'pointermove',
      (e) => {
        this.controller.handlePointerMove(e);
      },
      { signal }
    );

    this.dialogEl.addEventListener(
      'pointerup',
      (e) => {
        this.controller.handlePointerUp(e);
      },
      { signal }
    );

    this.headerEl.addEventListener(
      'click',
      (e) => {
        const button = (e.target as HTMLElement).closest('button');
        if (!button) return;

        const control = button.getAttribute('data-control');
        if (control === 'close') {
          this.controller.close();
        } else if (control === 'minimize') {
          this.controller.minimize();
        } else if (control === 'style') {
          this.controller.toggleTransparency();
        }
      },
      { signal }
    );

    if (this.resizeHandlesContainer) {
      this.resizeHandlesContainer.addEventListener(
        'pointerdown',
        (e) => {
          const handle = (e.target as HTMLElement).closest(`.${CSS_CLASSES.resizeHandle}`);
          if (!handle) return;
          const direction = handle.getAttribute(DATA_ATTRIBUTES.resizeDirection);
          if (direction) {
            this.controller.startResize(e, direction as ResizeDirection);
          }
        },
        { signal }
      );
    }

    this.dialogEl.addEventListener(
      'keydown',
      (e) => {
        this.controller.handleKeyDown(e);
      },
      { signal }
    );

    this.dialogEl.addEventListener(
      'pointerdown',
      () => {
        this.controller.bringToFront();
      },
      { signal }
    );
  }
}
