export type NetworkProtocolType = 'http' | 'https';

export interface NetworkConfigRpc {
    c: string;
    x: string;
    p: string;
}

export interface NetworkConfig {
    rawUrl: string;
    apiProtocol: NetworkProtocolType;
    apiIp: string;
    apiPort: number;
    explorerURL?: string;
    explorerSiteURL?: string;
    networkID: number;
    evmChainID: number;
    xChainID: string;
    pChainID: string;
    cChainID: string;
    avaxID: string;
    rpcUrl: NetworkConfigRpc;
}
