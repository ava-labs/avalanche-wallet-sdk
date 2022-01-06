import { Buffer as BufferAvalanche } from 'avalanche';
import { FeeMarketEIP1559Transaction, Transaction } from '@ethereumjs/tx';
import { avalanche } from '@/Network/network';
import {
    KeyChain as EVMKeyChain,
    KeyPair as EVMKeyPair,
    UnsignedTx as EVMUnsignedTx,
    Tx as EVMTx,
} from 'avalanche/dist/apis/evm';
import { EvmWalletReadonly } from '@/Wallet/EvmWalletReadonly';
import { bintools } from '@/common';
import { computePublicKey } from 'ethers/lib/utils';

export class EvmWallet extends EvmWalletReadonly {
    private privateKey: Buffer;

    constructor(key: Buffer) {
        // Compute the uncompressed public key from private key
        let pubKey = computePublicKey(key);

        super(pubKey);

        this.privateKey = key;
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

    signEVM(tx: Transaction | FeeMarketEIP1559Transaction) {
        return tx.sign(this.privateKey);
    }

    signC(tx: EVMUnsignedTx): EVMTx {
        return tx.sign(this.getKeyChain());
    }

    getPrivateKeyHex(): string {
        return this.privateKey.toString('hex');
    }
}
