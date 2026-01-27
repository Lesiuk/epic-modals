import { getContext } from 'svelte';
import type {
  ModalLibraryConfig,
  ModalFeatures,
  AppearanceConfig,
  AnimationDurations,
  PositioningConfig,
  ParentChildConfig,
  PartialModalLibraryConfig,
} from '../../core/config';
import { createConfigResolver, type ConfigResolver } from '../../core/config/resolution';
import { getReactiveConfigVersion } from '../stores.svelte';
import type { ModalConfigOverrides } from '../../core/types';
import { MODAL_PROVIDER_CONFIG_CONTEXT } from '../context';

export interface UseModalConfigOptions {

  getModalConfig?: () => ModalConfigOverrides | undefined;

  getProviderConfig?: () => PartialModalLibraryConfig | undefined;
}

export interface UseModalConfigReturn {

  getEffectiveConfig: () => ModalLibraryConfig;

  isFeatureEnabled: (feature: keyof ModalFeatures) => boolean;

  getAppearance: <K extends keyof AppearanceConfig>(key: K) => AppearanceConfig[K];

  getAnimation: <K extends keyof AnimationDurations>(key: K) => AnimationDurations[K];

  getPositioning: <K extends keyof PositioningConfig>(key: K) => PositioningConfig[K];

  getParentChild: <K extends keyof ParentChildConfig>(key: K) => ParentChildConfig[K];

  getProviderConfig: () => PartialModalLibraryConfig | undefined;
}

export function useModalConfig(options: UseModalConfigOptions = {}): UseModalConfigReturn {
  const { getModalConfig, getProviderConfig: getDirectProviderConfig } = options;

  let getProviderConfigFromContext: (() => PartialModalLibraryConfig | undefined) | undefined;

  if (getDirectProviderConfig === undefined) {
    try {
      getProviderConfigFromContext = getContext<(() => PartialModalLibraryConfig | undefined) | undefined>(
        MODAL_PROVIDER_CONFIG_CONTEXT
      );
    } catch {

      getProviderConfigFromContext = undefined;
    }
  }

  function getProviderConfig(): PartialModalLibraryConfig | undefined {

    if (getDirectProviderConfig !== undefined) {
      return getDirectProviderConfig();
    }

    return getProviderConfigFromContext?.();
  }

  const baseResolver = createConfigResolver({
    getModalConfig: getModalConfig ?? (() => undefined),
    getProviderConfig,
  });

  function wrapWithReactivity<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>) => {
      getReactiveConfigVersion();
      return fn(...args);
    }) as T;
  }

  return {
    getEffectiveConfig: wrapWithReactivity(baseResolver.getEffectiveConfig),
    isFeatureEnabled: wrapWithReactivity(baseResolver.isFeatureEnabled),
    getAppearance: wrapWithReactivity(baseResolver.getAppearance),
    getAnimation: wrapWithReactivity(baseResolver.getAnimation),
    getPositioning: wrapWithReactivity(baseResolver.getPositioning),
    getParentChild: wrapWithReactivity(baseResolver.getParentChild),
    getProviderConfig,
  };
}
