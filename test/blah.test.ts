import MnemonicWallet from '@/Wallet/MnemonicWallet';

describe('blah', () => {
    it('works', () => {
        const wallet = MnemonicWallet.create();
        expect(wallet.getAddressX()).toEqual('');
    });
});
