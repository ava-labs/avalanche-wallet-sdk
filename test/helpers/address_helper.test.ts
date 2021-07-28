import {
    getAddressChain,
    validateAddress,
    validateAddressEVM,
    validateAddressP,
    validateAddressX,
} from '@/helpers/address_helper';
import Web3 from 'web3';
const addrC = '0x6a23c16777a3A194b2773df90FEB8753A8e619Ee';
const addrP = 'P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';
const addrX = 'X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';

jest.mock('web3', () => {
    return {
        utils: {
            isAddress: jest.fn(),
        },
    };
});

describe('validate address', () => {
    it('can validate X', () => {
        let res = validateAddress(addrX);
        expect(res).toBe(true);
    });

    it('can validate C', () => {
        Web3.utils.isAddress.mockReturnValue(true);
        let res = validateAddress(addrC);
        expect(res).toBe(true);
    });

    it('can validate P', () => {
        let res = validateAddress(addrP);
        expect(res).toBe(true);
    });

    it('should fail for random chain id', () => {
        let address = 'F-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';

        Web3.utils.isAddress.mockReturnValue(false);

        let res = validateAddress(address);
        expect(res).toBe(false);
    });
});

describe('Validate address X', () => {
    it('True for correct address', () => {
        let res = validateAddressX(addrX);
        expect(res).toBe(true);
    });

    it('False for valid P address', () => {
        let res = validateAddressX(addrP);
        expect(res).toBe(false);
    });

    it('False for valid C address', () => {
        let res = validateAddressX(addrC);
        expect(res).toBe(false);
    });
});

describe('Validate address P', () => {
    it('True for correct address', () => {
        let res = validateAddressP(addrP);
        expect(res).toBe(true);
    });

    it('False for valid X address', () => {
        let res = validateAddressP(addrX);
        expect(res).toBe(false);
    });

    it('False for valid C address', () => {
        let res = validateAddressP(addrC);
        expect(res).toBe(false);
    });
});

describe('Validate address EVM', () => {
    it('True for correct address', () => {
        Web3.utils.isAddress.mockReturnValue(true);
        let res = validateAddressEVM(addrC);
        expect(res).toBe(true);
    });

    it('False for valid X address', () => {
        Web3.utils.isAddress.mockReturnValue(false);
        let res = validateAddressEVM(addrX);
        expect(res).toBe(false);
    });

    it('False for valid P address', () => {
        let res = validateAddressEVM(addrP);
        Web3.utils.isAddress.mockReturnValue(false);
        expect(res).toBe(false);
    });
});

describe('get chain', () => {
    it('should get address chain X', () => {
        let chain = getAddressChain(addrX);
        expect(chain).toBe('X');
    });

    it('should get address chain P', () => {
        let chain = getAddressChain(addrP);
        expect(chain).toBe('P');
    });

    it('should get address chain C', () => {
        Web3.utils.isAddress.mockReturnValue(true);
        let chain = getAddressChain(addrC);
        expect(chain).toBe('C');
    });
});
