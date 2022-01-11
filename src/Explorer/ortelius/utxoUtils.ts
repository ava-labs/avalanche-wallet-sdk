import { OrteliusUTXO } from '@/Explorer';
import { BN } from 'avalanche';

/**
 * Returns true if this utxo is owned by any of the given addresses
 * @param ownerAddrs Addresses to check against
 * @param output The UTXO
 */
export function isOutputOwner(ownerAddrs: string[], output: OrteliusUTXO): boolean {
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
