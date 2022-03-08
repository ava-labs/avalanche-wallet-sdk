import { ethers } from 'ethers';
import { NetworkConfig } from '@/Network/types';

export function getEthersJsonRpcProvider(config: NetworkConfig) {
    return new ethers.providers.JsonRpcProvider(config.rpcUrl.c, {
        name: '',
        chainId: config.evmChainID,
    });
}
