import { HDWalletAbstract } from '@/Wallet/HDWalletAbstract';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { UnsignedTx as PlatformUnsignedTx, Tx as PlatformTx } from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import { Transaction } from '@ethereumjs/tx';
import { WalletNameType } from '@/Wallet/types';
import EvmWallet from '@/Wallet/EvmWallet';
import EvmWalletReadonly from '@/Wallet/EvmWalletReadonly';
import HDKey from 'hdkey';

export default class PublicMnemonicWallet extends HDWalletAbstract {
    constructor(xpub: string) {
        let accountKey = HDKey.fromExtendedKey(xpub);
        super(accountKey);

        this.type = 'xpub';
    }

    //@ts-ignore
    evmWallet: EvmWallet | EvmWalletReadonly;
    type: WalletNameType;

    getAddressC(): string {
        return '';
    }

    getEvmAddressBech(): string {
        return '';
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
