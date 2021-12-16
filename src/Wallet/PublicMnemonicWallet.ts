import { HDWalletAbstract } from '@/Wallet/HDWalletAbstract';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { UnsignedTx as PlatformUnsignedTx, Tx as PlatformTx } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import { Transaction } from '@ethereumjs/tx';
import { WalletNameType } from '@/Wallet/types';
import { EvmWallet } from '@/Wallet/EvmWallet';
import { EvmWalletReadonly } from '@/Wallet/EvmWalletReadonly';
import * as bip32 from 'bip32';
import { importPublic } from 'ethereumjs-util';

export class PublicMnemonicWallet extends HDWalletAbstract {
    /**
     *
     * @param xpubAVM of derivation path m/44'/9000'/n' where `n` is the account index
     * @param xpubEVM of derivation path m/44'/60'/0'/0/n where `n` is the account index
     */
    constructor(xpubAVM: string, xpubEVM: string) {
        let avmAcct = bip32.fromBase58(xpubAVM);
        let evmAcct = bip32.fromBase58(xpubEVM);
        super(avmAcct);

        this.type = 'xpub';

        console.log(evmAcct.publicKey.toString('hex'));
        console.log(importPublic(evmAcct.publicKey).toString('hex'));
        this.evmWallet = new EvmWalletReadonly(importPublic(evmAcct.publicKey));
    }

    evmWallet: EvmWallet | EvmWalletReadonly;
    type: WalletNameType;

    //@ts-ignore
    signC(tx: EVMUnsignedTx, transport?: any): Promise<EVMTx> {
        throw new Error('Not supported.');
    }

    //@ts-ignore
    signEvm(tx: Transaction, transport?: any): Promise<Transaction> {
        throw new Error('Not supported.');
    }
    //@ts-ignore
    signP(tx: PlatformUnsignedTx, transport?: any): Promise<PlatformTx> {
        throw new Error('Not supported.');
    }

    //@ts-ignore
    signX(tx: AVMUnsignedTx, transport?: any): Promise<AVMTx> {
        throw new Error('Not supported.');
    }
}
