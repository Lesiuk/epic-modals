import { useMemo, useContext, useState, useEffect } from 'react';
import type {
  ModalLibraryConfig,
  ModalFeatures,
  AppearanceConfig,
  AnimationDurations,
  PositioningConfig,
  ParentChildConfig,
  PartialModalLibraryConfig,
} from '../../core/config';
import { getConfigVersion } from '../../core/config';
import { createConfigResolver } from '../../core/config/resolution';
import type { ModalConfigOverrides } from '../../core/types';
import { ModalProviderConfigContext } from '../context';

export interface UseModalConfigOptions {

  modalConfig?: ModalConfigOverrides;
}

export interface UseModalConfigReturn {

  getEffectiveConfig: () => ModalLibraryConfig;

  isFeatureEnabled: (feature: keyof ModalFeatures) => boolean;

  getAppearance: <K extends keyof AppearanceConfig>(key: K) => AppearanceConfig[K];

  getAnimation: <K extends keyof AnimationDurations>(key: K) => AnimationDurations[K];

  getPositioning: <K extends keyof PositioningConfig>(key: K) => PositioningConfig[K];

  getParentChild: <K extends keyof ParentChildConfig>(key: K) => ParentChildConfig[K];

  providerConfig: PartialModalLibraryConfig | undefined;
}

export function useModalConfig(options: UseModalConfigOptions = {}): UseModalConfigReturn {
  const { modalConfig } = options;

  const providerConfig = useContext(ModalProviderConfigContext);

  const [configVersion, setConfigVersion] = useState(() => getConfigVersion());

  useEffect(() => {
    const checkConfigVersion = () => {
      const currentVersion = getConfigVersion();
      if (currentVersion !== configVersion) {
        setConfigVersion(currentVersion);
      }
    };
    const interval = setInterval(checkConfigVersion, 50);
    return () => clearInterval(interval);
  }, [configVersion]);

  return useMemo(() => {
    const resolver = createConfigResolver({
      getModalConfig: () => modalConfig,
      getProviderConfig: () => providerConfig ?? undefined,
    });

    return {
      ...resolver,
      providerConfig,
    };
  }, [modalConfig, providerConfig, configVersion]);
}
