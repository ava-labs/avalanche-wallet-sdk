export interface NetworkConfig {
    apiProtocol: 'http' | 'https';
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
    name: string;
    rpcUrl: string;
    symbol: string;
}
