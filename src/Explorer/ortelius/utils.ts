import { OrteliusAvalancheTx } from '@/Explorer';

/**
 * Given an array of transactions from the explorer, filter out duplicate transactions
 * @param txs
 */
export function filterDuplicateOrtelius(txs: OrteliusAvalancheTx[]) {
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

// If any of the outputs has a different chain ID, that's the destination chain
// else return current chain
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
