import { BN } from 'avalanche';
import { privateToAddress } from 'ethereumjs-util';
import { Transaction } from '@ethereumjs/tx';

export default class EvmWallet {
    private privateKey: Buffer;
    balance = new BN(0);

    address: string;

    constructor(key: Buffer) {
        this.privateKey = key;
        this.address = '0x' + privateToAddress(key).toString('hex');
    }

    sign(tx: Transaction) {
        return tx.sign(this.privateKey);
    }

    getPrivateKeyHex(): string {
        return this.privateKey.toString('hex');
    }

    updateBalance() {}
}
