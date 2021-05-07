import * as bip39 from 'bip39';
import HDKey from 'hdkey';
import { AVAX_ACCOUNT_PATH, ETH_ACCOUNT_PATH } from './constants';
import EvmWallet from './EvmWallet';
import { WalletProvider } from './Wallet';
import { WalletNameType } from './types';
// import { KeyChain as AVMKeyChain, KeyPair as AVMKeyPair, UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm';
// import { Buffer } from 'avalanche';
// import { avalanche, bintools } from '@/index';
// import { getPreferredHRP } from 'avalanche/dist/utils';
import { Transaction } from '@ethereumjs/tx';
import HdScanner from './HdScanner';
import { Tx as AVMTx, UnsignedTx as AVMUnsignedTx } from 'avalanche/dist/apis/avm';
import { Tx as PlatformTx, UnsignedTx as PlatformUnsignedTx } from 'avalanche/dist/apis/platformvm';
import { KeyPair as AVMKeyPair, KeyChain as AVMKeyChain } from 'avalanche/dist/apis/avm/keychain';
import { KeyChain as PlatformKeyChain, KeyPair as PlatformKeyPair } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';

// import Web3 from 'web3';
// import Avalanche from 'avalanche';

export default class MnemonicWallet extends WalletProvider {
    evmWallet: EvmWallet;
    type: WalletNameType = 'mnemonic';
    private accountKey: HDKey;

    private internalScan: HdScanner;
    private externalScan: HdScanner;

    constructor(accountKey: HDKey, evmWallet: EvmWallet) {
        super();
        this.accountKey = accountKey;
        this.evmWallet = evmWallet;

        this.internalScan = new HdScanner(accountKey, true);
        this.externalScan = new HdScanner(accountKey, false);
    }

    getEvmAddressBech(): string {
        return this.evmWallet.getAddressBech();
    }

    static create(): MnemonicWallet {
        const mnemonic = bip39.generateMnemonic(256);
        return MnemonicWallet.fromMnemonic(mnemonic);
    }

    static generateMnemonicPhrase(): string {
        return bip39.generateMnemonic(256);
    }

    static fromMnemonic(mnemonic: string): MnemonicWallet {
        const cleanMnemonic = mnemonic.trim();
        if (!bip39.validateMnemonic(cleanMnemonic)) {
            throw new Error('Invalid mnemonic phrase.');
        }

        let seed: globalThis.Buffer = bip39.mnemonicToSeedSync(cleanMnemonic);
        let masterHdKey: HDKey = HDKey.fromMasterSeed(seed);
        let avaxAccountHdKey = masterHdKey.derive(AVAX_ACCOUNT_PATH);
        let ethAccountKey = masterHdKey.derive(ETH_ACCOUNT_PATH + '/0/0');
        let ethKey = ethAccountKey.privateKey;
        let evmWallet = new EvmWallet(ethKey);
        return new MnemonicWallet(avaxAccountHdKey, evmWallet);
    }

    async signEvm(tx: Transaction): Promise<Transaction> {
        return this.evmWallet.signEVM(tx);
    }

    async signX(tx: AVMUnsignedTx): Promise<AVMTx> {
        return tx.sign(this.getKeyChainX());
    }

    async signP(tx: PlatformUnsignedTx): Promise<PlatformTx> {
        return tx.sign(this.getKeyChainP());
    }

    async signC(tx: EVMUnsignedTx): Promise<EVMTx> {
        return this.evmWallet.signC(tx);
    }

    private getKeyChainX(): AVMKeyChain {
        let internal = this.internalScan.getKeyChainX();
        let external = this.externalScan.getKeyChainX();
        return internal.union(external);
    }

    private getKeyChainP(): PlatformKeyChain {
        return this.externalScan.getKeyChainP();
    }

    public getExternalIndex(): number {
        return this.externalScan.getIndex();
    }

    public getInternalIndex(): number {
        return this.internalScan.getIndex();
    }

    public getAddressX(): string {
        return this.externalScan.getAddressX();
    }

    public getChangeAddressX() {
        return this.internalScan.getAddressX();
    }

    public getAddressP(): string {
        return this.externalScan.getAddressP();
    }

    public getAddressC(isBech = false): string {
        return isBech ? 'C-avax1..' : this.evmWallet.address;
    }

    // Returns every external X derived address up to active index
    public getExternalAddressesX(): string[] {
        return this.externalScan.getAllAddresses('X');
    }

    public getInternalAddressesX(): string[] {
        return this.internalScan.getAllAddresses('X');
    }

    // Returns every derived internal and external addresses
    public getAllAddressesX(): string[] {
        return [...this.getExternalAddressesX(), ...this.getInternalAddressesX()];
    }

    public getExternalAddressesP(): string[] {
        return this.externalScan.getAllAddresses('P');
    }

    public getAllAddressesP(): string[] {
        return this.getExternalAddressesP();
    }

    public async resetHdIndices() {
        await this.externalScan.resetIndex();
        await this.internalScan.resetIndex();
    }
}
