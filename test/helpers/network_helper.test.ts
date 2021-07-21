import { wsUrlFromConfigEVM, wsUrlFromConfigX } from '@/helpers/network_helper';
import { MainnetConfig } from '@/Network/constants';

describe('Network helper methods', () => {
    it('can return ws url for X chain', () => {
        let url = wsUrlFromConfigX(MainnetConfig);
        expect(url).toEqual('wss://api.avax.network:443/ext/bc/X/events');
    });

    it('can return ws url for EVM', () => {
        let url = wsUrlFromConfigEVM(MainnetConfig);
        expect(url).toEqual('wss://api.avax.network:443/ext/bc/C/ws');
    });
});
