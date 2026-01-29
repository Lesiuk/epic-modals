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

type ConfigSection = 'features' | 'appearance' | 'animations' | 'positioning' | 'parentChild';

function resolve<S extends ConfigSection, K extends keyof ModalLibraryConfig[S]>(
  section: S,
  key: K,
  modalConfig: ModalConfigOverrides | undefined,
  providerConfig: PartialModalLibraryConfig | undefined
): ModalLibraryConfig[S][K] {

  const modalSection = modalConfig?.[section as keyof ModalConfigOverrides];
  if (modalSection && key in modalSection) {
    const value = (modalSection as Record<string, unknown>)[key as string];
    if (value !== undefined) {
      return value as ModalLibraryConfig[S][K];
    }
  }

  const providerSection = providerConfig?.[section];
  if (providerSection && key in providerSection) {
    const value = (providerSection as Record<string, unknown>)[key as string];
    if (value !== undefined) {
      return value as ModalLibraryConfig[S][K];
    }
  }

  return getConfig()[section][key];
}

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

  return {
    getEffectiveConfig,
    isFeatureEnabled,
    getAppearance: <K extends keyof AppearanceConfig>(key: K) =>
      resolve('appearance', key, getModalConfig(), getProviderConfig()),
    getAnimation: <K extends keyof AnimationDurations>(key: K) =>
      resolve('animations', key, getModalConfig(), getProviderConfig()),
    getPositioning: <K extends keyof PositioningConfig>(key: K) =>
      resolve('positioning', key, getModalConfig(), getProviderConfig()),
    getParentChild: <K extends keyof ParentChildConfig>(key: K) =>
      resolve('parentChild', key, getModalConfig(), getProviderConfig()),
  };
}
