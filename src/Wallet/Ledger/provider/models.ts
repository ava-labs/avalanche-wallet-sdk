import { Bip32Path } from 'bip32-path';
import Transport from '@ledgerhq/hw-transport';

import AppObsidian from '@obsidiansystems/hw-app-avalanche';
import AppZondax from '@avalabs/hw-app-avalanche';

export interface LedgerProvider {
    type: LedgerProviderType;
    getApp(t: Transport): AppObsidian | AppZondax;
    getAddress(
        t: Transport,
        path: Bip32Path,
        config: {
            show: boolean;
            hrp: string;
            chainId?: string;
        }
    ): Promise<{
        publicKey: Buffer;
    }>;

    getXPUB(
        t: Transport,
        path: string,
        config?: {
            show?: boolean;
            hrp?: string;
            chainId?: string;
        }
    ): Promise<{
        pubKey: Buffer;
        chainCode: Buffer;
    }>;

    signHash(
        t: Transport,
        hash: Buffer,
        accountPath: Bip32Path,
        signers: Bip32Path[]
    ): Promise<{
        hash: Buffer;
        signatures: Map<string, Buffer>;
    }>;

    /**
     *
     * @param tx
     * @param accountPath eg. m/44'/9000'/0'
     * @param signers eg. [0/0, 1/0]
     * @param changePaths eg. [0/0, 1/0]
     */
    signTx(
        t: Transport,
        tx: Buffer,
        accountPath: Bip32Path,
        signers: Bip32Path[],
        changePaths?: Bip32Path[]
    ): Promise<{
        signatures: Map<string, Buffer>;
    }>;

    getVersion(t: Transport): Promise<string>;

    canParseTx(txSize: number, signersSize: number, changePathsSize: number): boolean;
}

export type LedgerProviderType = 'obsidian' | 'zondax';
