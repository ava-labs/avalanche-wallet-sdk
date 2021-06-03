import { NetworkConfig } from './types';
import { setSocketNetwork } from '@/Network/socket_manager';
import { MainnetConfig } from '@/Network/constants';
import { setRpcNetwork } from '@/Network/network';

export function setNetwork(conf: NetworkConfig) {
    setRpcNetwork(conf);
    setSocketNetwork(conf);
}

// Default connection is Mainnet
setNetwork(MainnetConfig);
