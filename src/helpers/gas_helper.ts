import { cChain, web3 } from '@/Network/network';
import { BN } from 'avalanche';

const MAX_GAS = new BN(1000_000_000_000);

/**
 * Returns the current gas price in WEI from the network
 */
export async function getGasPrice(): Promise<BN> {
    return new BN(await web3.eth.getGasPrice());
}

/**
 * Returns the gas price + 25%, or max gas
 */
export async function getAdjustedGasPrice(): Promise<BN> {
    let gasPrice = await getGasPrice();
    let additionalGas = gasPrice.div(new BN(100)).mul(new BN(25));
    let adjustedGas = gasPrice.add(additionalGas);
    return BN.min(adjustedGas, MAX_GAS);
}

/**
 * Returns the base fee from the network.
 */
export async function getBaseFee(): Promise<BN> {
    const rawHex = (await cChain.getBaseFee()).substring(2);
    return new BN(rawHex, 'hex');
}

/**
 * Returns the base fee from the network.
 */
export async function getMaxPriorityFee(): Promise<BN> {
    const rawHex = (await cChain.getMaxPriorityFeePerGas()).substring(2);
    return new BN(rawHex, 'hex');
}

/**
 * Calculate max fee for EIP 1559 transactions given baseFee and maxPriorityFee.
 * According to https://www.blocknative.com/blog/eip-1559-fees
 * @param baseFee in WEI
 * @param maxPriorityFee in WEI
 */
export function calculateMaxFee(baseFee: BN, maxPriorityFee: BN): BN {
    return baseFee.mul(new BN(2)).add(maxPriorityFee);
}
