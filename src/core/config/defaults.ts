import type { DockPosition, DockLabelMode, ModalFeatures, AppearanceConfig, DeepPartial, BackdropConfig } from '../types';
import { restoreAllMinimizedModals } from '../state';

export type { ModalFeatures, AppearanceConfig, BackdropConfig } from '../types';
export type { DeepPartial } from '../types';

export function normalizeBackdropConfig(backdrop: boolean | BackdropConfig): BackdropConfig {
  if (typeof backdrop === 'boolean') {
    return { visible: backdrop, blockClicks: backdrop };
  }
  return backdrop;
}

export interface DockConfig {

  position: DockPosition;

  labelMode: DockLabelMode;

  enableReorder: boolean;

  enableFreeDrag: boolean;
}

export interface AnimationDurations {

  open: number;

  close: number;

  minimize: number;

  restore: number;

  easing: string;
}

export interface ZIndexConfig {

  base: number;

  dock: number;

  toast: number;
}

export interface ParentChildConfig {

  movementMode: 'realtime' | 'animated';

  animationDuration: number;
}

export interface PositioningConfig {

  strategy: 'centered' | 'smart';

  modalGap: number;

  avoidElements: string[];
}

export interface ModalLibraryConfig {
  features: ModalFeatures;
  dock: DockConfig;
  animations: AnimationDurations;
  appearance: AppearanceConfig;
  zIndex: ZIndexConfig;
  parentChild: ParentChildConfig;
  positioning: PositioningConfig;

  portalTarget: string | HTMLElement;
}

export type PartialModalLibraryConfig = DeepPartial<ModalLibraryConfig>;

export const defaultConfig: ModalLibraryConfig = {
  features: {
    dock: true,
    minimize: true,
    transparency: true,
    resize: true,
    drag: true,
    focusTrap: true,
    animations: true,
    backdrop: true,
    parentChild: true,
  },
  dock: {
    position: 'bottom',
    labelMode: 'beside',
    enableReorder: true,
    enableFreeDrag: true,
  },
  animations: {
    open: 400,
    close: 250,
    minimize: 500,
    restore: 400,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
  appearance: {
    headerLayout: 'macos',
    defaultWidth: '480px',
    defaultHeight: 'auto',
    minWidth: 280,
    minHeight: 200,
  },
  zIndex: {
    base: 400,
    dock: 8000,
    toast: 9000,
  },
  parentChild: {
    movementMode: 'animated',
    animationDuration: 300,
  },
  positioning: {
    strategy: 'smart',
    modalGap: 16,
    avoidElements: [],
  },
  portalTarget: '#modal-portal',
};

let currentConfig: ModalLibraryConfig = { ...defaultConfig };

let configVersion = 0;

const configSubscribers = new Set<() => void>();

export function subscribeToConfig(callback: () => void): () => void {
  configSubscribers.add(callback);
  return () => configSubscribers.delete(callback);
}

function notifyConfigSubscribers() {
  configSubscribers.forEach(cb => cb());
}

export function getConfigVersion(): number {
  return configVersion;
}

export function getConfig(): ModalLibraryConfig {
  return currentConfig;
}

export function setConfig(config: PartialModalLibraryConfig): void {
  const prevConfig = currentConfig;
  currentConfig = mergeConfig(currentConfig, config);
  configVersion++;
  notifyConfigSubscribers();

  if (prevConfig.features.dock && !currentConfig.features.dock) {
    restoreAllMinimizedModals();
  }
}

export function resetConfig(): void {
  currentConfig = { ...defaultConfig };
  configVersion++;
  notifyConfigSubscribers();
}

export function mergeConfig(
  base: ModalLibraryConfig,
  override: PartialModalLibraryConfig
): ModalLibraryConfig {
  return {
    features: { ...base.features, ...override.features },
    dock: { ...base.dock, ...override.dock },
    animations: { ...base.animations, ...override.animations },
    appearance: { ...base.appearance, ...override.appearance },
    zIndex: { ...base.zIndex, ...override.zIndex },
    parentChild: { ...base.parentChild, ...override.parentChild },
    positioning: {
      ...base.positioning,
      ...override.positioning,

      avoidElements: override.positioning?.avoidElements as string[] ?? base.positioning.avoidElements,
    },
    portalTarget: (override.portalTarget ?? base.portalTarget) as string | HTMLElement,
  };
}

export function isFeatureEnabled(feature: keyof ModalFeatures): boolean {
  const value = currentConfig.features[feature];
  if (feature === 'backdrop') {
    const backdrop = normalizeBackdropConfig(value as boolean | BackdropConfig);
    return backdrop.visible || backdrop.blockClicks;
  }
  return value as boolean;
}

export interface ModalConfigHelper {
  isFeatureEnabled: (feature: keyof ModalFeatures) => boolean;
  getAppearance: <K extends keyof AppearanceConfig>(key: K) => AppearanceConfig[K];
  getPositioning: <K extends keyof PositioningConfig>(key: K) => PositioningConfig[K];
  getEffectiveConfig: () => ModalLibraryConfig;
}

export function createConfigHelper(
  modalConfig?: DeepPartial<{
    features?: Partial<ModalFeatures>;
    appearance?: Partial<AppearanceConfig>;
    positioning?: Partial<PositioningConfig>;
  }>,
  providerConfig?: PartialModalLibraryConfig
): ModalConfigHelper {
  const globalConfig = getConfig();

  const effectiveGlobalConfig = providerConfig
    ? mergeConfig(globalConfig, providerConfig)
    : globalConfig;

  return {
    isFeatureEnabled: (feature) => {

      if (modalConfig?.features?.[feature] !== undefined) {
        const value = modalConfig.features[feature];
        if (feature === 'backdrop') {
          const backdrop = normalizeBackdropConfig(value as boolean | BackdropConfig);
          return backdrop.visible || backdrop.blockClicks;
        }
        return value as boolean;
      }

      const value = effectiveGlobalConfig.features[feature];
      if (feature === 'backdrop') {
        const backdrop = normalizeBackdropConfig(value as boolean | BackdropConfig);
        return backdrop.visible || backdrop.blockClicks;
      }
      return value as boolean;
    },
    getAppearance: (key) => {

      if (modalConfig?.appearance?.[key] !== undefined) {
        return modalConfig.appearance[key] as AppearanceConfig[typeof key];
      }

      return effectiveGlobalConfig.appearance[key];
    },
    getPositioning: (key) => {

      if (modalConfig?.positioning?.[key] !== undefined) {
        return modalConfig.positioning[key] as PositioningConfig[typeof key];
      }

      return effectiveGlobalConfig.positioning[key];
    },
    getEffectiveConfig: () => effectiveGlobalConfig,
  };
}
