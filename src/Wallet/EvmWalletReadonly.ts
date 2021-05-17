import { BN, Buffer as BufferAvalanche } from 'avalanche';
import { avalanche, bintools, web3 } from '@/Network/network';
import { publicToAddress, importPublic } from 'ethereumjs-util';

export default class EvmWalletReadonly {
    balance = new BN(0);
    address: string;
    publicKey: Buffer;

    constructor(publicKey: Buffer) {
        this.publicKey = publicKey;
        this.address = '0x' + publicToAddress(publicKey).toString('hex');
    }

    getAddress(): string {
        return this.address;
    }

    async updateBalance() {
        let bal = await web3.eth.getBalance(this.address);
        this.balance = new BN(bal);
        return this.balance;
    }
}
