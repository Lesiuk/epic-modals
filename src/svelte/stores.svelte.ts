import { subscribe, getStateVersion as getCoreStateVersion } from '../core/state';
import { subscribeToConfig, getConfigVersion as getCoreConfigVersion } from '../core/config';

let stateVersion = $state(0);

let configVersion = $state(0);

subscribe(() => {
  stateVersion = getCoreStateVersion();
});

subscribeToConfig(() => {
  configVersion = getCoreConfigVersion();
});

export function getReactiveStateVersion(): number {
  return stateVersion;
}

export function getReactiveConfigVersion(): number {
  return configVersion;
}
