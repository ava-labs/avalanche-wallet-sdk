import { NetworkConfig } from './types';
// import { AVMConstants } from 'avalanche/dist/apis/avm';
// import Avalanche, { AvalancheCore } from 'avalanche';
import { Defaults } from 'avalanche/dist/utils';

export const MainnetConfig: NetworkConfig = {
    apiProtocol: 'https',
    apiIp: 'api.avax.network',
    apiPort: 443,
    explorerURL: 'https://explorerapi.avax.network',
    explorerSiteURL: 'https://explorer.avax.network',
    networkID: 1,
    // @ts-ignore
    xChainID: Defaults.network[1]['X']['blockchainID'],
    // @ts-ignore
    pChainID: Defaults.network[1]['P']['blockchainID'],
    // @ts-ignore
    cChainID: Defaults.network[1]['C']['blockchainID'],
    // @ts-ignore
    evmChainID: Defaults.network[1]['C']['chainID'],
    // @ts-ignore
    avaxID: Defaults.network[1]['X']['avaxAssetID'],
};

export const TestnetConfig: NetworkConfig = {
    apiProtocol: 'https',
    apiIp: 'api.avax-test.network',
    apiPort: 443,
    explorerURL: 'https://explorerapi.avax-test.network',
    explorerSiteURL: 'https://explorer.avax-test.network',
    networkID: 5,
    // @ts-ignore
    xChainID: Defaults.network[5]['X']['blockchainID'],
    // @ts-ignore
    pChainID: Defaults.network[5]['P']['blockchainID'],
    // @ts-ignore
    cChainID: Defaults.network[5]['C']['blockchainID'],
    // @ts-ignore
    evmChainID: Defaults.network[5]['C']['chainID'],
    // @ts-ignore
    avaxID: Defaults.network[5]['X']['avaxAssetID'],
};

export const LocalnetConfig: NetworkConfig = {
    apiProtocol: 'http',
    apiIp: 'localhost',
    apiPort: 9650,
    networkID: 12345,
    // @ts-ignore
    xChainID: Defaults.network[12345]['X']['blockchainID'],
    // @ts-ignore
    pChainID: Defaults.network[12345]['P']['blockchainID'],
    // @ts-ignore
    cChainID: Defaults.network[12345]['C']['blockchainID'],
    // @ts-ignore
    evmChainID: Defaults.network[12345]['C']['chainID'],
    // @ts-ignore
    avaxID: Defaults.network[12345]['X']['avaxAssetID'],
};

export const MainnetLocalConfig: NetworkConfig = {
    apiProtocol: 'http',
    apiIp: 'localhost',
    apiPort: 9650,
    networkID: 1,
    // @ts-ignore
    xChainID: Defaults.network[1]['X']['blockchainID'],
    // @ts-ignore
    pChainID: Defaults.network[1]['P']['blockchainID'],
    // @ts-ignore
    cChainID: Defaults.network[1]['C']['blockchainID'],
    // @ts-ignore
    evmChainID: Defaults.network[1]['C']['chainID'],
    // @ts-ignore
    avaxID: Defaults.network[1]['X']['avaxAssetID'],
};

// Default network connection
export const DefaultConfig = MainnetConfig;
