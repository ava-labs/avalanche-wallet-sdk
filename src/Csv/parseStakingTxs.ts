import { HistoryItemType, iHistoryStaking, isHistoryStakingTx } from '@/History';
import { bnToBigAvaxP } from '@/utils';
import moment from 'moment';
import { createCSVContent } from '@/Csv/createCsvContent';
import { stakingHeaders } from '@/Csv/constants';

/**
 * Given an array of history transactions, filter the staking txs and returns the body of a csv file.
 * @remarks You can download the returned string as a CSV file.
 * @param txs An array of transactions made by a wallet.
 */
export function createCsvStaking(txs: HistoryItemType[]) {
    // Filter only staking transactions
    const filtered = txs.filter(isHistoryStakingTx);
    // Sort by stake end date
    const sorted = filtered.sort((a, b) => {
        const aTime = a.stakeEnd.getTime();
        const bTime = b.stakeEnd.getTime();
        return bTime - aTime;
    });

    const rows = [stakingHeaders, ...parseStakingTxs(sorted)];
    return createCSVContent(rows);
}

/**
 * Parses each staking transaction according to the headers defined in constants and returns an array of strings for
 * each cell in the CSV.
 * @param txs
 */
export function parseStakingTxs(txs: iHistoryStaking[]) {
    return txs.map((tx) => {
        const txDate = moment(tx.timestamp).format();
        const stakeStart = moment(tx.stakeStart).format();
        const stakeEnd = moment(tx.stakeEnd).format();
        const now = Date.now();

        const stakeAmt = bnToBigAvaxP(tx.amount).toString();

        let rewardAmt;
        if (tx.stakeEnd.getTime() > now) {
            rewardAmt = 'Pending';
        } else if (!tx.isRewarded) {
            rewardAmt = 'Stake Not Rewarded';
        } else if (tx.rewardAmount) {
            rewardAmt = !tx.rewardAmount.isZero() ? bnToBigAvaxP(tx.rewardAmount).toString() : 'Not Reward Owner';
        } else {
            rewardAmt = 'Not Reward Owner';
        }

        return [tx.id, txDate, tx.type, tx.nodeID, stakeAmt, stakeStart, stakeEnd, tx.isRewarded.toString(), rewardAmt];
    });
}
