import { BN } from 'avalanche';
import { ChainIdType } from '@/types';
import { iAssetDescriptionClean } from '@/Asset/types';

export interface ITransactionDataEVM {
    block: string;
    hash: string;
    createdAt: string;
    nonce: number;
    gasPrice: string;
    gasLimit: number;
    blockGasUsed: number;
    blockGasLimit: number;
    blockNonce: number;
    blockHash: string;
    recipient: string;
    value: string;
    toAddr: string;
    fromAddr: string;
    v: string;
    r: string;
    s: string;
    traces: [
        {
            callType: string;
            to: string;
            from: string;
            type: string;
            gasUsed: string;
            gas: string;
            value: string;
        }
    ];
}

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
    credentials: TransactionCredential[];
    output: UTXO;
}

interface TransactionCredential {
    address: string;
    public_key: string;
    signature: string;
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
    inChainID: string;
    outChainID: string;
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

export type HistoryItemType = AVMHistoryItemType | EVMHistoryITemType;

export type AVMHistoryItemType = iHistoryBaseTx | iHistoryImportExport | iHistoryAddDelegator;
export type EVMHistoryITemType = iHistoryEVMTx;

export type HistoryImportExportTypeName = 'import' | 'export';
export type HistoryItemTypeName =
    | HistoryImportExportTypeName
    | 'transaction'
    | 'transaction_evm'
    | 'add_delegator'
    | 'add_validator';

export interface iHistoryItem {
    id: string;
    type: HistoryItemTypeName;
    timestamp: Date;
    fee: BN;
    memo: string;
}

export interface iHistoryImportExport extends iHistoryItem {
    amount: BN;
    type: HistoryImportExportTypeName;
    amountClean: string;
    destination: ChainIdType;
    source: ChainIdType;
}

// export interface iHistoryImport extends iHistoryItem {
//     amount: BN;
//     amountClean: string;
//     destination: ChainIdType;
//     source: ChainIdType;
// }

export interface iHistoryAddDelegator extends iHistoryItem {
    nodeID: string;
    stakeStart: Date;
    stakeEnd: Date;
    amount: BN;
    amountClean: string;
    isRewarded: boolean;
}

/**
 * Interface for parsed X chain base/operation transactions.
 */
export interface iHistoryBaseTx extends iHistoryItem {
    tokens: iHistoryBaseTxTokens;
    nfts: iHistoryBaseTxNFTs;
}

/**
 * Interface for parsed EVM transactions.
 */
export interface iHistoryEVMTx extends iHistoryItem {
    hash: string;
    block: string;
    gasLimit: number;
    gasPrice: string;
    from: string;
    to: string;
    amount: BN;
    amountClean: string;
    isSender: boolean;
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
