import { HDWalletAbstract } from '@/Wallet/HDWalletAbstract';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { UnsignedTx as PlatformUnsignedTx, Tx as PlatformTx } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import { Transaction } from '@ethereumjs/tx';
import { WalletNameType } from '@/Wallet/types';
import EvmWallet from '@/Wallet/EvmWallet';
import EvmWalletReadonly from '@/Wallet/EvmWalletReadonly';
import HDKey from 'hdkey';
import { importPublic } from 'ethereumjs-util';

export default class PublicMnemonicWallet extends HDWalletAbstract {
    /**
     *
     * @param xpubAVM of derivation path m/44'/9000'/0'
     * @param xpubEVM of derivation path m/44'/60'/0'
     */
    constructor(xpubAVM: string, xpubEVM: string) {
        let avmAcct = HDKey.fromExtendedKey(xpubAVM);
        let evmAcct = HDKey.fromExtendedKey(xpubEVM).derive('m/0/0');
        super(avmAcct);

        this.type = 'xpub';

        this.evmWallet = new EvmWalletReadonly(importPublic(evmAcct.publicKey));
    }

    evmWallet: EvmWallet | EvmWalletReadonly;
    type: WalletNameType;

    getAddressC(): string {
        return this.evmWallet.getAddress();
    }

    getEvmAddressBech(): string {
        return this.evmWallet.getAddressBech32();
    }

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
