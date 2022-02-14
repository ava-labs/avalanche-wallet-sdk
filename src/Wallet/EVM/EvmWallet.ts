import { Buffer as BufferAvalanche } from 'avalanche';
import { FeeMarketEIP1559Transaction, Transaction } from '@ethereumjs/tx';
import { avalanche } from '@/Network/network';
import {
    KeyChain as EVMKeyChain,
    KeyPair as EVMKeyPair,
    Tx as EVMTx,
    UnsignedTx as EVMUnsignedTx,
} from 'avalanche/dist/apis/evm';
import { EvmWalletReadonly } from '@/Wallet/EVM/EvmWalletReadonly';
import { bintools } from '@/common';
import { computePublicKey } from 'ethers/lib/utils';
import {
    MessageTypes,
    personalSign,
    signTypedData,
    SignTypedDataVersion,
    TypedDataV1,
    TypedMessage,
} from '@metamask/eth-sig-util';
import * as bitcoin from 'bitcoinjs-lib';
export class EvmWallet extends EvmWalletReadonly {
    private privateKey: Buffer;
    private btcPair: bitcoin.ECPairInterface;

    constructor(key: Buffer) {
        // Compute the uncompressed public key from private key
        let pubKey = computePublicKey(key);

        super(pubKey);

        this.btcPair = bitcoin.ECPair.fromPrivateKey(key);
        this.privateKey = key;
    }

    static fromPrivateKey(key: string) {
        return new EvmWallet(Buffer.from(key, 'hex'));
    }

    private getPrivateKeyBech(): string {
        return `PrivateKey-` + bintools.cb58Encode(BufferAvalanche.from(this.privateKey));
    }

    getKeyChain(): EVMKeyChain {
        let keychain = new EVMKeyChain(avalanche.getHRP(), 'C');
        keychain.importKey(this.getPrivateKeyBech());
        return keychain;
    }

    getKeyPair(): EVMKeyPair {
        let keychain = new EVMKeyChain(avalanche.getHRP(), 'C');
        return keychain.importKey(this.getPrivateKeyBech());
    }

    signEVM(tx: Transaction | FeeMarketEIP1559Transaction) {
        return tx.sign(this.privateKey);
    }

    signBTCHash(hash: Buffer) {
        return this.btcPair.sign(hash);
    }

    signC(tx: EVMUnsignedTx): EVMTx {
        return tx.sign(this.getKeyChain());
    }

    getPrivateKeyHex(): string {
        return this.privateKey.toString('hex');
    }

    /**
     * This function is equivalent to the eth_sign Ethereum JSON-RPC method as specified in EIP-1417,
     * as well as the MetaMask's personal_sign method.
     * @param data The hex data to sign. Must start with `0x`.
     */
    personalSign(data: string) {
        return personalSign({ privateKey: this.privateKey, data });
    }

    /**
     * Sign typed data according to EIP-712. The signing differs based upon the version.
     * V1 is based upon an early version of EIP-712 that lacked some later security improvements, and should generally be neglected in favor of later versions.
     * V3 is based on EIP-712, except that arrays and recursive data structures are not supported.
     * V4 is based on EIP-712, and includes full support of arrays and recursive data structures.
     * @param data The typed data to sign.
     * @param version The signing version to use.
     */
    signTypedData<V extends SignTypedDataVersion, T extends MessageTypes>(
        data: V extends 'V1' ? TypedDataV1 : TypedMessage<T>,
        version: V
    ) {
        return signTypedData({
            privateKey: this.privateKey,
            data,
            version,
        });
    }

    /**
     * V1 is based upon an early version of EIP-712 that lacked some later security improvements, and should generally be neglected in favor of later versions.
     * @param data The typed data to sign.
     * */
    signTypedData_V1(data: TypedDataV1) {
        return this.signTypedData(data, SignTypedDataVersion.V1);
    }

    /**
     * V3 is based on EIP-712, except that arrays and recursive data structures are not supported.
     * @param data The typed data to sign.
     */
    signTypedData_V3(data: TypedMessage<any>) {
        return this.signTypedData(data, SignTypedDataVersion.V3);
    }

    /**
     * V4 is based on EIP-712, and includes full support of arrays and recursive data structures.
     * @param data The typed data to sign.
     */
    signTypedData_V4(data: TypedMessage<any>) {
        return this.signTypedData(data, SignTypedDataVersion.V4);
    }
}
