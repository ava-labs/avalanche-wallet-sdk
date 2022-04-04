import { WalletProvider } from '@/Wallet/Wallet';
import { UnsafeWallet, WalletNameType } from '@/Wallet/types';

import { KeyChain as AVMKeyChain, UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import {
    KeyChain as PlatformKeyChain,
    UnsignedTx as PlatformUnsignedTx,
    Tx as PlatformTx,
} from 'avalanche/dist/apis/platformvm';
import { pChain, xChain } from '@/Network/network';
import { Buffer as BufferAvalanche } from 'avalanche';
import { EvmWallet } from '@/Wallet/EVM/EvmWallet';
import { UnsignedTx, Tx } from 'avalanche/dist/apis/evm';
import { FeeMarketEIP1559Transaction, Transaction } from '@ethereumjs/tx';
import { bintools } from '@/common';
import { TypedDataV1, TypedMessage } from '@metamask/eth-sig-util';

export class SingletonWallet extends WalletProvider implements UnsafeWallet {
    type: WalletNameType = 'singleton';
    key = '';
    keyBuff: BufferAvalanche;
    evmWallet: EvmWallet;

    /**
     *
     * @param privateKey An avalanche private key, starts with `PrivateKey-`
     */
    constructor(privateKey: string) {
        super();

        this.key = privateKey;

        // Derive EVM key and address
        let pkBuf = bintools.cb58Decode(privateKey.split('-')[1]);
        this.keyBuff = pkBuf;

        let pkHex = pkBuf.toString('hex');
        let pkBuffNative = Buffer.from(pkHex, 'hex');

        this.evmWallet = new EvmWallet(pkBuffNative);
    }

    static fromPrivateKey(key: string): SingletonWallet {
        return new SingletonWallet(key);
    }

    static fromEvmKey(key: string): SingletonWallet {
        let keyBuff = bintools.cb58Encode(BufferAvalanche.from(key, 'hex'));
        let avmKeyStr = `PrivateKey-${keyBuff}`;
        return new SingletonWallet(avmKeyStr);
    }

    private getKeyChainX(): AVMKeyChain {
        let keyChain = xChain.newKeyChain();
        keyChain.importKey(this.key);
        return keyChain;
    }

    private getKeyChainP(): PlatformKeyChain {
        let keyChain = pChain.newKeyChain();
        keyChain.importKey(this.key);
        return keyChain;
    }

    /**
     * Returns the derived private key used by the EVM wallet.
     */
    public getEvmPrivateKeyHex(): string {
        return this.evmWallet.getPrivateKeyHex();
    }

    getAddressP(): string {
        let keyChain = this.getKeyChainP();
        return keyChain.getAddressStrings()[0];
    }

    getAddressX(): string {
        let keyChain = this.getKeyChainX();
        return keyChain.getAddressStrings()[0];
    }

    async getAllAddressesP(): Promise<string[]> {
        return [this.getAddressP()];
    }

    getAllAddressesPSync(): string[] {
        return [this.getAddressP()];
    }

    async getAllAddressesX(): Promise<string[]> {
        return [this.getAddressX()];
    }

    getAllAddressesXSync(): string[] {
        return [this.getAddressX()];
    }

    getChangeAddressX(): string {
        return this.getAddressX();
    }

    async getExternalAddressesP(): Promise<string[]> {
        return [this.getAddressP()];
    }

    getExternalAddressesPSync(): string[] {
        return [this.getAddressP()];
    }

    async getExternalAddressesX(): Promise<string[]> {
        return [this.getAddressX()];
    }

    getExternalAddressesXSync(): string[] {
        return [this.getAddressX()];
    }

    async getInternalAddressesX(): Promise<string[]> {
        return [this.getAddressX()];
    }

    getInternalAddressesXSync(): string[] {
        return [this.getAddressX()];
    }

    async signC(tx: UnsignedTx): Promise<Tx> {
        return this.evmWallet.signC(tx);
    }

    async signEvm(tx: Transaction | FeeMarketEIP1559Transaction): Promise<Transaction | FeeMarketEIP1559Transaction> {
        return this.evmWallet.signEVM(tx);
    }

    async signP(tx: PlatformUnsignedTx): Promise<PlatformTx> {
        return tx.sign(this.getKeyChainP());
    }

    async signX(tx: AVMUnsignedTx): Promise<AVMTx> {
        return tx.sign(this.getKeyChainX());
    }

    /**
     * This function is equivalent to the eth_sign Ethereum JSON-RPC method as specified in EIP-1417,
     * as well as the MetaMask's personal_sign method.
     * @param data The hex data to sign
     */
    async personalSign(data: string): Promise<string> {
        return this.evmWallet.personalSign(data);
    }

    /**
     * V1 is based upon an early version of EIP-712 that lacked some later security improvements, and should generally be neglected in favor of later versions.
     * @param data The typed data to sign.
     * */
    async signTypedData_V1(data: TypedDataV1): Promise<string> {
        return this.evmWallet.signTypedData_V1(data);
    }

    /**
     * V3 is based on EIP-712, except that arrays and recursive data structures are not supported.
     * @param data The typed data to sign.
     */
    async signTypedData_V3(data: TypedMessage<any>): Promise<string> {
        return this.evmWallet.signTypedData_V3(data);
    }

    /**
     * V4 is based on EIP-712, and includes full support of arrays and recursive data structures.
     * @param data The typed data to sign.
     */
    async signTypedData_V4(data: TypedMessage<any>): Promise<string> {
        return this.evmWallet.signTypedData_V4(data);
    }
}
