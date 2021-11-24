import { NetworkConfig } from './types';
import { MainnetConfig, TestnetConfig, LocalnetConfig } from '@/Network/constants';
import { activeNetwork, setRpcNetwork, getEvmChainID, getConfigFromUrl, setRpcNetworkAsync } from '@/Network/network';
import WebsocketProvider from '@/Network/providers/WebsocketProvider';
import { bustErc20Cache } from '@/Asset/Erc20';
import { emitNetworkChange } from '@/Network/eventEmitter';

export function setNetwork(conf: NetworkConfig) {
    setRpcNetwork(conf);
    emitNetworkChange(conf);
    bustErc20Cache();
}

/**
 * Unlike `setNetwork` this function will fail if the network is not available.
 * @param conf
 */
export async function setNetworkAsync(conf: NetworkConfig) {
    await setRpcNetworkAsync(conf);
    emitNetworkChange(conf);
    bustErc20Cache();
}

export function isFujiNetwork(activeNetwork: NetworkConfig) {
    return activeNetwork.networkID === TestnetConfig.networkID;
}

export function isMainnetNetwork(activeNetwork: NetworkConfig) {
    return activeNetwork.networkID === MainnetConfig.networkID;
}

export function isLocalNetwork(activeNetwork: NetworkConfig) {
    return activeNetwork.networkID === LocalnetConfig.networkID;
}

// Default connection is Mainnet
setNetwork(MainnetConfig);

export function getAvaxAssetID() {
    return activeNetwork.avaxID;
}

export function getActiveNetworkConfig() {
    return activeNetwork;
}

export { WebsocketProvider, getEvmChainID, getConfigFromUrl };

export { NetworkConfig } from './types';
export * from './helpers';
