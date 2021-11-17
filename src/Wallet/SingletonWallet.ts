import { WalletProvider } from '@/Wallet/Wallet';
import { UnsafeWallet, WalletNameType } from '@/Wallet/types';

import { KeyChain as AVMKeyChain, UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import {
    KeyChain as PlatformKeyChain,
    UnsignedTx as PlatformUnsignedTx,
    Tx as PlatformTx,
} from 'avalanche/dist/apis/platformvm';
import { avalanche, pChain, xChain } from '@/Network/network';
import { Buffer as BufferAvalanche } from 'avalanche';
import EvmWallet from '@/Wallet/EvmWallet';
import { UnsignedTx, Tx, KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm';
import { Transaction } from '@ethereumjs/tx';
import { bintools } from '@/common';

export default class SingletonWallet extends WalletProvider implements UnsafeWallet {
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

    getAddressC(): string {
        return this.evmWallet.getAddress();
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

    async getAllAddressesX(): Promise<string[]> {
        return [this.getAddressX()];
    }

    getChangeAddressX(): string {
        return this.getAddressX();
    }

    getEvmAddressBech(): string {
        let keypair = new EVMKeyPair(avalanche.getHRP(), 'C');
        keypair.importKey(this.keyBuff);
        return keypair.getAddressString();
    }

    async getExternalAddressesP(): Promise<string[]> {
        return [this.getAddressP()];
    }

    async getExternalAddressesX(): Promise<string[]> {
        return [this.getAddressX()];
    }

    async getInternalAddressesX(): Promise<string[]> {
        return [this.getAddressX()];
    }

    async signC(tx: UnsignedTx): Promise<Tx> {
        return this.evmWallet.signC(tx);
    }

    async signEvm(tx: Transaction): Promise<Transaction> {
        return this.evmWallet.signEVM(tx);
    }

    async signP(tx: PlatformUnsignedTx): Promise<PlatformTx> {
        return tx.sign(this.getKeyChainP());
    }

    async signX(tx: AVMUnsignedTx): Promise<AVMTx> {
        return tx.sign(this.getKeyChainX());
    }
}
