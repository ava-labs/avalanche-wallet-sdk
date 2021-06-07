import { KeyPair as AVMKeyPair } from 'avalanche/dist/apis/avm';

import { BN } from 'avalanche';

import MnemonicWallet from '@/Wallet/MnemonicWallet';
import SingletonWallet from '@/Wallet/SingletonWallet';
import LedgerWallet from '@/Wallet/LedgerWallet';

import { iAssetDescriptionClean } from '@/Asset/types';

export interface IIndexKeyCache {
    [index: number]: AVMKeyPair;
}

export type ChainAlias = 'X' | 'P';
export type AvmImportChainType = 'P' | 'C';
export type AvmExportChainType = 'P' | 'C';
export type HdChainType = 'X' | 'P';

export type WalletNameType = 'mnemonic' | 'ledger' | 'singleton';
export type WalletType = MnemonicWallet | SingletonWallet | LedgerWallet;

export interface WalletBalanceX {
    [assetId: string]: AssetBalanceX;
}

export interface iAvaxBalance {
    X: AssetBalanceX;
    P: AssetBalanceP;
    C: BN;
}

export interface AssetBalanceX {
    locked: BN;
    unlocked: BN;
    meta: iAssetDescriptionClean;
}

export interface AssetBalanceRawX {
    locked: BN;
    unlocked: BN;
}

export interface AssetBalanceP {
    locked: BN;
    unlocked: BN;
    lockedStakeable: BN;
}

export interface WalletBalanceERC20 {
    [address: string]: ERC20Balance;
}

export interface ERC20Balance {
    balance: BN;
    balanceParsed: string;
    name: string;
    symbol: string;
    denomination: number;
    address: string;
}

export interface ILedgerAppConfig {
    version: string;
    commit: string;
    name: 'Avalanche';
}

export type WalletEventType = 'addressChanged' | 'balanceChangedX' | 'balanceChangedP' | 'balanceChangedC';
export type WalletEventArgsType = iWalletAddressChanged | WalletBalanceX | AssetBalanceP | BN;

export interface iWalletAddressChanged {
    X: string;
    P: string;
    changeX: string;
}

export interface iHDWalletIndex {
    external: number;
    internal: number;
}
