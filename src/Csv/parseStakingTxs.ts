import { HistoryItemType, iHistoryStaking, isHistoryStakingTx } from '@/History';
import { bnToBigAvaxP } from '@/utils';
import moment from 'moment';
import { createCSVContent } from '@/Csv/createCsvContent';
import { stakingHeaders } from '@/Csv/constants';
import Big from 'big.js';

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

        let rewardUSD;
        let rewardAmt: Big | string | undefined;

        if (tx.stakeEnd.getTime() > now) {
            // Pending
            rewardAmt = 'Pending';
        } else if (!tx.isRewarded) {
            //Stake Not Rewarded
            rewardAmt = Big(0);
        } else if (tx.rewardAmount) {
            const bigAmt = bnToBigAvaxP(tx.rewardAmount);
            rewardAmt = !tx.rewardAmount.isZero() ? bigAmt.toString() : 'Not Reward Owner';
            if (tx.avaxPrice) {
                rewardUSD = bigAmt.mul(tx.avaxPrice);
            }
        } else {
            // Not reward owner
            rewardAmt = 'Not Reward Owner';
        }

        const rewardUsdString = rewardUSD ? rewardUSD.toFixed(2) : '-';
        const avaxPriceString = tx.avaxPrice ? tx.avaxPrice.toFixed(2) : '-';

        return [
            tx.id,
            txDate,
            tx.type,
            tx.nodeID,
            stakeAmt,
            stakeStart,
            stakeEnd,
            tx.isRewarded.toString(),
            rewardAmt.toString(),
            rewardUsdString,
            avaxPriceString,
        ];
    });
}
