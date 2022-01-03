import { BN, Buffer as BufferAvalanche } from 'avalanche';
import { avalanche, web3 } from '@/Network/network';
import { ethers } from 'ethers';
import { KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm/keychain';
import { bintools } from '@/common';
import { computePublicKey, computeAddress } from 'ethers/lib/utils';

export class EvmWalletReadonly {
    balance = new BN(0);
    address: string;
    publicKey: string;
    publicKeyBuff: Buffer;

    /**
     *
     * @param publicKey 64 byte uncompressed public key. Starts with `0x`.
     */
    constructor(publicKey: string) {
        this.publicKey = publicKey;
        this.publicKeyBuff = Buffer.from(publicKey.substr(2), 'hex');
        this.address = computeAddress(publicKey);
    }

    getBalance(): BN {
        return this.balance;
    }

    getAddress(): string {
        return ethers.utils.getAddress(this.address);
    }

    getAddressBech32(): string {
        const compressedKey = computePublicKey(this.publicKey, true);
        let keypair = new EVMKeyPair(avalanche.getHRP(), 'C');
        let addr = keypair.addressFromPublicKey(BufferAvalanche.from(compressedKey.substr(2), 'hex'));
        return bintools.addressToString(avalanche.getHRP(), 'C', addr);
    }

    async updateBalance() {
        let bal = await web3.eth.getBalance(this.address);
        this.balance = new BN(bal);
        return this.balance;
    }
}
