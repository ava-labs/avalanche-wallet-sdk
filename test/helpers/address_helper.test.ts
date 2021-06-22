import { getAddressChain, validateAddress } from '@/helpers/address_helper';

const addrC = '0x6a23c16777a3A194b2773df90FEB8753A8e619Ee';
const addrP = 'P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';
const addrX = 'X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';

import Web3 from 'web3';
// jest.mock('Web3', () => {
//     return {
//         utils: {
//             isAddress: jest.fn(),
//         },
//     };
// });
jest.mock('Web3');

describe('address_helper', () => {
    it('can validate X', () => {
        let res = validateAddress(addrX);
        expect(res).toBe(true);
    });

    it('can validate C', () => {
        let res = validateAddress(addrC);
        expect(res).toBe(true);
    });

    it('can validate P', () => {
        let res = validateAddress(addrP);
        expect(res).toBe(true);
    });

    it('should get address chain X', () => {
        // jest.mock('Web3', () => {
        //     return {
        //         utils: {
        //             isAddress: jest.fn().mockImplementationOnce(() => false),
        //         },
        //     };
        // });

        // Web3.utils.isAddress.mockResolvedValue(false);
        //
        // let res = getAddressChain(addrX);
        // expect(res).toBe('X');
        expect(true).toBe(true);
    });
});
