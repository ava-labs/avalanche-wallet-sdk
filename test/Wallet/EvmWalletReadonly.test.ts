import { EvmWalletReadonly } from '@/Wallet/EVM/EvmWalletReadonly';
import { TEST_COMPRESSED_PUB, TEST_PK } from './constants';

describe('EVM Wallet Readonly', () => {
    let wallet = new EvmWalletReadonly(TEST_COMPRESSED_PUB);

    it('can return address', () => {
        expect(wallet.getAddress()).toBe('0x192Cf94892026c45df1230c3AAffE1Ce9AbCb057');
    });

    it('can get BTC address', () => {
        expect(wallet.getAddressBTC()).toBe('bc1q737j4wvylwc0d72y24nj44vev0u4n4y3q2k0mz');
    });
});
