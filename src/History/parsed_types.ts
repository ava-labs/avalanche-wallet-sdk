import { BN } from 'avalanche';
import { ChainIdType } from '@/types';
import { iAssetDescriptionClean } from '@/Asset/types';

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
    tokens: iHistoryBaseTxToken[];
    // nfts: iHistoryBaseTxNFTs;
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

// export interface iHistoryBaseTxTokens {
//     sent: iHistoryBaseTxTokensSent;
//     received: iHistoryBaseTxTokensReceived;
// }

export interface iHistoryBaseTxToken {
    // isSent: boolean
    amount: BN;
    amountClean: string;
    addresses: string[];
    asset: iAssetDescriptionClean;
}

export interface iHistoryBaseTxNFTs {
    sent: iHistoryBaseTxNFTsSent;
    received: iHistoryBaseTxNFTsReceived;
}

export interface iHistoryBaseTxTokenLossGain {
    [assetId: string]: BN;
}

export interface iHistoryBaseTxTokenOwners {
    [assetId: string]: string[];
}

// export interface iHistoryBaseTxTokensReceived {
//     [assetId: string]: {
//         amount: BN;
//         amountClean: string;
//         from: string[];
//         asset: iAssetDescriptionClean;
//     };
// }

// export interface iHistoryBaseTxTokensReceivedRaw {
//     [assetId: string]: BN;
// }
// export interface iHistoryBaseTxTokensSentRaw {
//     [assetId: string]: BN;
// }

// export interface iHistoryBaseTxTokensSent {
//     [assetId: string]: {
//         amount: BN;
//         amountClean: string;
//         to: string[];
//         asset: iAssetDescriptionClean;
//     };
// }

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
