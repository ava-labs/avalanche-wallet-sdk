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
import { computePublicKey } from 'ethers/lib/utils';

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
        const uncompressedKey = computePublicKey(evmAcct.publicKey);
        this.evmWallet = new EvmWalletReadonly(uncompressedKey);
    }

    evmWallet: EvmWallet | EvmWalletReadonly;
    type: WalletNameType;

    //@ts-ignore
    signC(tx: EVMUnsignedTx): Promise<EVMTx> {
        throw new Error('Not supported.');
    }

    //@ts-ignore
    signEvm(tx: Transaction): Promise<Transaction> {
        throw new Error('Not supported.');
    }
    //@ts-ignore
    signP(tx: PlatformUnsignedTx): Promise<PlatformTx> {
        throw new Error('Not supported.');
    }

    //@ts-ignore
    signX(tx: AVMUnsignedTx): Promise<AVMTx> {
        throw new Error('Not supported.');
    }
}
