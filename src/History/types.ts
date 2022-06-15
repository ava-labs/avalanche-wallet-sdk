import { BN } from 'avalanche';
import { ChainIdType } from '@/common';
import { iAssetDescriptionClean } from '@/Asset/types';
import { OrteliusAvalancheTx, OrteliusEvmTx } from '@/Explorer';

export type HistoryItemType = AVMHistoryItemType | PVMHistoryItemType | EVMHistoryITemType | iHistoryItem;

export type AVMHistoryItemType = iHistoryBaseTx | iHistoryImportExport;
export type PVMHistoryItemType = iHistoryStaking;
export type EVMHistoryITemType = iHistoryEVMTx;

export type HistoryImportExportTypeName = 'import' | 'export';
export type HistoryItemTypeName =
    | HistoryImportExportTypeName
    | 'transaction'
    | 'transaction_evm'
    | 'add_delegator'
    | 'add_validator'
    | 'delegation_fee'
    | 'validation_fee'
    | 'not_supported';

export interface iHistoryItem {
    id: string;
    type: HistoryItemTypeName;
    timestamp: Date;
    fee: BN;
    memo?: string;
    tx: OrteliusEvmTx | OrteliusAvalancheTx;
}

/**
 * Parsed interface for Import and Export transactions.
 */
export interface iHistoryImportExport extends iHistoryItem {
    amount: BN;
    type: HistoryImportExportTypeName;
    amountDisplayValue: string;
    destination: ChainIdType;
    source: ChainIdType;
    tx: OrteliusAvalancheTx;
}

/**
 * Typeguard for `iHistoryImportExport` interface
 * @param tx The parsed history object
 */
export function isHistoryImportExportTx(tx: HistoryItemType): tx is iHistoryImportExport {
    return tx.type === 'export' || tx.type === 'import';
}

/**
 * Parsed interface for Validation, Validation Fee, Delegation and Delegation Fee transactions.
 */
export interface iHistoryStaking extends iHistoryItem {
    nodeID: string;
    stakeStart: Date;
    stakeEnd: Date;
    amount: BN;
    amountDisplayValue: string;
    isRewarded: boolean;
    rewardAmount?: BN;
    rewardAmountDisplayValue?: string;
    tx: OrteliusAvalancheTx;
}

/**
 * Typeguard for `iHistoryStaking` interface
 * @param tx The parsed history object
 */
export function isHistoryStakingTx(tx: HistoryItemType): tx is iHistoryStaking {
    let types: HistoryItemTypeName[] = ['add_validator', 'add_delegator', 'validation_fee', 'delegation_fee'];
    return types.includes(tx.type);
}

/**
 * Interface for parsed X chain base transactions.
 */
export interface iHistoryBaseTx extends iHistoryItem {
    tokens: iHistoryBaseTxToken[];
    // nfts: iHistoryBaseTxNFTs;
    tx: OrteliusAvalancheTx;
}

/**
 * Typeguard for `iHistoryBaseTx` interface
 * @param tx The parsed history object
 */
export function isHistoryBaseTx(tx: HistoryItemType): tx is iHistoryBaseTx {
    return tx.type === 'transaction';
}

/**
 * Interface for parsed EVM transactions.
 */
export interface iHistoryEVMTx extends iHistoryItem {
    block: string;
    gasLimit: number;
    gasPrice: string;
    from: string;
    to: string;
    amount: BN;
    amountDisplayValue: string;
    isSender: boolean;
    input?: string;
    tx: OrteliusEvmTx;
}

export function isHistoryEVMTx(tx: HistoryItemType): tx is iHistoryEVMTx {
    return tx.type === 'transaction_evm';
}

export interface iHistoryBaseTxToken {
    amount: BN;
    amountDisplayValue: string;
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
