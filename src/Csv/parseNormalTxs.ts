import { HistoryItemType, isHistoryBaseTx, isHistoryEVMTx, isHistoryImportExportTx } from '@/History';
import { normalHeaders } from '@/Csv/constants';
import { createCSVContent } from '@/Csv/createCsvContent';
import { bnToBig, bnToBigAvaxC, bnToBigAvaxX } from '@/utils';
import moment from 'moment';

/**
 * Given an array of history transactions, filter the base and export/import txs and returns the body of a csv file.
 * @remarks You can download the returned string as a CSV file.
 * @param txs An array of transactions made by a wallet.
 */
export function createCsvNormal(txs: HistoryItemType[]) {
    const rows = [normalHeaders, ...parseNormalTxs(txs)];
    return createCSVContent(rows);
}

export function parseNormalTxs(txs: HistoryItemType[]) {
    const rows: string[][] = [];
    txs.map((tx) => {
        const mom = moment(tx.timestamp);
        const dateStr = mom.format();

        if (isHistoryBaseTx(tx)) {
            const tokenRows = tx.tokens.map((token) => {
                const amtStr = bnToBig(token.amount, token.asset.denomination).toString();
                return [tx.id, dateStr, tx.type, token.asset.symbol, amtStr, `"${token.addresses.join('\r')}"`, 'X'];
            });
            rows.push(...tokenRows);
        } else if (isHistoryImportExportTx(tx)) {
            const amtStr = bnToBigAvaxX(tx.amount).toString();
            rows.push([tx.id, dateStr, tx.type, 'AVAX', amtStr, '', `${tx.source} to ${tx.destination}`]);
        } else if (isHistoryEVMTx(tx)) {
            const amtStr = bnToBigAvaxC(tx.amount).toString();
            const amtSigned = tx.isSender ? `-${amtStr}` : amtStr;
            if (!tx.input) {
                const addr = tx.isSender ? tx.to : tx.from;
                rows.push([tx.id, dateStr, tx.type, 'AVAX', amtSigned, addr, `C`]);
            }
        }
    });
    return rows;
}
