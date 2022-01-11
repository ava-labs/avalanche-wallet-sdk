// If any of the outputs has a different chain ID, that's the destination chain
// else return current chain
import { iHistoryNftFamilyBalance } from '@/History';
import { BN } from 'avalanche';
import { AVMConstants } from 'avalanche/dist/apis/avm';
import { parseNftPayload } from '@/utils';
import { OrteliusAvalancheTx, OrteliusUTXO } from '@/Explorer';

/**
 * Returns the destination chain id.
 * @param tx Tx data from the explorer.
 */
export function findDestinationChain(tx: OrteliusAvalancheTx): string {
    let baseChain = tx.chainID;
    let outs = tx.outputs || [];

    for (let i = 0; i < outs.length; i++) {
        let outChainId = outs[i].outChainID;
        if (!outChainId) continue;
        if (outChainId !== baseChain) return outChainId;
    }
    return baseChain;
}

// If any of the inputs has a different chain ID, thats the source chain
// else return current chain
/**
 * Returns the source chain id.
 * @param tx Tx data from the explorer.
 */
export function findSourceChain(tx: OrteliusAvalancheTx): string {
    let baseChain = tx.chainID;
    let ins = tx.inputs || [];

    for (let i = 0; i < ins.length; i++) {
        let inChainId = ins[i].output.inChainID;
        if (!inChainId) continue;
        if (inChainId !== baseChain) return inChainId;
    }
    return baseChain;
}

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
 * Given an array of transactions from the explorer, filter out duplicate transactions
 * @param txs
 */
export function filterDuplicateTransactions(txs: OrteliusAvalancheTx[]) {
    let txsIds: string[] = [];
    let filtered: OrteliusAvalancheTx[] = [];

    for (let i = 0; i < txs.length; i++) {
        let tx = txs[i];
        let txId = tx.id;

        if (txsIds.includes(txId)) {
            continue;
        } else {
            txsIds.push(txId);
            filtered.push(tx);
        }
    }
    return filtered;
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

export function getNFTBalanceFromUTXOs(
    utxos: OrteliusUTXO[],
    addresses: string[],
    assetID: string
): iHistoryNftFamilyBalance {
    let nftUTXOs = utxos.filter((utxo) => {
        if (
            utxo.outputType === AVMConstants.NFTXFEROUTPUTID &&
            utxo.assetID === assetID &&
            isOutputOwner(addresses, utxo)
        ) {
            return true;
        }
        return false;
    });

    let res: iHistoryNftFamilyBalance = {};
    for (let i = 0; i < nftUTXOs.length; i++) {
        let utxo = nftUTXOs[i];
        let groupID = utxo.groupID;

        let content;
        if (utxo.payload) {
            let parsedPayload = parseNftPayload(utxo.payload);
            content = parsedPayload.getContent().toString();
        }

        if (res[groupID]) {
            res[groupID].amount++;
        } else {
            res[groupID] = {
                payload: content || '',
                amount: 1,
            };
        }
    }
    return res;
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
 * Parse the raw memo field to readable text.
 * @param raw
 */
export function parseMemo(raw: string): string {
    const memoText = new Buffer(raw, 'base64').toString('utf8');

    // Bug that sets memo to empty string (AAAAAA==) for some tx types
    if (!memoText.length || raw === 'AAAAAA==') return '';
    return memoText;
}
