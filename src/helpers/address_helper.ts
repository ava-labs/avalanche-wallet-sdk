import { BinTools } from 'avalanche';
import { ChainIdType } from '@/types';
import Web3 from 'web3';
export const bintools: BinTools = BinTools.getInstance();

export const validateAddress = (address: string): boolean | string => {
    return validateAddressX(address) || validateAddressP(address) || validateAddressEVM(address);
};

export function validateAddressX(address: string) {
    try {
        let buff = bintools.parseAddress(address, 'X');
        if (!buff) return false;
        return true;
    } catch (error) {
        return false;
    }
}

export function validateAddressP(address: string) {
    try {
        let buff = bintools.parseAddress(address, 'P');
        if (!buff) return false;
        return true;
    } catch (error) {
        return false;
    }
}

export function validateAddressEVM(address: string) {
    return Web3.utils.isAddress(address);
}

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
