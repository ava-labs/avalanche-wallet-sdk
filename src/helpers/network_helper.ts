import { NetworkConfig } from '@/Network/types';

export function wsUrlFromConfigX(config: NetworkConfig): string {
    let protocol = config.apiProtocol === 'http' ? 'ws' : 'wss';
    return `${protocol}://${config.apiIp}:${config.apiPort}/ext/bc/X/events`;
}

export function wsUrlFromConfigEVM(config: NetworkConfig): string {
    let protocol = config.apiProtocol === 'http' ? 'ws' : 'wss';
    return `${protocol}://${config.apiIp}:${config.apiPort}/ext/bc/C/ws`;
}
