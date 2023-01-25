import { findDestinationChain, findSourceChain, OrteliusAvalancheTx, OrteliusTransactionType } from '@/Explorer';
import { ChainIdType } from '@/common';
import { activeNetwork, idToChainAlias } from '@/Network';
import { isOutputOwner } from '@/Explorer/ortelius/utxoUtils';
import { createCSVContent } from '@/Csv/createCsvContent';
import { bnToBig } from '@/utils';
import { BN } from 'avalanche';

interface ParsedTxUtxos {
    txID: string;
    timeStamp: Date;
    unixTime: string;
    txType: OrteliusTransactionType;
    chain: ChainIdType;
    isInput: boolean;
    isOwner: boolean;
    amount: string;
    owners: string[];
    locktime: number;
    threshold: number;
    assetID: string;
}

function isExportTx(tx: OrteliusAvalancheTx) {
    return tx.type === 'export' || tx.type === 'pvm_export' || tx.type === 'atomic_export_tx';
}

function isImport(tx: OrteliusAvalancheTx) {
    return tx.type === 'import' || tx.type === 'pvm_import' || tx.type === 'atomic_import_tx';
}

/**
 * Given an array of Ortelius transaction data return input and outputs as a single unified array
 * @param txs
 * @param ownedAddresses
 */
export function parseTxUtxos(txs: OrteliusAvalancheTx[], ownedAddresses: string[]) {
    const result: ParsedTxUtxos[] = [];
    txs.forEach((tx) => {
        const date = new Date(tx.timestamp);

        const chainId = isExportTx(tx) ? findSourceChain(tx) : findDestinationChain(tx);
        const chainAlias = idToChainAlias(chainId);

        tx.inputs?.forEach((txIn) => {
            const isAVAX = txIn.output.assetID === activeNetwork.avaxID;
            const decimals = isAVAX ? 9 : 0;
            result.push({
                txID: tx.id,
                timeStamp: date,
                unixTime: date.getTime().toString(),
                txType: tx.type,
                chain: chainAlias,
                isInput: true,
                isOwner: isOutputOwner(ownedAddresses, txIn.output),
                amount: bnToBig(new BN(txIn.output.amount), decimals).toString(),
                owners: txIn.output.addresses || txIn.output.caddresses || [],
                locktime: txIn.output.locktime,
                threshold: txIn.output.threshold,
                assetID: isAVAX ? 'AVAX' : txIn.output.assetID,
            });
        });

        tx.outputs?.forEach((txOut) => {
            const isAVAX = txOut.assetID === activeNetwork.avaxID;
            const decimals = isAVAX ? 9 : 0;

            result.push({
                txID: tx.id,
                unixTime: date.getTime().toString(),
                timeStamp: date,
                txType: tx.type,
                chain: chainAlias,
                isInput: false,
                isOwner: isOutputOwner(ownedAddresses, txOut),
                amount: bnToBig(new BN(txOut.amount), decimals).toString(),
                owners: txOut.addresses || txOut.caddresses || [],
                locktime: txOut.locktime,
                threshold: txOut.threshold,
                assetID: isAVAX ? 'AVAX' : txOut.assetID,
            });
        });
    });

    return result;
}

/**
 * Create CSV file contents from the given Ortelius transactions.
 * @param txs Array of Ortelius Transactions
 * @param ownedAddresses Addresses owned by the wallet.
 */
export function createCsvFileOrtelius(txs: OrteliusAvalancheTx[], ownedAddresses: string[]) {
    type CsvRow = [string, string, string, string, string, string, string, string, string, string, string, string];
    const parsed = parseTxUtxos(txs, ownedAddresses);

    const headers: CsvRow = [
        'Tx ID',
        'Timestamp',
        'UNIX Timestamp',
        'Tx Type',
        'Chain',
        'input/output',
        'Owned',
        'Amount',
        'Asset ID',
        'Owners',
        'Locktime',
        'Threshold',
    ];
    const rows: CsvRow[] = [];

    const unsupportedtypes: OrteliusTransactionType[] = [
        'add_validator',
        'add_delegator',
        'add_subnet_validator',
        'operation',
        'create_asset',
        'create_subnet',
        'create_chain',
    ];
    parsed.forEach((tx) => {
        if (unsupportedtypes.includes(tx.txType)) return;
        rows.push([
            tx.txID,
            tx.timeStamp.toISOString(),
            tx.unixTime,
            tx.txType,
            tx.chain,
            tx.isInput ? 'input' : 'output',
            tx.isOwner ? 'TRUE' : 'FALSE',
            `"${tx.amount}"`,
            tx.assetID,
            `"${tx.owners.join('\n')}"`,
            tx.locktime.toString(),
            tx.threshold.toString(),
        ]);
    });
    return createCSVContent([headers, ...rows]);
}
