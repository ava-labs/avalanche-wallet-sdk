import { BN } from 'avalanche';
import { ChainIdType } from '@/types';

export interface ITransactionData {
    chainID: string;
    id: string;
    inputTotals: {
        [key: string]: string;
    };
    inputs: TransactionInput[];
    memo: string;
    outputTotals: {
        [key: string]: string;
    };
    outputs: UTXO[];

    reusedAddressTotals: null;
    rewarded: boolean;
    rewardedTime: string;
    timestamp: string;
    txFee: number;
    type: TransactionType;
    validatorStart: number;
    validatorEnd: number;
    validatorNodeID: string;
}

interface TransactionInput {
    credentials: any[];
    output: UTXO;
}

export interface UTXO {
    addresses: string[] | null;
    caddresses?: string[];
    amount: string;
    assetID: string;
    chainID: string;
    groupID: number;
    id: string;
    locktime: number;
    payload?: string;
    outputIndex: number;
    outputType: number;
    redeemingTransactionID: string;
    stake?: boolean;
    threshold: number;
    timestamp: string;
    transactionID: string;
}

export type TransactionType =
    | 'base'
    | 'create_asset'
    | 'operation'
    | 'import'
    | 'export'
    | 'add_validator'
    | 'add_subnet_validator'
    | 'add_delegator'
    | 'create_chain'
    | 'create_subnet'
    | 'pvm_import'
    | 'pvm_export'
    | 'atomic_import_tx' // for c chain imports?
    | 'atomic_export_tx' // for c chain exports?
    | 'advance_time'
    | 'reward_validator';

type HistoryExportImportType = 'import' | 'export' | 'pvm_import' | 'pvm_export';

interface iHistoryItem {
    id: string;
    type: TransactionType;
    timestamp: Date;
    fee: BN;
    destination: ChainIdType;
    source: ChainIdType;
}

export interface iHistoryExport extends iHistoryItem {
    amount: BN;
    amountClean: string;
}

export interface iHistoryImport extends iHistoryItem {
    amount: BN;
    amountClean: string;
}

export interface iHistoryAddDelegator extends iHistoryItem {
    nodeID: string;
    stakeStart: Date;
    stakeEnd: Date;
    amount: BN;
    amountClean: string;
}
