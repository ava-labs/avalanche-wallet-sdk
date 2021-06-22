import * as bip39 from 'bip39';
import HDKey from 'hdkey';
import { AVAX_ACCOUNT_PATH, ETH_ACCOUNT_PATH } from './constants';
import EvmWallet from './EvmWallet';
import { UnsafeWallet, WalletNameType } from './types';
import { Buffer } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import { Tx as AVMTx, UnsignedTx as AVMUnsignedTx } from 'avalanche/dist/apis/avm';
import { Tx as PlatformTx, UnsignedTx as PlatformUnsignedTx } from 'avalanche/dist/apis/platformvm';
import { KeyPair as AVMKeyPair, KeyChain as AVMKeyChain } from 'avalanche/dist/apis/avm/keychain';
import { KeyChain as PlatformKeyChain } from 'avalanche/dist/apis/platformvm';
import {
    UnsignedTx as EVMUnsignedTx,
    Tx as EVMTx,
    KeyChain as EVMKeychain,
    KeyPair as EVMKeyPair,
} from 'avalanche/dist/apis/evm';
import { avalanche } from '@/Network/network';
import { digestMessage } from '@/utils/utils';
import { HDWalletAbstract } from '@/Wallet/HDWalletAbstract';
import { bintools } from '@/common';

export default class MnemonicWallet extends HDWalletAbstract implements UnsafeWallet {
    evmWallet: EvmWallet;
    type: WalletNameType;
    mnemonic: string;

    private ethAccountKey: HDKey;

    constructor(mnemonic: string) {
        let seed: globalThis.Buffer = bip39.mnemonicToSeedSync(mnemonic);
        let masterHdKey: HDKey = HDKey.fromMasterSeed(seed);
        let accountKey = masterHdKey.derive(AVAX_ACCOUNT_PATH);

        super(accountKey);

        this.type = 'mnemonic';
        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic phrase.');
        }

        let ethAccountKey = masterHdKey.derive(ETH_ACCOUNT_PATH + '/0/0');
        this.ethAccountKey = ethAccountKey;
        let ethKey = ethAccountKey.privateKey;
        let evmWallet = new EvmWallet(ethKey);

        this.mnemonic = mnemonic;
        this.evmWallet = evmWallet;
    }

    /**
     * Gets the active address on the C chain in Bech32 encoding
     * @return
     * Bech32 representation of the EVM address.
     */
    public getEvmAddressBech(): string {
        let keypair = new EVMKeyPair(avalanche.getHRP(), 'C');
        let addr = keypair.addressFromPublicKey(Buffer.from(this.ethAccountKey.publicKey));
        return bintools.addressToString(avalanche.getHRP(), 'C', addr);
    }

    /**
     * Returns the derived private key used by the EVM wallet.
     */
    public getEvmPrivateKeyHex(): string {
        return this.evmWallet.getPrivateKeyHex();
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
     * Gets the active address on the C chain
     * @return
     * Hex representation of the EVM address.
     */
    public getAddressC(): string {
        return this.evmWallet.getAddress();
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
    }
}
