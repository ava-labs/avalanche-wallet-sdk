import { BN } from 'avalanche';
import { ChainIdType } from '@/types';
import { iAssetDescriptionClean } from '@/Asset/types';

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
    outputs: UTXO[] | null;

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

export type HistoryItemType = iHistoryBaseTx | iHistoryExport | iHistoryImport | iHistoryAddDelegator;

export interface iHistoryItem {
    id: string;
    type: TransactionType;
    timestamp: Date;
    fee: BN;
    memo: string;
}

export interface iHistoryExport extends iHistoryItem {
    amount: BN;
    amountClean: string;
    destination: ChainIdType;
    source: ChainIdType;
}

export interface iHistoryImport extends iHistoryItem {
    amount: BN;
    amountClean: string;
    destination: ChainIdType;
    source: ChainIdType;
}

export interface iHistoryAddDelegator extends iHistoryItem {
    nodeID: string;
    stakeStart: Date;
    stakeEnd: Date;
    amount: BN;
    amountClean: string;
    isRewarded: boolean;
}

export interface iHistoryBaseTx extends iHistoryItem {
    tokens: iHistoryBaseTxTokens;
    nfts: iHistoryBaseTxNFTs;
}

export interface iHistoryBaseTxTokens {
    sent: iHistoryBaseTxTokensSent;
    received: iHistoryBaseTxTokensReceived;
}

export interface iHistoryBaseTxNFTs {
    sent: iHistoryBaseTxNFTsSent;
    received: iHistoryBaseTxNFTsReceived;
}

export interface iHistoryBaseTxTokensReceived {
    [assetId: string]: {
        amount: BN;
        amountClean: string;
        from: string[];
        asset: iAssetDescriptionClean;
    };
}

export interface iHistoryBaseTxTokensReceivedRaw {
    [assetId: string]: BN;
}
export interface iHistoryBaseTxTokensSentRaw {
    [assetId: string]: BN;
}

export interface iHistoryBaseTxTokensSent {
    [assetId: string]: {
        amount: BN;
        amountClean: string;
        to: string[];
        asset: iAssetDescriptionClean;
    };
}

export interface iHistoryNftFamilyBalance {
    [groupNum: number]: {
        payload: string;
        amount: number;
    };
}

export interface iHistoryBaseTxNFTsReceivedRaw {
    [assetID: string]: iHistoryNftFamilyBalance;
}
export interface iHistoryBaseTxNFTsSentRaw {
    [assetID: string]: iHistoryNftFamilyBalance;
}

export interface iHistoryBaseTxNFTsSent {
    [assetID: string]: {
        groups: iHistoryNftFamilyBalance;
        to: string[];
        asset: iAssetDescriptionClean;
    };
}

export interface iHistoryBaseTxNFTsReceived {
    [assetID: string]: {
        groups: iHistoryNftFamilyBalance;
        from: string[];
        asset: iAssetDescriptionClean;
    };
}
