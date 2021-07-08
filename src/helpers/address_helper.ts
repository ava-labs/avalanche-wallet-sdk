import { BinTools } from 'avalanche';
import { ChainIdType } from '@/types';
import Web3 from 'web3';
export const bintools: BinTools = BinTools.getInstance();

export const validateAddress = (address: string): boolean | string => {
    try {
        bintools.stringToAddress(address);
        return true;
    } catch (error) {
        return false;
    }
};

/**
 * Given an address, return which Chain it belongs to
 * @param address
 */
export function getAddressChain(address: string): ChainIdType {
    if (!validateAddress(address)) {
        throw new Error('Invalid address.');
    }

    if (Web3.utils.isAddress(address)) {
        return 'C';
    } else {
        return address[0] as ChainIdType;
    }
}

export default {
    validateAddress,
    getAddressChain,
};
