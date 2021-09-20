import { web3 } from '@/Network/network';

const MAX_GAS = 235000000000;

/**
 * Returns the current gas price in WEI from the network
 */
export async function getGasPrice(): Promise<number> {
    return parseInt(await web3.eth.getGasPrice());
}

/**
 * Returns the gas price + 25%, or max gas
 */
export async function getAdjustedGasPrice(): Promise<number> {
    let gasPrice = await getGasPrice();
    let adjustedGas = Math.floor(gasPrice * 1.25);
    return Math.min(adjustedGas, MAX_GAS);
}
