import { BN } from 'avalanche';
import { iHistoryBaseTxTokenOwners } from '@/History/parsed_types';
import { OrteliusAvalancheTx, OrteliusUTXO } from '@/Explorer';

export function filterDuplicateStrings(vals: string[]) {
    return vals.filter((val, i) => vals.indexOf(val) === i);
}

export function isArraysOverlap(arr1: any[], arr2: any[]): boolean {
    let overlaps = arr1.filter((item) => arr2.includes(item));
    return overlaps.length > 0;
}

// To get the stake amount, sum the non-reward output utxos.
export function getStakeAmount(tx: OrteliusAvalancheTx): BN {
    let outs = tx.outputs || [];
    let nonRewardUtxos = outs.filter((utxo) => !utxo.rewardUtxo && utxo.stake);

    let tot = getOutputTotals(nonRewardUtxos);
    return tot;
}

/**
 * Returns UTXOs owned by the given addresses
 * @param outs UTXOs to filter
 * @param myAddrs Addresses to filter by
 */
export function getOwnedOutputs(outs: OrteliusUTXO[], myAddrs: string[]) {
    return outs.filter((out) => {
        let outAddrs = out.addresses || [];
        return isArraysOverlap(myAddrs, outAddrs);
    });
}

/**
 * Returns addresses of the given UTXOs
 * @param outs UTXOs to get the addresses of.
 */
export function getAddresses(outs: OrteliusUTXO[]): string[] {
    let allAddrs: string[] = [];

    for (let i = 0; i < outs.length; i++) {
        let out = outs[i];
        let addrs = out.addresses || [];
        allAddrs.push(...addrs);
    }

    // Remove duplicated
    return allAddrs.filter((addr, i) => allAddrs.indexOf(addr) === i);
}

/**
 * Returns only the UTXOs of the given asset id.
 * @param outs
 * @param assetID
 */
export function getAssetOutputs(outs: OrteliusUTXO[], assetID: string) {
    return outs.filter((out) => out.assetID === assetID);
}

/**
 * Returns UTXOs not owned by the given addresses
 * @param outs UTXOs to filter
 * @param myAddrs Addresses to filter by
 */
export function getNotOwnedOutputs(outs: OrteliusUTXO[], myAddrs: string[]) {
    return outs.filter((out) => {
        let outAddrs = out.addresses || [];
        return !isArraysOverlap(myAddrs, outAddrs);
    });
}

export function getOutputTotals(outs: OrteliusUTXO[]) {
    return outs.reduce((acc, out) => {
        return acc.add(new BN(out.amount));
    }, new BN(0));
}

export function getRewardOuts(outs: OrteliusUTXO[]) {
    return outs.filter((out) => out.rewardUtxo);
}

/**
 * Returns outputs belonging to the given chain ID
 * @param outs UTXOs to filter
 * @param chainID Chain ID to filter by
 */
export function getOutputsOfChain(outs: OrteliusUTXO[], chainID: string) {
    return outs.filter((out) => out.chainID === chainID);
}

/**
 * Filters the UTXOs of a certain output type
 * @param outs UTXOs to filter
 * @param type Output type to filter by
 */
export function getOutputsOfType(outs: OrteliusUTXO[], type: number) {
    return outs.filter((out) => out.outputType === type);
}

/**
 * Returns an array of Asset IDs from the given UTXOs
 * @param outs Array of UTXOs
 */
export function getOutputsAssetIDs(outs: OrteliusUTXO[]): string[] {
    let res = [];

    for (let i = 0; i < outs.length; i++) {
        let out = outs[i];
        res.push(out.assetID);
    }
    return filterDuplicateStrings(res);
}

/**
 * Returns a map of asset id to owner addresses
 * @param outs
 */
export function getOutputsAssetOwners(outs: OrteliusUTXO[]): iHistoryBaseTxTokenOwners {
    let assetIDs = getOutputsAssetIDs(outs);
    let res: iHistoryBaseTxTokenOwners = {};

    for (let i = 0; i < assetIDs.length; i++) {
        let id = assetIDs[i];
        let assetUTXOs = getAssetOutputs(outs, id);
        let addrs = getAddresses(assetUTXOs);
        res[id] = addrs;
    }

    return res;
}
