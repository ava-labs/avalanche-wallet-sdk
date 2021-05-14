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
    evmChainID: Defaults.network[12345]['C']['chainID'],
    // @ts-ignore
    avaxID: Defaults.network[12345]['X']['avaxAssetID'],
};
