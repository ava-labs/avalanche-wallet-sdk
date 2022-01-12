import { SnowtraceErc20Tx, SnowtraceNormalTx } from '@/Explorer';

/**
 * Filter duplicate Snowtrace transactions
 * @param txs
 */
export function filterDuplicateTransactions<Tx extends SnowtraceErc20Tx | SnowtraceNormalTx>(txs: Tx[]) {
    const hashes = txs.map((tx) => tx.hash);
    return txs.filter((tx, i) => {
        return hashes.indexOf(tx.hash) === i;
    });
}
