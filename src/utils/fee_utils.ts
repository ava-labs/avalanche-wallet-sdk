import { pChain, xChain } from '@/Network/network';
import { BN } from 'avalanche';

/**
 * Returns the transaction fee for X chain.
 */
export function getTxFeeX(): BN {
    return xChain.getTxFee();
}

/**
 * Returns the transaction fee for P chain.
 */
export function getTxFeeP(): BN {
    return pChain.getTxFee();
}
