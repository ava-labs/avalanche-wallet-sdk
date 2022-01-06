import { EvmWallet } from '@/Wallet/EvmWallet';

let PK_HEX = `8985df5f35f11ad2b2f5e8bebd28e738fd731949ce43fde88634704b4026366e`;
let keyBuf = Buffer.from(PK_HEX, 'hex');

describe('EVM Wallet', () => {
    it('Can init', () => {
        let wallet = new EvmWallet(keyBuf);
    });

    it('returns correct eth address', () => {
        let addr = '0x32255F101da293a908805B16Af8a4619dC1d3c78';
        let wallet = new EvmWallet(keyBuf);

        expect(wallet.getAddress()).toEqual(addr);
    });

    it('can get private key hex', () => {
        let wallet = new EvmWallet(keyBuf);
        let pk = wallet.getPrivateKeyHex();

        expect(pk).toEqual(PK_HEX);
    });
});
