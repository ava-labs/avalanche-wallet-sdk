import { NetworkConfig } from '../types';

export function getRpcC(conf: NetworkConfig) {
    return `${conf.apiProtocol}://${conf.apiIp}:${conf.apiPort}/ext/bc/C/rpc`;
}
export function getRpcX(conf: NetworkConfig) {
    return `${conf.apiProtocol}://${conf.apiIp}:${conf.apiPort}/ext/bc/X`;
}
export function getRpcP(conf: NetworkConfig) {
    return `${conf.apiProtocol}://${conf.apiIp}:${conf.apiPort}/ext/bc/P`;
}
