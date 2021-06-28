import { NetworkConfig } from './types';
import { MainnetConfig } from '@/Network/constants';
import { activeNetwork, setRpcNetwork } from '@/Network/network';
import WebsocketProvider from '@/Network/providers/WebsocketProvider';

export function setNetwork(conf: NetworkConfig) {
    setRpcNetwork(conf);
}

// Default connection is Mainnet
setNetwork(MainnetConfig);

export function getAvaxAssetID() {
    return activeNetwork.avaxID;
}

export { WebsocketProvider };
