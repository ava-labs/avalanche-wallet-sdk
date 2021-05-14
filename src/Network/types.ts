export interface NetworkConfig {
    apiProtocol: 'http' | 'https';
    apiIp: string;
    apiPort: number;
    explorerURL?: string;
    explorerSiteURL?: string;
    networkID: number;
    evmChainID: number;
    avaxID: string;
}
