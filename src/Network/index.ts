import { NetworkConfig } from './types';
import { MainnetConfig } from '@/Network/constants';
import { activeNetwork, setRpcNetwork, getEvmChainID } from '@/Network/network';
import WebsocketProvider from '@/Network/providers/WebsocketProvider';
import { bustErc20Cache } from '@/Asset/Erc20';
import { NetworkConstants } from '..';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function setNetwork(conf: NetworkConfig) {
    setRpcNetwork(conf);
    bustErc20Cache();
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isFujiNetwork(activeNetwork: NetworkConfig) {
    return activeNetwork === NetworkConstants.TestnetConfig;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isMainnetNetwork(activeNetwork: NetworkConfig) {
    return activeNetwork === NetworkConstants.MainnetConfig;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function isLocalNetwork(activeNetwork: NetworkConfig) {
    return activeNetwork === NetworkConstants.LocalnetConfig;
}

// Default connection is Mainnet
setNetwork(MainnetConfig);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function getAvaxAssetID() {
    return activeNetwork.avaxID;
}

export { WebsocketProvider, getEvmChainID };

export { NetworkConfig } from './types';
export { activeNetwork } from '@/Network/network';
