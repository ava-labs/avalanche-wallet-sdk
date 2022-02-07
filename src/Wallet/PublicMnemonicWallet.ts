import { HDWalletAbstract } from '@/Wallet/HDWalletAbstract';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { UnsignedTx as PlatformUnsignedTx, Tx as PlatformTx } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import { Transaction } from '@ethereumjs/tx';
import { WalletNameType } from '@/Wallet/types';
import { EvmWallet } from '@/Wallet/EVM/EvmWallet';
import { EvmWalletReadonly } from '@/Wallet/EVM/EvmWalletReadonly';
import * as bip32 from 'bip32';
import { importPublic } from 'ethereumjs-util';
import { computePublicKey } from 'ethers/lib/utils';
import { TypedDataV1, TypedMessage } from '@metamask/eth-sig-util';

export class PublicMnemonicWallet extends HDWalletAbstract {
    /**
     *
     * @param xpubAVM of derivation path m/44'/9000'/n' where `n` is the account index
     * @param xpubEVM of derivation path m/44'/60'/0'/0/n where `n` is the account index
     */
    constructor(xpubAVM: string, xpubEVM: string) {
        let avmAcct = bip32.fromBase58(xpubAVM);
        let evmAcct = bip32.fromBase58(xpubEVM);
        super(avmAcct);
        this.type = 'xpub';
        const uncompressedKey = computePublicKey(evmAcct.publicKey);
        this.evmWallet = new EvmWalletReadonly(uncompressedKey);
    }

    evmWallet: EvmWallet | EvmWalletReadonly;
    type: WalletNameType;

    //@ts-ignore
    signC(tx: EVMUnsignedTx): Promise<EVMTx> {
        throw new Error('Not supported.');
    }

    //@ts-ignore
    signEvm(tx: Transaction): Promise<Transaction> {
        throw new Error('Not supported.');
    }
    //@ts-ignore
    signP(tx: PlatformUnsignedTx): Promise<PlatformTx> {
        throw new Error('Not supported.');
    }

    //@ts-ignore
    signX(tx: AVMUnsignedTx): Promise<AVMTx> {
        throw new Error('Not supported.');
    }

    //@ts-ignore
    async personalSign(data: string): Promise<string> {
        throw new Error('Not supported.');
    }

    /**
     * V1 is based upon an early version of EIP-712 that lacked some later security improvements, and should generally be neglected in favor of later versions.
     * @param data The typed data to sign.
     * */
    //@ts-ignore
    signTypedData_V1(data: TypedDataV1): Promise<string> {
        throw new Error('Not supported.');
    }

    /**
     * V3 is based on EIP-712, except that arrays and recursive data structures are not supported.
     * @param data The typed data to sign.
     */
    //@ts-ignore
    signTypedData_V3(data: TypedMessage<any>): Promise<string> {
        throw new Error('Not supported.');
    }

    /**
     * V4 is based on EIP-712, and includes full support of arrays and recursive data structures.
     * @param data The typed data to sign.
     */
    //@ts-ignore
    signTypedData_V4(data: TypedMessage<any>): Promise<string> {
        throw new Error('Not supported.');
    }
}
