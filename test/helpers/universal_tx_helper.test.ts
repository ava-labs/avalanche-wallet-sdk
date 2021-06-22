import { getStepsForTargetAvaxBalance } from '@/helpers/universal_tx_helper';
import { BN, utils } from 'avalanche';
import { AVMConstants } from 'avalanche/dist/apis/avm';
import { pChain } from '@/Network/network';

jest.mock('@/Network/network', () => {
    return {
        web3: {
            utils: {
                isAddress: jest.fn().mockReturnValue(true),
            },
        },
        pChain: {
            getTxFee: jest.fn(),
        },
    };
});

const addrC = '0x6a23c16777a3A194b2773df90FEB8753A8e619Ee';
const addrP = 'P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';
const addrX = 'X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';
//
// describe('Universal tx helper methods', () => {
//     it('No transfer necessary (C)', () => {
//         let TEN = new BN(10);
//         let ZERO = new BN(0);
//         let sendAmount = new BN(1);
//         let to = addrC;
//
//         let txs = buildUniversalAvaxTransferTxs(TEN, ZERO, ZERO, to, sendAmount);
//
//         console.log(txs);
//         expect(1).toEqual(1);
//     });
// });
const FEE = new BN(1000000);

describe('get steps', () => {
    beforeEach(() => {
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE);
    });

    it('should return empty', () => {
        let TEN = new BN(10);
        let ZERO = new BN(0);
        let res = getStepsForTargetAvaxBalance(TEN, ZERO, ZERO, TEN, 'X');

        expect(res.length).toEqual(0);
    });

    // it('expect C to X 10 nAVAX', () => {
    //     let balX = new BN(0);
    //     let balP = new BN(0);
    //     let balC = new BN(20);
    //
    //     let targetBal = new BN(10);
    //
    //     let res = getStepsForTargetAvaxBalance(balX, balP, balC, targetBal, 'X');
    //
    //     expect(res.length).toEqual(1);
    // });
});
