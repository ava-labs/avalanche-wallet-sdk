import { activeNetwork, cChain, web3 } from '@/Network/network';
import { BN, Buffer } from 'avalanche';
import {
    EVMInput,
    EVMOutput,
    ExportTx,
    ImportTx,
    SECPTransferInput,
    SECPTransferOutput,
    TransferableInput,
    TransferableOutput,
    UnsignedTx,
    UTXO,
    UTXOSet,
} from 'avalanche/dist/apis/evm';
import { ExportChainsC } from '@/Wallet/types';
import { bintools } from '@/common';
import { chainIdFromAlias } from '@/Network';
import { costExportTx, costImportTx } from 'avalanche/dist/utils';
import { buildEvmExportTransaction } from '@/helpers/tx_helper';

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
    let adjustedGas = adjustValue(gasPrice, 25);
    return BN.min(adjustedGas, MAX_GAS);
}

/**
 *
 * @param val
 * @param perc What percentage to adjust with
 */
export function adjustValue(val: BN, perc: number) {
    let padAmt = val.div(new BN(100)).mul(new BN(perc));
    return val.add(padAmt);
}

/**
 * Returns the base fee from the network.
 */
export async function getBaseFee(): Promise<BN> {
    const rawHex = (await cChain.getBaseFee()).substring(2);
    return new BN(rawHex, 'hex');
}

/**
 * Returns the current base fee + 25%
 */
export async function getBaseFeeRecommended() {
    const baseFee = await getBaseFee();
    return adjustValue(baseFee, 25);
}

/**
 * Returns the base max priority fee from the network.
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

/**
 * Creates a mock import transaction and estimates the gas required for it. Returns fee in units of gas.
 * @param sourceChain `X` or `P`
 * @param amount Amount to import in nAVAX
 * @param to C chain hex address receiving the outputs.
 */
export function estimateImportGasFeeFromMockTx(sourceChain: ExportChainsC, amount: BN, to: string): number {
    const sourceChainID = chainIdFromAlias(sourceChain);
    const netID = activeNetwork.networkID;
    const chainID = activeNetwork.cChainID;
    const AVAX_ID = activeNetwork.avaxID;

    // Create dummy Input and Output
    const avaxIDBuff = bintools.cb58Decode(AVAX_ID);
    const txIdBuff = new Buffer('0x0000000000000000000000000000000000000000000000000000000000000000'); // random 32 bytes
    const secpIn = new SECPTransferInput(amount);
    const txIn = new TransferableInput(txIdBuff, txIdBuff, avaxIDBuff, secpIn);
    const txOut = new EVMOutput(to, amount, avaxIDBuff);

    // Create fake import Tx
    const chainIdBuff = bintools.cb58Decode(chainID);
    const sourceChainId = bintools.cb58Decode(sourceChainID);
    const importTx = new ImportTx(netID, chainIdBuff, sourceChainId, [txIn], [txOut], new BN(0));
    const unisgnedTx = new UnsignedTx(importTx);

    return costImportTx(unisgnedTx);
}

/**
 * Estimates the gas fee using a mock ExportTx built from the passed values.
 * @param destinationChain `X` or `P`
 * @param amount in nAVAX
 * @param from The C chain hex address exported from
 * @param to The destination X or P address
 */
export function estimateExportGasFeeFromMockTx(
    destinationChain: ExportChainsC,
    amount: BN,
    from: string,
    to: string
): number {
    const destChainId = chainIdFromAlias(destinationChain);
    const destChainIdBuff = bintools.cb58Decode(destChainId);
    const toBuff = bintools.stringToAddress(to);
    const netID = activeNetwork.networkID;
    const chainID = activeNetwork.cChainID;
    const AVAX_ID = activeNetwork.avaxID;
    // Create dummy Input and Output
    const avaxIDBuff = bintools.cb58Decode(AVAX_ID);

    // Create fake ins/outs
    const txIn = new EVMInput(from, amount, avaxIDBuff);
    const secpOut = new SECPTransferOutput(amount, [toBuff]);
    const txOut = new TransferableOutput(avaxIDBuff, secpOut);

    // Create fake export Tx
    const chainIdBuff = bintools.cb58Decode(chainID);
    const exportTx = new ExportTx(netID, chainIdBuff, destChainIdBuff, [txIn], [txOut]);

    const unisgnedTx = new UnsignedTx(exportTx);

    return costExportTx(unisgnedTx);
}

/**
 * Returns the estimated gas for the export transaction.
 * @param destinationChain Either `X` or `P`
 * @param amount The amount to export. In nAVAX.
 * @param from The C chain hex address exporting the asset
 * @param fromBech The C chain bech32 address exporting the asset
 * @param to The destination address on the destination chain
 */
export async function estimateExportGasFee(
    destinationChain: ExportChainsC,
    from: string,
    fromBech: string,
    to: string,
    amount: BN
): Promise<number> {
    let exportTx = await buildEvmExportTransaction([from], to, amount, fromBech, destinationChain, new BN(0));

    return costExportTx(exportTx);
}
