import { getRpcC, getRpcP, getRpcX } from '@/Network/helpers/rpcFromConfig';
import { MainnetConfig } from '@/Network/constants';

describe('RPC from Config helper methods', () => {
    it('rpc for C', () => {
        let rpc = getRpcC(MainnetConfig);
        expect(rpc).toEqual(`https://api.avax.network:443/ext/bc/C/rpc`);
    });

    it('rpc for X', () => {
        let rpc = getRpcX(MainnetConfig);
        expect(rpc).toEqual(`https://api.avax.network:443/ext/bc/X`);
    });

    it('rpc for P', () => {
        let rpc = getRpcP(MainnetConfig);
        expect(rpc).toEqual(`https://api.avax.network:443/ext/bc/P`);
    });
});
