import { BN, Buffer as BufferAvalanche } from 'avalanche';
import { avalanche, web3 } from '@/Network/network';
import { publicToAddress, importPublic } from 'ethereumjs-util';
import { ethers } from 'ethers';
import { KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm/keychain';
import { bintools } from '@/common';

export default class EvmWalletReadonly {
    balance = new BN(0);
    address: string;
    publicKey: Buffer;

    constructor(publicKey: Buffer) {
        this.publicKey = publicKey;
        this.address = '0x' + publicToAddress(publicKey).toString('hex');
    }

    getBalance(): BN {
        return this.balance;
    }

    getAddress(): string {
        return ethers.utils.getAddress(this.address);
    }

    getAddressBech32(): string {
        let keypair = new EVMKeyPair(avalanche.getHRP(), 'C');
        let addr = keypair.addressFromPublicKey(BufferAvalanche.from(this.publicKey));
        return bintools.addressToString(avalanche.getHRP(), 'C', addr);
    }

    async updateBalance() {
        let bal = await web3.eth.getBalance(this.address);
        this.balance = new BN(bal);
        return this.balance;
    }
}
