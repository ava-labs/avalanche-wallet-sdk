import { getBaseFee, getGasPrice, getMaxPriorityFee } from '@/helpers/gas_helper';
import { cChain, web3 } from '@/Network/network';
import BN from 'bn.js';

jest.mock('@/Network/network', () => {
    return {
        cChain: {
            getBaseFee: jest.fn(),
            getMaxPriorityFeePerGas: jest.fn(),
        },
        web3: {
            eth: {
                getGasPrice: jest.fn(),
            },
        },
    };
});

describe('getGasPrice', () => {
    it('getGasPrice', async () => {
        web3.eth.getGasPrice.mockReturnValueOnce('1');
        let gasPrice = await getGasPrice();
        expect(gasPrice).toEqual(new BN(1));
    });
});

describe('getBaseFee', () => {
    it('0 base fee', async () => {
        cChain.getBaseFee.mockReturnValueOnce('0x0');
        let baseFee = await getBaseFee();
        expect(baseFee).toEqual(new BN(0));
    });

    it('1 gwei', async () => {
        cChain.getBaseFee.mockReturnValueOnce('0x3B9ACA00');
        let baseFee = await getBaseFee();
        expect(baseFee).toEqual(new BN(1_000_000_000));
    });
});

describe('getMaxPriorityFee', () => {
    it('0 fee', async () => {
        cChain.getMaxPriorityFeePerGas.mockReturnValueOnce('0x0');
        let fee = await getMaxPriorityFee();
        expect(fee).toEqual(new BN(0));
    });

    it('1 gwei', async () => {
        cChain.getMaxPriorityFeePerGas.mockReturnValueOnce('0x3B9ACA00');
        let fee = await getMaxPriorityFee();
        expect(fee).toEqual(new BN(1_000_000_000));
    });
});
