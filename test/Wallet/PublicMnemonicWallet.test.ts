// Source mnemonic
// chimney noodle canyon tunnel sample stuff scan symbol sight club net own arrive cause suffer purity manage squirrel boost diesel bring cement father slide

import PublicMnemonicWallet from '@/Wallet/PublicMnemonicWallet';

const XPUB_AVM = `xpub6CvdTKLRh3ehvVLR2f3M1GUTFesrz5zoYFbw32iZqRShmoDnxtfSaF7mdCvXwNRfTwce5RYEADGb6YAzhqEAujEkvjTod6s2WEkpUBJZwqf`;
const XPUB_EVM = `xpub6CQ5fy7iAochmG1tL2ww2P4BviDRRrcEjG3u1uM6GcyGwzihscWoX9RwiCrZDcpAbYK8reYcy7cT8ZgZWVbReZ44ehVYqi5jZD9NknLx4TS`;

describe('Public Mnemonic Wallet', () => {
    it('can init', () => {
        let wallet = new PublicMnemonicWallet(XPUB_AVM, XPUB_EVM);
    });

    it('can get correct addresses', () => {
        let wallet = new PublicMnemonicWallet(XPUB_AVM, XPUB_EVM);
        expect(wallet.getAddressX()).toEqual(`X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh`);
        expect(wallet.getAddressP()).toEqual(`P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh`);
        expect(wallet.getChangeAddressX()).toEqual(`X-avax1fp5jw95s3s0sgylt5yvegpu03k5aggtypgpe02`);
        expect(wallet.getAddressC()).toEqual(`0x6a23c16777a3A194b2773df90FEB8753A8e619Ee`);
    });
});
