import { BN, Buffer as BufferAvalanche } from 'avalanche';
import { privateToAddress, privateToPublic } from 'ethereumjs-util';
import { Transaction } from '@ethereumjs/tx';
import { avalanche, bintools, cChain, web3 } from '@/Network/network';
import {
    KeyChain as EVMKeyChain,
    KeyPair as EVMKeyPair,
    UnsignedTx as EVMUnsignedTx,
    Tx as EVMTx,
} from 'avalanche/dist/apis/evm';
import EvmWalletReadonly from '@/Wallet/EvmWalletReadonly';

export default class EvmWallet extends EvmWalletReadonly {
    private privateKey: Buffer;

    constructor(key: Buffer) {
        let pubKey = privateToPublic(key);
        super(pubKey);

        // let address = '0x' + privateToAddress(key).toString('hex');
        this.privateKey = key;
    }

    private getPrivateKeyBech(): string {
        return `PrivateKey-` + bintools.cb58Encode(BufferAvalanche.from(this.privateKey));
    }

    getKeyChain(): EVMKeyChain {
        let keychain = new EVMKeyChain(avalanche.getHRP(), 'C');
        keychain.importKey(this.getPrivateKeyBech());
        console.log(keychain, this.getPrivateKeyBech());
        return keychain;
    }

    getKeyPair(): EVMKeyPair {
        let keychain = new EVMKeyChain(avalanche.getHRP(), 'C');
        return keychain.importKey(this.getPrivateKeyBech());
    }

    // getAddressBech(): string {
    //     return this.getKeyPair().getAddressString();
    // }

    signEVM(tx: Transaction) {
        return tx.sign(this.privateKey);
    }

    signC(tx: EVMUnsignedTx): EVMTx {
        return tx.sign(this.getKeyChain());
    }

    getPrivateKeyHex(): string {
        return this.privateKey.toString('hex');
    }
}
