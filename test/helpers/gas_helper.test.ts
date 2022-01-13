import { adjustValue, getBaseFee, getGasPrice, getMaxPriorityFee } from '@/helpers/gas_helper';
import { cChain, setRpcNetwork, web3 } from '@/Network/network';
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
        setRpcNetwork: jest.fn(),
    };
});

describe('getGasPrice', () => {
    it('getGasPrice', async () => {
        //@ts-ignore
        web3.eth.getGasPrice.mockReturnValueOnce('1');
        let gasPrice = await getGasPrice();
        expect(gasPrice).toEqual(new BN(1));
    });
});

describe('getBaseFee', () => {
    it('0 base fee', async () => {
        //@ts-ignore
        cChain.getBaseFee.mockReturnValueOnce('0x0');
        let baseFee = await getBaseFee();
        expect(baseFee.toString()).toEqual('0');
    });

    it('1 gwei', async () => {
        //@ts-ignore
        cChain.getBaseFee.mockReturnValueOnce('0x3B9ACA00');
        let baseFee = await getBaseFee();
        expect(baseFee).toEqual(new BN(1_000_000_000));
    });
});

describe('getMaxPriorityFee', () => {
    it('0 fee', async () => {
        //@ts-ignore
        cChain.getMaxPriorityFeePerGas.mockReturnValueOnce('0x0');
        let fee = await getMaxPriorityFee();
        expect(fee.toString()).toEqual('0');
    });

    it('1 gwei', async () => {
        //@ts-ignore
        cChain.getMaxPriorityFeePerGas.mockReturnValueOnce('0x3B9ACA00');
        let fee = await getMaxPriorityFee();
        expect(fee.toString()).toEqual('1000000000');
    });
});

describe('get adjusted values', () => {
    it('add 20%', () => {
        const val = new BN(100);
        let res = adjustValue(val, 20);
        expect(res).toEqual(new BN(120));
    });

    it('add 20% to 101', () => {
        const val = new BN(101);
        let res = adjustValue(val, 20);
        // The real value is 121.2, but the decimals are dropped on BN calculations
        expect(res).toEqual(new BN(121));
    });
});
