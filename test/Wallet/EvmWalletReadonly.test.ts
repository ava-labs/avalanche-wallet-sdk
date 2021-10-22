import EvmWalletReadonly from '@/Wallet/EvmWalletReadonly';

describe('EVM Wallet Readonly', () => {
    let pubKeyBuff = Buffer.from(
        '819b266752d8f656907a1e0fa10c7c1553f9a8f579d8ad606c32219e6ac1d8c5315bb500ef919ea625ebd18548070a55e021c5223b39c1ad80f530f6379229ea',
        'hex'
    );
    let wallet = new EvmWalletReadonly(pubKeyBuff);

    it('can return address', () => {
        expect(wallet.getAddress()).toBe('0xA82C4D2491ED3562A699910A0fC8b69cD9961170');
    });

    it('can get BTC address', () => {
        expect(wallet.getAddressBTC()).toBe('bc1qdseg33h6hvr8k2lmlwst2aaueela77aqhjpq8z');
    });
});
