import MnemonicWallet from '@/Wallet/MnemonicWallet';

const MNEMONIC =
    'chimney noodle canyon tunnel sample stuff scan symbol sight club net own arrive cause suffer purity manage squirrel boost diesel bring cement father slide';
describe('blah', () => {
    it('works', () => {
        const wallet = MnemonicWallet.fromMnemonic(MNEMONIC);
        expect(wallet.getAddressX()).toEqual('X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh');
        expect(wallet.getAddressP()).toEqual('P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh');
        expect(wallet.getAddressC()).toEqual('0x6a23c16777a3A194b2773df90FEB8753A8e619Ee');
    });
});
