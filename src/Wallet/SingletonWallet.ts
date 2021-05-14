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
import { bintools, pChain, xChain } from '@/Network/network';
import { Buffer as BufferAvalanche } from 'avalanche';
import EvmWallet from '@/Wallet/EvmWallet';
import { UnsignedTx, Tx } from 'avalanche/dist/apis/evm';
import { Transaction } from '@ethereumjs/tx';

export default class SingletonWallet extends WalletProvider {
    type: WalletNameType = 'singleton';
    key = '';
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
        let pkHex = pkBuf.toString('hex');
        let pkBuffNative = Buffer.from(pkHex, 'hex');

        this.evmWallet = new EvmWallet(pkBuffNative);
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
        return this.evmWallet.getAddressBech();
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
