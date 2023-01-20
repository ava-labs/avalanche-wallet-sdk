import { OrteliusUTXO } from '@/Explorer';
import { BN } from 'avalanche';
import { iHistoryBaseTxTokenOwners } from '@/History';
import { strip0x } from '@/utils';

export function filterDuplicateStrings(vals: string[]) {
    return vals.filter((val, i) => vals.indexOf(val) === i);
}

export function isArraysOverlap(arr1: any[], arr2: any[]): boolean {
    let overlaps = arr1.filter((item) => arr2.includes(item));
    return overlaps.length > 0;
}

/**
 * Returns true if this utxo is owned by any of the given addresses
 * @param ownerAddrs Addresses to check against
 * @param output The UTXO
 */
export function isOutputOwner(ownerAddrs: string[], output: OrteliusUTXO): boolean {
    // Remove prefix from owner addresses
    ownerAddrs = ownerAddrs.map((addr) => {
        const split = addr.split('-');
        return split[1] || split[0];
    });
    let outAddrs = output.addresses;
    if (!outAddrs) return false;

    let totAddrs = outAddrs.filter((addr) => {
        return ownerAddrs.includes(addr);
    });

    return totAddrs.length > 0;
}

export function isOutputOwnerC(ownerAddr: string, output: OrteliusUTXO): boolean {
    let outAddrs = output.caddresses;
    if (!outAddrs) return false;
    return outAddrs.includes(ownerAddr);
}

/**
 * Returns the total amount of `assetID` in the given `utxos` owned by `address`. Checks for X/P addresses.
 * @param utxos UTXOs to calculate balance from.
 * @param addresses The wallet's  addresses.
 * @param assetID Only count outputs of this asset ID.
 * @param chainID Only count the outputs on this chain.
 * @param isStake Set to `true` if looking for staking utxos.
 */
export function getAssetBalanceFromUTXOs(
    utxos: OrteliusUTXO[],
    addresses: string[],
    assetID: string,
    chainID: string,
    isStake = false
) {
    let myOuts = utxos.filter((utxo) => {
        if (
            assetID === utxo.assetID &&
            isOutputOwner(addresses, utxo) &&
            chainID === utxo.chainID &&
            utxo.stake === isStake
        ) {
            return true;
        }
        return false;
    });

    let tot = myOuts.reduce((acc, utxo) => {
        return acc.add(new BN(utxo.amount));
    }, new BN(0));

    return tot;
}

/**
 * Returns the total amount of `assetID` in the given `utxos` owned by `address`. Checks for EVM address.
 * @param utxos UTXOs to calculate balance from.
 * @param address The wallet's  evm address `0x...`.
 * @param assetID Only count outputs of this asset ID.
 * @param chainID Only count the outputs on this chain.
 * @param isStake Set to `true` if looking for staking utxos.
 */
export function getEvmAssetBalanceFromUTXOs(
    utxos: OrteliusUTXO[],
    address: string,
    assetID: string,
    chainID: string,
    isStake = false
) {
    let myOuts = utxos.filter((utxo) => {
        if (
            assetID === utxo.assetID &&
            isOutputOwnerC(address, utxo) &&
            chainID === utxo.chainID &&
            utxo.stake === isStake
        ) {
            return true;
        }
        return false;
    });

    let tot = myOuts.reduce((acc, utxo) => {
        return acc.add(new BN(utxo.amount));
    }, new BN(0));

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
        let cAddrs = out.caddresses || [];

        // Strip 0x and normalize C addresses
        const cAddrsClean = cAddrs.map((addr) => {
            return strip0x(addr.toLowerCase());
        });

        return isArraysOverlap(myAddrs, [...outAddrs, ...cAddrsClean]);
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
