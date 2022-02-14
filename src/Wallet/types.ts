import { KeyPair as AVMKeyPair } from 'avalanche/dist/apis/avm';

import { BN } from 'avalanche';

import { MnemonicWallet } from '@/Wallet/MnemonicWallet';
import { SingletonWallet } from '@/Wallet/SingletonWallet';
import { LedgerWallet } from '@/Wallet/Ledger';

import { iAssetDescriptionClean } from '@/Asset/types';

export interface IIndexKeyCache {
    [index: number]: AVMKeyPair;
}

export type ChainAlias = 'X' | 'P';
export type ExportChainsX = 'P' | 'C';
export type ExportChainsP = 'X' | 'C';
export type ExportChainsC = 'X' | 'P';

export type HdChainType = 'X' | 'P';

export type WalletNameType = 'mnemonic' | 'ledger' | 'singleton' | 'xpub';
export type WalletType = MnemonicWallet | SingletonWallet | LedgerWallet;

export interface WalletBalanceX {
    [assetId: string]: AssetBalanceX;
}

export interface WalletCollectiblesX {
    [familyId: string]: WalletCollectiblesXFamily;
}

export interface WalletCollectiblesXFamily {
    groups: {
        [groupID: number]: WalletCollectiblesXGroup;
    };
}

export interface WalletCollectiblesXGroup {
    payload: string;
    quantity: number;
    id: number;
}

export interface iAvaxBalance {
    X: AssetBalanceRawX;
    P: AssetBalanceP;
    C: BN;
}

export interface AssetBalanceRawX {
    locked: BN;
    unlocked: BN;
}

export interface AssetBalanceX extends AssetBalanceRawX {
    meta: iAssetDescriptionClean;
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

export type WalletEventType = 'addressChanged' | 'balanceChangedX' | 'balanceChangedP' | 'balanceChangedC' | 'hd_ready';
export type WalletEventArgsType = iWalletAddressChanged | WalletBalanceX | AssetBalanceP | BN | iHDWalletIndex;

export interface iWalletAddressChanged {
    X: string;
    P: string;
    changeX: string;
}

export interface iHDWalletIndex {
    external: number;
    internal: number;
}

export type BTCNetworkType = 'bitcoin' | 'testnet' | 'regtest';

/**
 * Used by wallets which can access their private keys
 */
export interface UnsafeWallet {
    getEvmPrivateKeyHex(): string;
}
