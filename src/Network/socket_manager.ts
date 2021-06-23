import { NetworkConfig } from './types';
import { DefaultConfig } from '@/Network/constants';
import { connectSocketX } from '@/Network/providers/socket_x';
import { connectSocketC } from '@/Network/providers/socket_c';

let activeNetwork: NetworkConfig = DefaultConfig;

export function setSocketNetwork(config: NetworkConfig) {
    // Setup X chain connection
    connectSocketX(config);
    // Setup EVM socket connection
    connectSocketC(config);
    activeNetwork = config;
}
