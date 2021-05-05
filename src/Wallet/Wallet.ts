import { WalletNameType } from './types';
import { buildEvmTransferErc20Tx, buildEvmTransferNativeTx } from '../helpers/TxHelper';
import Avalanche, { BN } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import { web3 } from '../network';
import EvmWallet from './EvmWallet';

export abstract class WalletProvider {
    abstract type: WalletNameType;
    abstract evmWallet: EvmWallet;

    abstract getAddressX(): string;
    abstract getAddressP(): string;
    abstract getAddressC(): string;
    abstract getChangeAddressX(): string;

    abstract signEvm(tx: Transaction): Promise<Transaction>;

    async sendAvaxC(to: string, amount: BN, gasPrice: BN, gasLimit: number) {
        let fromAddr = this.evmWallet.address;

        let tx = await buildEvmTransferNativeTx(fromAddr, to, amount, gasPrice, gasLimit);

        let signedTx = await this.signEvm(tx);

        let txHex = signedTx.serialize().toString('hex');
        let hash = await web3.eth.sendSignedTransaction('0x' + txHex);
        return hash.transactionHash;
    }

    async sendErc20(to: string, amount: BN, gasPrice: BN, gasLimit: number, contractAddress: string) {
        let fromAddr = this.getAddressC();
        let tx = await buildEvmTransferErc20Tx(fromAddr, to, amount, gasPrice, gasLimit, contractAddress);

        let signedTx = await this.signEvm(tx);
        let txHex = signedTx.serialize().toString('hex');
        let hash = await web3.eth.sendSignedTransaction('0x' + txHex);
        return hash.transactionHash;
    }

    async updateAvaxBalanceC(): Promise<BN> {
        return await this.evmWallet.updateBalance();
    }
}
