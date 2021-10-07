import { pChain, xChain } from '@/Network/network';

/**
 * Returns the transaction fee for X chain.
 */
export function getTxFeeX() {
    return xChain.getTxFee();
}

/**
 * Returns the transaction fee for P chain.
 */
export function getTxFeeP() {
    return pChain.getTxFee();
}
