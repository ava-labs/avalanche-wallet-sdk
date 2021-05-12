import * as bip39 from 'bip39';
import HDKey from 'hdkey';
import { AVAX_ACCOUNT_PATH, ETH_ACCOUNT_PATH } from './constants';
import EvmWallet from './EvmWallet';
import { WalletProvider } from './Wallet';
import { WalletNameType } from './types';
// import { KeyChain as AVMKeyChain, KeyPair as AVMKeyPair, UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm';
import { Buffer } from 'avalanche';
// import { avalanche, bintools } from '@/index';
// import { getPreferredHRP } from 'avalanche/dist/utils';
import { Transaction } from '@ethereumjs/tx';
import HdScanner from './HdScanner';
import { Tx as AVMTx, UnsignedTx as AVMUnsignedTx } from 'avalanche/dist/apis/avm';
import { Tx as PlatformTx, UnsignedTx as PlatformUnsignedTx } from 'avalanche/dist/apis/platformvm';
import { KeyPair as AVMKeyPair, KeyChain as AVMKeyChain } from 'avalanche/dist/apis/avm/keychain';
import { KeyChain as PlatformKeyChain, KeyPair as PlatformKeyPair } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { bintools } from '@/Network/network';
import { digestMessage } from '@/utils/utils';

// import Web3 from 'web3';
// import Avalanche from 'avalanche';

export default class MnemonicWallet extends WalletProvider {
    evmWallet: EvmWallet;
    type: WalletNameType = 'mnemonic';
    mnemonic: string;
    private accountKey: HDKey;

    private internalScan: HdScanner;
    private externalScan: HdScanner;

    constructor(mnemonic: string) {
        super();

        const cleanMnemonic = mnemonic.trim();
        if (!bip39.validateMnemonic(cleanMnemonic)) {
            throw new Error('Invalid mnemonic phrase.');
        }

        let seed: globalThis.Buffer = bip39.mnemonicToSeedSync(cleanMnemonic);
        let masterHdKey: HDKey = HDKey.fromMasterSeed(seed);
        let accountKey = masterHdKey.derive(AVAX_ACCOUNT_PATH);
        let ethAccountKey = masterHdKey.derive(ETH_ACCOUNT_PATH + '/0/0');
        let ethKey = ethAccountKey.privateKey;
        let evmWallet = new EvmWallet(ethKey);

        this.mnemonic = mnemonic;

        this.accountKey = accountKey;
        this.evmWallet = evmWallet;

        this.internalScan = new HdScanner(accountKey, true);
        this.externalScan = new HdScanner(accountKey, false);
    }

    /**
     * Gets the active address on the C chain in Bech32 encoding
     * @return
     * Bech32 representation of the EVM address.
     */
    getEvmAddressBech(): string {
        return this.evmWallet.getAddressBech();
    }

    /**
     * Generates a 24 word mnemonic phrase and initializes a wallet instance with it.
     * @return Returns the initialized wallet.
     */
    static create(): MnemonicWallet {
        const mnemonic = bip39.generateMnemonic(256);
        return MnemonicWallet.fromMnemonic(mnemonic);
    }

    /**
     * Returns a new 24 word mnemonic key phrase.
     */
    static generateMnemonicPhrase(): string {
        return bip39.generateMnemonic(256);
    }

    /**
     * Returns a new instance of a Mnemonic wallet from the given key phrase.
     * @param mnemonic The 24 word mnemonic phrase of the wallet
     */
    static fromMnemonic(mnemonic: string): MnemonicWallet {
        return new MnemonicWallet(mnemonic);
        // const cleanMnemonic = mnemonic.trim();
        // if (!bip39.validateMnemonic(cleanMnemonic)) {
        //     throw new Error('Invalid mnemonic phrase.');
        // }
        //
        // let seed: globalThis.Buffer = bip39.mnemonicToSeedSync(cleanMnemonic);
        // let masterHdKey: HDKey = HDKey.fromMasterSeed(seed);
        // let avaxAccountHdKey = masterHdKey.derive(AVAX_ACCOUNT_PATH);
        // let ethAccountKey = masterHdKey.derive(ETH_ACCOUNT_PATH + '/0/0');
        // let ethKey = ethAccountKey.privateKey;
        // let evmWallet = new EvmWallet(ethKey);
        // return new MnemonicWallet(avaxAccountHdKey, evmWallet);
    }

    /**
     * Signs an EVM transaction on the C chain.
     * @param tx The unsigned transaction
     */
    async signEvm(tx: Transaction): Promise<Transaction> {
        return this.evmWallet.signEVM(tx);
    }

    /**
     * Signs an AVM transaction.
     * @param tx The unsigned transaction
     */
    async signX(tx: AVMUnsignedTx): Promise<AVMTx> {
        return tx.sign(this.getKeyChainX());
    }

    /**
     * Signs a PlatformVM transaction.
     * @param tx The unsigned transaction
     */
    async signP(tx: PlatformUnsignedTx): Promise<PlatformTx> {
        return tx.sign(this.getKeyChainP());
    }

    /**
     * Signs a C chain transaction
     * @remarks
     * Used for Import and Export transactions on the C chain. For everything else, use `this.signEvm()`
     * @param tx The unsigned transaction
     */
    async signC(tx: EVMUnsignedTx): Promise<EVMTx> {
        return this.evmWallet.signC(tx);
    }

    /**
     * Returns a keychain with the keys of every derived X chain address.
     * @private
     */
    private getKeyChainX(): AVMKeyChain {
        let internal = this.internalScan.getKeyChainX();
        let external = this.externalScan.getKeyChainX();
        return internal.union(external);
    }

    /**
     * Returns a keychain with the keys of every derived P chain address.
     * @private
     */
    private getKeyChainP(): PlatformKeyChain {
        return this.externalScan.getKeyChainP();
    }

    /**
     * Returns current index used for external address derivation.
     */
    public getExternalIndex(): number {
        return this.externalScan.getIndex();
    }

    /**
     * Returns current index used for internal address derivation.
     */
    public getInternalIndex(): number {
        return this.internalScan.getIndex();
    }

    /**
     * Gets the active external address on the X chain
     * - The X address will change after every deposit.
     */
    public getAddressX(): string {
        return this.externalScan.getAddressX();
    }

    /**
     * Gets the active change address on the X chain
     * - The change address will change after every transaction on the X chain.
     */
    public getChangeAddressX() {
        return this.internalScan.getAddressX();
    }

    /**
     * Gets the active address on the P chain
     */
    public getAddressP(): string {
        return this.externalScan.getAddressP();
    }

    /**
     * Gets the active address on the C chain
     * @return
     * Hex representation of the EVM address.
     */
    public getAddressC(): string {
        return this.evmWallet.address;
    }

    /**
     * Returns every external X chain address used by the wallet up to now.
     */
    public getExternalAddressesX(): string[] {
        return this.externalScan.getAllAddresses('X');
    }

    /**
     * Returns every internal X chain address used by the wallet up to now.
     */
    public getInternalAddressesX(): string[] {
        return this.internalScan.getAllAddresses('X');
    }

    /**
     * Returns every X chain address used by the wallet up to now (internal + external).
     */
    public getAllAddressesX(): string[] {
        return [...this.getExternalAddressesX(), ...this.getInternalAddressesX()];
    }

    public getExternalAddressesP(): string[] {
        return this.externalScan.getAllAddresses('P');
    }

    /**
     * Returns every P chain address used by the wallet up to now.
     */
    public getAllAddressesP(): string[] {
        return this.getExternalAddressesP();
    }

    /**
     * Scans the network and initializes internal and external addresses on P and X chains.
     * - Heavy operation
     * - MUST use the explorer api to find the last used address
     * - If explorer is not available it will use the connected node. This may result in invalid balances.
     */
    public async resetHdIndices() {
        await this.externalScan.resetIndex();
        await this.internalScan.resetIndex();
    }

    // TODO: Support internal address as well
    signMessage(msgStr: string, index: number): string {
        let key = this.externalScan.getKeyForIndexX(index) as AVMKeyPair;
        let digest = digestMessage(msgStr);

        // Convert to the other Buffer and sign
        let digestHex = digest.toString('hex');
        let digestBuff = Buffer.from(digestHex, 'hex');
        let signed = key.sign(digestBuff);

        return bintools.cb58Encode(signed);
        return '';
    }
}
