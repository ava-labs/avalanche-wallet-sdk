import { ChainIdType } from '@/common';
import Web3 from 'web3';
import { bintools } from '@/common';

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
 * Returns the human readable part of a X or P bech32 address.
 * @param address
 */
export function getAddressHRP(address: string): string {
    if (!validateAddress(address)) {
        throw new Error('Invalid X or P address.');
    }
    return address.split('-')[1].split('1')[0];
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
