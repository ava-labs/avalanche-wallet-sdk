import { BN, Buffer as BufferAvalanche } from 'avalanche';
import { privateToAddress } from 'ethereumjs-util';
import { Transaction } from '@ethereumjs/tx';
import { avalanche, bintools, cChain, web3 } from '@/Network/network';
import { KeyChain as EVMKeyChain, KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';

export default class EvmWallet {
    private privateKey: Buffer;
    balance = new BN(0);

    address: string;

    constructor(key: Buffer) {
        this.privateKey = key;
        this.address = '0x' + privateToAddress(key).toString('hex');
    }

    private getPrivateKeyBech(): string {
        return `PrivateKey-` + bintools.cb58Encode(BufferAvalanche.from(this.privateKey));
    }

    getKeyChain(): EVMKeyChain {
        let keychain = new EVMKeyChain(avalanche.getHRP(), 'C');
        keychain.importKey(this.getPrivateKeyBech());
        return keychain;
    }

    getKeyPair(): EVMKeyPair {
        let keychain = new EVMKeyChain(avalanche.getHRP(), 'C');
        return keychain.importKey(this.getPrivateKeyBech());
    }

    getAddress(): string {
        return this.address;
    }

    getAddressBech(): string {
        return this.getKeyPair().getAddressString();
    }

    signEVM(tx: Transaction) {
        return tx.sign(this.privateKey);
    }

    signC(tx: EVMUnsignedTx): EVMTx {
        return tx.sign(this.getKeyChain());
    }

    getPrivateKeyHex(): string {
        return this.privateKey.toString('hex');
    }

    async updateBalance() {
        let bal = await web3.eth.getBalance(this.address);
        this.balance = new BN(bal);
        return this.balance;
    }
}
