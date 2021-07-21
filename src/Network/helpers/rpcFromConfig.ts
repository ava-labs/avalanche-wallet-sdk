import { NetworkConfig } from '../types';

function rpcUrlFromConfig(conf: NetworkConfig, chain: string): string {
    return `${conf.apiProtocol}://${conf.apiIp}:${conf.apiPort}/ext/${chain}/rpc`;
}

export function getRpcC(conf: NetworkConfig) {
    return rpcUrlFromConfig(conf, 'bc/C');
}
export function getRpcX(conf: NetworkConfig) {
    return rpcUrlFromConfig(conf, 'X');
}
export function getRpcP(conf: NetworkConfig) {
    return rpcUrlFromConfig(conf, 'P');
}
