import { WalletNameType } from '@/Wallet/types';
import { buildEvmTransferErc20Tx } from '@/helpers/TxHelper';
import Avalanche, { BN } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import { web3 } from '@/network';

export abstract class WalletProvider {
    abstract type: WalletNameType;

    abstract getAddressX(): string;
    abstract getAddressP(): string;
    abstract getAddressC(): string;

    abstract signEvm(tx: Transaction): Promise<Transaction>;

    async sendErc20(to: string, amount: BN, gasPrice: BN, gasLimit: number, contractAddress: string) {
        let fromAddr = this.getAddressC();
        let tx = await buildEvmTransferErc20Tx(fromAddr, to, amount, gasPrice, gasLimit, contractAddress);

        let signedTx = await this.signEvm(tx);
        let txHex = signedTx.serialize().toString('hex');
        let hash = await web3.eth.sendSignedTransaction('0x' + txHex);
        return hash.transactionHash;
    }
}
