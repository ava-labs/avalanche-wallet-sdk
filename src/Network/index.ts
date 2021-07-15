import { NetworkConfig } from './types';
import { MainnetConfig } from '@/Network/constants';
import { activeNetwork, setRpcNetwork, getEvmChainID } from '@/Network/network';
import WebsocketProvider from '@/Network/providers/WebsocketProvider';
import { bustErc20Cache } from '@/Asset/Erc20';

export function setNetwork(conf: NetworkConfig) {
    setRpcNetwork(conf);
    bustErc20Cache();
}

// Default connection is Mainnet
setNetwork(MainnetConfig);

export function getAvaxAssetID() {
    return activeNetwork.avaxID;
}

export { WebsocketProvider, getEvmChainID };
