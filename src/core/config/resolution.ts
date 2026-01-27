import type {
  ModalLibraryConfig,
  ModalFeatures,
  AppearanceConfig,
  AnimationDurations,
  PositioningConfig,
  ParentChildConfig,
  BackdropConfig,
  PartialModalLibraryConfig,
} from './defaults';
import { getConfig, mergeConfig, normalizeBackdropConfig } from './defaults';
import type { ModalConfigOverrides } from '../types';

export interface ConfigResolverOptions {

  getModalConfig: () => ModalConfigOverrides | undefined;

  getProviderConfig: () => PartialModalLibraryConfig | undefined;
}

export interface ConfigResolver {

  getEffectiveConfig: () => ModalLibraryConfig;

  isFeatureEnabled: (feature: keyof ModalFeatures) => boolean;

  getAppearance: <K extends keyof AppearanceConfig>(key: K) => AppearanceConfig[K];

  getAnimation: <K extends keyof AnimationDurations>(key: K) => AnimationDurations[K];

  getPositioning: <K extends keyof PositioningConfig>(key: K) => PositioningConfig[K];

  getParentChild: <K extends keyof ParentChildConfig>(key: K) => ParentChildConfig[K];
}

export function createConfigResolver(options: ConfigResolverOptions): ConfigResolver {
  const { getModalConfig, getProviderConfig } = options;

  function getEffectiveConfig(): ModalLibraryConfig {
    const globalConfig = getConfig();
    const providerConfig = getProviderConfig();
    const modalConfig = getModalConfig();

    let effective = globalConfig;

    if (providerConfig) {
      effective = mergeConfig(effective, providerConfig);
    }

    if (modalConfig) {
      effective = {
        ...effective,
        features: { ...effective.features, ...modalConfig.features },
        appearance: { ...effective.appearance, ...modalConfig.appearance },
        animations: { ...effective.animations, ...modalConfig.animations },
        positioning: { ...effective.positioning, ...modalConfig.positioning } as PositioningConfig,
        parentChild: { ...effective.parentChild, ...modalConfig.parentChild },
      };
    }

    return effective;
  }

  function isFeatureEnabled(feature: keyof ModalFeatures): boolean {
    const modalConfig = getModalConfig();
    const providerConfig = getProviderConfig();

    const toBoolean = (value: boolean | BackdropConfig | undefined): boolean | undefined => {
      if (value === undefined) return undefined;
      if (feature === 'backdrop' && typeof value === 'object') {
        const backdrop = normalizeBackdropConfig(value);
        return backdrop.visible || backdrop.blockClicks;
      }
      return value as boolean;
    };

    const modalValue = toBoolean(modalConfig?.features?.[feature]);
    if (modalValue !== undefined) {
      return modalValue;
    }

    const providerValue = toBoolean(providerConfig?.features?.[feature]);
    if (providerValue !== undefined) {
      return providerValue;
    }

    const globalValue = getConfig().features[feature];
    return toBoolean(globalValue) ?? false;
  }

  function getAppearance<K extends keyof AppearanceConfig>(key: K): AppearanceConfig[K] {
    const modalConfig = getModalConfig();
    const providerConfig = getProviderConfig();

    if (modalConfig?.appearance?.[key] !== undefined) {
      return modalConfig.appearance[key] as AppearanceConfig[K];
    }

    if (providerConfig?.appearance?.[key] !== undefined) {
      return providerConfig.appearance[key] as AppearanceConfig[K];
    }

    return getConfig().appearance[key];
  }

  function getAnimation<K extends keyof AnimationDurations>(key: K): AnimationDurations[K] {
    const modalConfig = getModalConfig();
    const providerConfig = getProviderConfig();

    if (modalConfig?.animations?.[key] !== undefined) {
      return modalConfig.animations[key] as AnimationDurations[K];
    }

    if (providerConfig?.animations?.[key] !== undefined) {
      return providerConfig.animations[key] as AnimationDurations[K];
    }

    return getConfig().animations[key];
  }

  function getPositioning<K extends keyof PositioningConfig>(key: K): PositioningConfig[K] {
    const modalConfig = getModalConfig();
    const providerConfig = getProviderConfig();

    if (modalConfig?.positioning?.[key] !== undefined) {
      return modalConfig.positioning[key] as PositioningConfig[K];
    }

    if (providerConfig?.positioning?.[key] !== undefined) {
      return providerConfig.positioning[key] as PositioningConfig[K];
    }

    return getConfig().positioning[key];
  }

  function getParentChild<K extends keyof ParentChildConfig>(key: K): ParentChildConfig[K] {
    const modalConfig = getModalConfig();
    const providerConfig = getProviderConfig();

    if (modalConfig?.parentChild?.[key] !== undefined) {
      return modalConfig.parentChild[key] as ParentChildConfig[K];
    }

    if (providerConfig?.parentChild?.[key] !== undefined) {
      return providerConfig.parentChild[key] as ParentChildConfig[K];
    }

    return getConfig().parentChild[key];
  }

  return {
    getEffectiveConfig,
    isFeatureEnabled,
    getAppearance,
    getAnimation,
    getPositioning,
    getParentChild,
  };
}
