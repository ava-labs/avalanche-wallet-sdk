import { WalletProvider } from '@/Wallet/Wallet';
import { WalletNameType } from '@/Wallet/types';

import {
    KeyChain as AVMKeyChain,
    KeyPair as AVMKeyPair,
    UTXOSet as AVMUTXOSet,
    UnsignedTx as AVMUnsignedTx,
    Tx as AVMTx,
} from 'avalanche/dist/apis/avm';
import {
    KeyChain as PlatformKeyChain,
    KeyPair as PlatformKeyPair,
    UnsignedTx as PlatformUnsignedTx,
    Tx as PlatformTx,
} from 'avalanche/dist/apis/platformvm';
import { avalanche, pChain, xChain } from '@/Network/network';
import { Buffer as BufferAvalanche } from 'avalanche';
import EvmWallet from '@/Wallet/EvmWallet';
import { UnsignedTx, Tx, KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm';
import { Transaction } from '@ethereumjs/tx';
import { updateFilterAddresses } from '@/Network/socket_manager';
import { bintools } from '@/common';

export default class SingletonWallet extends WalletProvider {
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
        updateFilterAddresses();
    }

    // socketSubscribe(){
    //     socketX.
    // }

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

    getAllAddressesP(): string[] {
        return [this.getAddressP()];
    }

    getAllAddressesX(): string[] {
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

    getExternalAddressesP(): string[] {
        return [this.getAddressP()];
    }

    getExternalAddressesX(): string[] {
        return [this.getAddressX()];
    }

    getInternalAddressesX(): string[] {
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
