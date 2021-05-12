// import HDKey from 'hdkey';
import {
    KeyChain as AVMKeyChain,
    KeyPair as AVMKeyPair,
    UTXOSet as AVMUTXOSet,
    UTXO as AVMUTXO,
    Tx as AVMTx,
    UnsignedTx as AVMUnsignedTx,
} from 'avalanche/dist/apis/avm';

import {
    UTXOSet as PlatformUTXOSet,
    UnsignedTx as PlatformUnsignedTx,
    UTXO as PlatformUTXO,
    Tx as PlatformTx,
} from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';

// import { ITransaction } from '@/components/wallet/transfer/types';
import { BN } from 'avalanche';
// import { PayloadBase } from 'avalanche/dist/utils';
// import { ChainIdType } from '../types';

// import { Transaction } from '@ethereumjs/tx';
// import MnemonicWallet from '@/wallets/MnemonicWallet';
// import { LedgerWallet } from '@/wallets/LedgerWallet';
// import { SingletonWallet } from '@/wallets/SingletonWallet';
import MnemonicWallet from './MnemonicWallet';
import { iAssetDescriptionClean } from '@/Asset/types';
import { Transaction } from '@ethereumjs/tx';

export interface IIndexKeyCache {
    [index: number]: AVMKeyPair;
}

export type ChainAlias = 'X' | 'P';
export type AvmImportChainType = 'P' | 'C';
export type AvmExportChainType = 'P' | 'C';
export type HdChainType = 'X' | 'P';

export type WalletNameType = 'mnemonic' | 'ledger' | 'singleton';
// export type WalletType = MnemonicWallet | LedgerWallet | SingletonWallet;
export type WalletType = MnemonicWallet;

export interface WalletBalanceX {
    [assetId: string]: AssetBalanceX;
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

// Every wallet class must implement this interface
// export interface iWallet {
//     type: WalletNameType
//     utxosX: AVMUTXOSet
//     utxosP: PlatformUTXOSet
//
//     getAddressX(): string
//     getChangeAddressX(): string
//     getAddressP(): string
//     getAddressC(): string
//     getEvmAddressBech(): string
//
//     getExternalAddressesX(): string[]
//     getInternalAddressesX(): string[]
//     getExternalAddressesP(): string[]
//
//     getAllAddressesX(): string[]
//     getAllAddressesP(): string[]
//
//     signEvm(tx: Transaction): Promise<Transaction>
//     signX(tx: AVMUnsignedTx): Promise<AVMTx>
//     signP(tx: PlatformUnsignedTx): Promise<PlatformTx>
//     signC(tx: EVMUnsignedTx): Promise<EVMTx>
//
//     sendAvaxX(to: string, amount: BN, memo?: string): Promise<string>
//     sendAvaxC(to: string, amount: BN, gasPrice: BN, gasLimit: number): Promise<string>
//     sendErc20(to: string, amount: BN, gasPrice: BN, gasLimit: number, contractAddress: string): Promise<string>
//
//     updateAvaxBalanceC(): Promise<BN>
//
// }

// Every AVA Wallet must implement this.
// export interface AvaWalletCore extends IAddressManager {
//     id: string; // a random string assigned as ID to distinguish between wallets
//     type: WalletNameType;
//     chainId: string;
//     utxoset: UTXOSet;
//     platformUtxoset: PlatformUTXOSet;
//     stakeAmount: BN;
//     ethAddress: string;
//     ethAddressBech: string;
//     ethBalance: BN;
//     isFetchUtxos: boolean; // true if fetching utxos
//     isInit: boolean; // True once the wallet can be used (ex. when HD index is found)
//     onnetworkchange(): void;
//     getUTXOs(): Promise<void>;
//     getUTXOSet(): UTXOSet;
//     getStake(): Promise<BN>;
//     getPlatformUTXOSet(): PlatformUTXOSet;
//     createNftFamily(name: string, symbol: string, groupNum: number): Promise<string>;
//     mintNft(mintUtxo: AVMUTXO, payload: PayloadBase, quantity: number): Promise<string>;
//     getEthBalance(): Promise<BN>;
//     sendEth(to: string, amount: BN, gasPrice: BN, gasLimit: number): Promise<string>;
//     sendERC20(to: string, amount: BN, gasPrice: BN, gasLimit: number, contractAddress: string): Promise<string>;
//     // estimateGas(to: string, amount: BN, token: Erc20Token): Promise<number>;
//
//     signX(unsignedTx: AVMUnsignedTx): Promise<AVMTx>;
//     signP(unsignedTx: PlatformUnsignedTx): Promise<PlatformTx>;
//     signC(unsignedTx: EVMUnsignedTx): Promise<EVMTx>;
//     signEvm(tx: Transaction): Promise<Transaction>;
//     validate(
//         nodeID: string,
//         amt: BN,
//         start: Date,
//         end: Date,
//         delegationFee: number,
//         rewardAddress?: string,
//         utxos?: PlatformUTXO[]
//     ): Promise<string>;
//     delegate(
//         nodeID: string,
//         amt: BN,
//         start: Date,
//         end: Date,
//         rewardAddress?: string,
//         utxos?: PlatformUTXO[]
//     ): Promise<string>;
//     // chainTransfer(amt: BN, sourceChain: ChainIdType, destinationChain: ChainIdType): Promise<string>
//     exportFromXChain(amt: BN, destinationChain: AvmExportChainType): Promise<string>;
//     exportFromPChain(amt: BN): Promise<string>;
//     exportFromCChain(amt: BN): Promise<string>;
//
//     importToPlatformChain(): Promise<string>;
//     importToXChain(sourceChain: ChainIdType): Promise<string>;
//     importToCChain(): Promise<string>;
//     // issueBatchTx(orders: (AVMUTXO | ITransaction)[], addr: string, memo?: Buffer): Promise<string>;
//     signMessage(msg: string, address: string): Promise<string>;
// }

// export interface IAvaHdWallet extends AvaWalletCore {
//     seed: string;
//     hdKey: HDKey;
//     getMnemonic(): string;
//     getCurrentKey(): AVMKeyPair;
//     getKeyChain(): AVMKeyChain;
// }
