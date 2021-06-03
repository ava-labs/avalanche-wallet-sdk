import MnemonicWallet from '@/Wallet/MnemonicWallet';
// import { bintools } from '@/Network/network';

jest.mock('@/Network/network', () => {
    return {
        avalanche: {
            getNetworkID: jest.fn().mockReturnValue(1),
            getHRP: jest.fn().mockReturnValue('avax'),
        },
        // bintools: {
        //     addressToString: jest.fn(),
        // },
        //@ts-ignore
        web3: {
            provider: {
                send: jest.fn().mockReturnValue('send'),
            },
            eth: {
                Contract: jest.fn().mockImplementation(() => function () {}),
                getBlockNumber: () => 1,
            },
        },
    };
});

const MNEMONIC =
    'chimney noodle canyon tunnel sample stuff scan symbol sight club net own arrive cause suffer purity manage squirrel boost diesel bring cement father slide';

describe('Mnemonic Wallet', () => {
    const wallet = MnemonicWallet.fromMnemonic(MNEMONIC);

    it('can return initial X address', () => {
        // (bintools.addressToString as jest.Mock).mockReturnValue('X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh');
        expect(wallet.getAddressX()).toEqual('X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh');
    });

    it('can return initial P address', () => {
        // (bintools.addressToString as jest.Mock).mockReturnValue('P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh');
        expect(wallet.getAddressP()).toEqual('P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh');
    });

    it('can return initial C address', () => {
        expect(wallet.getAddressC()).toEqual('0x6a23c16777a3A194b2773df90FEB8753A8e619Ee');
    });
});
