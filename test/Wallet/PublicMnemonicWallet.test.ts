import { XPUB_AVAX, XPUB_ETH_ADDR } from './constants';

jest.mock('@/Network', () => {
    return {
        getAvaxAssetID: jest.fn().mockImplementation(() => {
            return 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK';
        }),
    };
});

import { PublicMnemonicWallet } from '@/Wallet/PublicMnemonicWallet';

describe('Public Mnemonic Wallet', () => {
    it('can init', () => {
        let wallet = new PublicMnemonicWallet(XPUB_AVAX, XPUB_ETH_ADDR);
    });

    it('can get correct addresses', () => {
        let wallet = new PublicMnemonicWallet(XPUB_AVAX, XPUB_ETH_ADDR);
        expect(wallet.getAddressX()).toEqual(`X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh`);
        expect(wallet.getAddressP()).toEqual(`P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh`);
        expect(wallet.getChangeAddressX()).toEqual(`X-avax1fp5jw95s3s0sgylt5yvegpu03k5aggtypgpe02`);
        expect(wallet.getAddressC()).toEqual(`0x6a23c16777a3A194b2773df90FEB8753A8e619Ee`);
        expect(wallet.getEvmAddressBech()).toEqual(`C-avax1t5dhkc4myzvyqsct3dmaue2hc43na8qh3v6xx4`);
    });
});
