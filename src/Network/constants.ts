import { NetworkConfig } from './types';
// import { AVMConstants } from 'avalanche/dist/apis/avm';
// import Avalanche, { AvalancheCore } from 'avalanche';

export const MainnetConfig: NetworkConfig = {
    apiProtocol: 'https',
    apiIp: 'api.avax.network',
    apiPort: 443,
    explorerURL: 'https://explorerapi.avax.network',
    explorerSiteURL: 'https://explorer.avax.network',
    networkID: 1,
    evmChainID: 43114,
    avaxID: 'FvwEAhmxKfeiG8SnEvq42hc6whRyY3EFYAvebMqDNDGCgxN5Z',
};

export const TestnetConfig: NetworkConfig = {
    apiProtocol: 'https',
    apiIp: 'api.avax-test.network',
    apiPort: 443,
    explorerURL: 'https://explorerapi.avax-test.network',
    explorerSiteURL: 'https://explorer.avax-test.network',
    networkID: 5,
    evmChainID: 43113,
    avaxID: 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK',
};
