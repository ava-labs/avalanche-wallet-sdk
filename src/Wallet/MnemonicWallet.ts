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
import HdProvider from './HdProvider';
import { Transaction } from '@ethereumjs/tx';

// import Web3 from 'web3';
// import Avalanche from 'avalanche';

export default class MnemonicWallet extends WalletProvider {
    evmWallet: EvmWallet;
    type: WalletNameType = 'mnemonic';
    externalIndex = 0;
    internalIndex = 0;
    accountKey: HDKey;

    constructor(accountKey: HDKey, evmWallet: EvmWallet) {
        super();
        this.accountKey = accountKey;
        this.evmWallet = evmWallet;
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

    public getAddressX(index = this.externalIndex): string {
        return HdProvider.deriveAddress(this.accountKey, `0/${index}`);
    }

    public getChangeAddressX(index = this.internalIndex) {
        return HdProvider.deriveAddress(this.accountKey, `1/${index}`);
    }

    public getAddressP(index = this.externalIndex): string {
        return HdProvider.deriveAddress(this.accountKey, `0/${index}`, 'P');
    }

    public getAddressC(isBech = false): string {
        return isBech ? 'C-avax1..' : this.evmWallet.address;
    }

    // Returns every external X derived address up to active index
    public getExternalAddressesX(): string[]{
        let addrs = []
        let upTo = this.externalIndex
        for(var i=0;i<=upTo;i++){
            addrs.push(this.getAddressX(i))
        }
        return addrs
    }

    public getInternalAddressesX(): string[]{
        let addrs = []
        let upTo = this.internalIndex
        for(var i=0;i<=upTo;i++){
            addrs.push(this.getChangeAddressX(i))
        }
        return addrs
    }

    // Returns every derived internal and external addresses
    public getAllAddressesX(): string[] {
        return [...this.getExternalAddressesX(), ...this.getInternalAddressesX()];
    }

    public getExternalAddressesP(): string[]{
        let addrs = []
        let upTo = this.externalIndex
        for(var i=0;i<=upTo;i++){
            addrs.push(this.getAddressP(i))
        }
        return addrs
    }

    public getAllAddressesP(): string[] {
        return this.getExternalAddressesP();
    }
}
