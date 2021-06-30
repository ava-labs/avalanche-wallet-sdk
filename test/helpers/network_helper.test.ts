import { rpcUrlFromConfig, wsUrlFromConfigEVM, wsUrlFromConfigX } from '@/helpers/network_helper';
import { MainnetLocalConfig, LocalnetConfig, MainnetConfig, TestnetConfig } from '@/Network/constants';

describe('Network helper methods', () => {
    // Mainnet
    it('can return ws url for X chain for mainnet', () => {
        let url = wsUrlFromConfigX(MainnetConfig);
        expect(url).toEqual('wss://api.avax.network:443/ext/bc/X/events');
    });

    it('can return ws url for EVM for mainnet', () => {
        let url = wsUrlFromConfigEVM(MainnetConfig);
        expect(url).toEqual('wss://api.avax.network:443/ext/bc/C/ws');
    });

    it('can return rpc url for EVM for mainnet', () => {
        let url = rpcUrlFromConfig(MainnetConfig);
        expect(url).toEqual('https://api.avax.network:443/ext/bc/C/rpc');
    });

    // Testnet
    it('can return ws url for X chain for testnet', () => {
        let url = wsUrlFromConfigX(TestnetConfig);
        expect(url).toEqual('wss://api.avax-test.network:443/ext/bc/X/events');
    });

    it('can return ws url for EVM for testnet', () => {
        let url = wsUrlFromConfigEVM(TestnetConfig);
        expect(url).toEqual('wss://api.avax-test.network:443/ext/bc/C/ws');
    });

    it('can return rpc url for EVM for testnet', () => {
        let url = rpcUrlFromConfig(TestnetConfig);
        expect(url).toEqual('https://api.avax-test.network:443/ext/bc/C/rpc');
    });

    // Localnet
    it('can return ws url for X chain for localnet', () => {
        let url = wsUrlFromConfigX(LocalnetConfig);
        expect(url).toEqual('ws://localhost:9650/ext/bc/X/events');
    });

    it('can return ws url for EVM for localnet', () => {
        let url = wsUrlFromConfigEVM(LocalnetConfig);
        expect(url).toEqual('ws://localhost:9650/ext/bc/C/ws');
    });

    it('can return rpc url for EVM for localnet', () => {
        let url = rpcUrlFromConfig(LocalnetConfig);
        expect(url).toEqual('http://localhost:9650/ext/bc/C/rpc');
    });

    // Local Mainnet
    it('can return ws url for X chain for mainnet local', () => {
        let url = wsUrlFromConfigX(MainnetLocalConfig);
        expect(url).toEqual('ws://localhost:9650/ext/bc/X/events');
    });

    it('can return ws url for EVM for mainnet local', () => {
        let url = wsUrlFromConfigEVM(MainnetLocalConfig);
        expect(url).toEqual('ws://localhost:9650/ext/bc/C/ws');
    });

    it('can return rpc url for EVM for mainnet local', () => {
        let url = rpcUrlFromConfig(MainnetLocalConfig);
        expect(url).toEqual('http://localhost:9650/ext/bc/C/rpc');
    });
});
