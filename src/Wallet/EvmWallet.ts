import { BN } from 'avalanche';
import { privateToAddress } from 'ethereumjs-util';
import { Transaction } from '@ethereumjs/tx';
import { web3 } from '@/Network/network';

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

    async updateBalance() {
        let bal = await web3.eth.getBalance(this.address);
        this.balance = new BN(bal);
        return this.balance;
    }
}
