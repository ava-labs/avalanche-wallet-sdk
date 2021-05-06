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

// import Web3 from 'web3';
// import Avalanche from 'avalanche';

export default class MnemonicWallet extends WalletProvider {
    evmWallet: EvmWallet;
    type: WalletNameType = 'mnemonic';
    accountKey: HDKey;

    internalScan: HdScanner
    externalScan: HdScanner

    constructor(accountKey: HDKey, evmWallet: EvmWallet) {
        super();
        this.accountKey = accountKey;
        this.evmWallet = evmWallet;

        this.internalScan = new HdScanner(accountKey, true)
        this.externalScan = new HdScanner(accountKey, false)
    }

    static create(): MnemonicWallet {
        let mnemonic = bip39.generateMnemonic(256);
        return MnemonicWallet.fromMnemonic(mnemonic);
    }

    static fromMnemonic(mnemonic: string): MnemonicWallet {
        let cleanMnemonic = mnemonic.trim();
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
        return this.evmWallet.sign(tx);
    }

    public getExternalIndex(): number{
        return this.externalScan.getIndex()
    }

    public getInternalIndex(): number{
        return this.internalScan.getIndex()
    }

    public getAddressX(): string {
        return this.externalScan.getAddressX()
    }

    public getChangeAddressX() {
        return this.internalScan.getAddressX()
    }

    public getAddressP(): string {
        return this.externalScan.getAddressP()
    }

    public getAddressC(isBech = false): string {
        return isBech ? 'C-avax1..' : this.evmWallet.address;
    }

    // Returns every external X derived address up to active index
    public getExternalAddressesX(): string[] {
        return this.externalScan.getAllAddresses('X')
    }

    public getInternalAddressesX(): string[] {
        return this.internalScan.getAllAddresses('X')
    }

    // Returns every derived internal and external addresses
    public getAllAddressesX(): string[] {
        return [...this.getExternalAddressesX(), ...this.getInternalAddressesX()];
    }

    public getExternalAddressesP(): string[] {
        return this.externalScan.getAllAddresses('P')

    }

    public getAllAddressesP(): string[] {
        return this.getExternalAddressesP();
    }

    public resetHdIndices(){
        this.externalScan.resetIndex()
        this.internalScan.resetIndex()
    }
}
