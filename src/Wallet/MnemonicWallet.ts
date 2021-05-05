import * as bip39 from 'bip39';
import HDKey from 'hdkey';
import { AVAX_ACCOUNT_PATH, ETH_ACCOUNT_PATH } from '@/Wallet/constants';
import EvmWallet from '@/Wallet/EvmWallet';
import { WalletProvider } from '@/Wallet/Wallet';
import { WalletNameType } from '@/Wallet/types';
// import { KeyChain as AVMKeyChain, KeyPair as AVMKeyPair, UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm';
// import { Buffer } from 'avalanche';
// import { avalanche, bintools } from '@/index';
// import { getPreferredHRP } from 'avalanche/dist/utils';
import HdProvider from '@/Wallet/HdProvider';
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
        let seed: globalThis.Buffer = bip39.mnemonicToSeedSync(mnemonic);
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

    public getAddressX(): string {
        return HdProvider.deriveAddress(this.accountKey, `0/${this.externalIndex}`);
    }

    public getChangeAddressX() {
        return HdProvider.deriveAddress(this.accountKey, `1/${this.internalIndex}`);
    }

    public getAddressP(): string {
        return HdProvider.deriveAddress(this.accountKey, `0/${this.externalIndex}`, 'P');
    }

    public getAddressC(isBech = false): string {
        return isBech ? 'C-avax1..' : this.evmWallet.address;
    }
}
