import { WalletProvider } from '@/Wallet/Wallet';

// @ts-ignore
import TransportU2F from '@ledgerhq/hw-transport-u2f';
// @ts-ignore
import Eth from '@ledgerhq/hw-app-eth';
// @ts-ignore
import AppAvax from '@obsidiansystems/hw-app-avalanche';
import {
    AVAX_ACCOUNT_PATH,
    LEDGER_ETH_ACCOUNT_PATH,
    LEDGER_EXCHANGE_TIMEOUT,
    MIN_EVM_SUPPORT_V,
} from '@/Wallet/constants';
import HDKey from 'hdkey';
import { WalletNameType } from '@/Wallet/types';
import { Transaction } from '@ethereumjs/tx';
import { UnsignedTx as AVMUnsignedTx, Tx as AVMTx } from 'avalanche/dist/apis/avm';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';
import { UnsignedTx as PlatformUnsignedTx, Tx as PlatformTx } from 'avalanche/dist/apis/platformvm';
import EvmWallet from './EvmWallet';
import HdScanner from '@/Wallet/HdScanner';
import { HDWalletAbstract } from '@/Wallet/HDWalletAbstract';

export default class LedgerWallet extends HDWalletAbstract {
    evmWallet: EvmWallet;
    type: WalletNameType = 'ledger';

    constructor(avaxAcct: HDKey, evmAcct: HDKey) {
        super(avaxAcct);
    }

    static async fromU2F(): Promise<LedgerWallet> {
        let transport = await TransportU2F.create();
        transport.setExchangeTimeout(LEDGER_EXCHANGE_TIMEOUT);
        let app = new AppAvax(transport, 'w0w');
        let eth = new Eth(transport, 'w0w');

        let config = await app.getAppConfiguration();

        if (!config) {
            throw new Error(`Unable to connect ledger. You must use ledger version ${MIN_EVM_SUPPORT_V} or above.`);
        }

        if (config.version < MIN_EVM_SUPPORT_V) {
            throw new Error(`Unable to connect ledger. You must use ledger version ${MIN_EVM_SUPPORT_V} or above.`);
        }

        return await LedgerWallet.fromApp(app, eth);
    }

    static async getAvaxAccount(app: AppAvax): Promise<HDKey> {
        let res = await app.getWalletExtendedPublicKey(AVAX_ACCOUNT_PATH);
        let hd = new HDKey();
        hd.publicKey = res.public_key;
        hd.chainCode = res.chain_code;

        return hd;
    }

    static async getEvmAccount(eth: Eth): Promise<HDKey> {
        let ethRes = await eth.getAddress(LEDGER_ETH_ACCOUNT_PATH, true, true);
        let hdEth = new HDKey();
        // @ts-ignore
        hdEth.publicKey = Buffer.from(ethRes.publicKey, 'hex');
        // @ts-ignore
        hdEth.chainCode = Buffer.from(ethRes.chainCode, 'hex');

        return hdEth;
    }

    static async fromApp(app: AppAvax, eth: Eth): Promise<LedgerWallet> {
        let avaxAccount = await LedgerWallet.getAvaxAccount(app);
        let evmAccount = await LedgerWallet.getEvmAccount(eth);

        return new LedgerWallet(avaxAccount, evmAccount);
    }

    getAddressC(): string {
        throw new Error('Method not implemented.');
    }

    getEvmAddressBech(): string {
        throw new Error('Method not implemented.');
    }

    signEvm(tx: Transaction): Promise<Transaction> {
        throw new Error('Method not implemented.');
    }
    signX(tx: AVMUnsignedTx): Promise<AVMTx> {
        throw new Error('Method not implemented.');
    }
    signP(tx: PlatformUnsignedTx): Promise<PlatformTx> {
        throw new Error('Method not implemented.');
    }
    signC(tx: EVMUnsignedTx): Promise<EVMTx> {
        throw new Error('Method not implemented.');
    }
}
