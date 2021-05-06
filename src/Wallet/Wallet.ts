import { WalletNameType } from './types';
import { buildAvmExportTransaction, buildEvmTransferErc20Tx, buildEvmTransferNativeTx } from '@/helpers/TxHelper';
import Avalanche, { BN } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import { web3, xChain } from '@/network';
import EvmWallet from '@/Wallet/EvmWallet';

import { avmGetAllUTXOs, getStakeForAddresses, platformGetAllUTXOs } from '../helpers/utxo_helper';

import { UTXOSet as AVMUTXOSet, UnsignedTx as AVMUnsignedTx, Tx as AvmTx } from 'avalanche/dist/apis/avm';
import {
    UTXOSet as PlatformUTXOSet,
    UnsignedTx as PlatformUnsignedTx,
    Tx as PlatformTx,
} from 'avalanche/dist/apis/platformvm';

export abstract class WalletProvider {
    abstract type: WalletNameType;
    abstract evmWallet: EvmWallet;

    abstract getAddressX(): string;
    abstract getChangeAddressX(): string;
    abstract getAddressP(): string;
    abstract getAddressC(): string;

    abstract getExternalAddressesX(): string[];
    abstract getInternalAddressesX(): string[];
    abstract getExternalAddressesP(): string[];

    abstract getAllAddressesX(): string[];
    abstract getAllAddressesP(): string[];

    public utxosX: AVMUTXOSet = new AVMUTXOSet();
    public utxosP: PlatformUTXOSet = new PlatformUTXOSet();

    abstract signEvm(tx: Transaction): Promise<Transaction>;
    // abstract async signX(tx: AVMUnsignedTx): Promise<AvmTx>
    // abstract async signP(tx: PlatformUnsignedTx): Promise<PlatformTx>

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

    // Returns UTXOs on the X chain that belong to this wallet
    public async getUtxosX(): Promise<AVMUTXOSet> {
        let addresses = this.getAllAddressesX();
        this.utxosX = await avmGetAllUTXOs(addresses);
        return this.utxosX;
    }

    // Returns UTXOs on the X chain that belong to this wallet
    public async getUtxosP(): Promise<PlatformUTXOSet> {
        let addresses = this.getAllAddressesP();
        this.utxosP = await platformGetAllUTXOs(addresses);
        return this.utxosP;
    }

    public async getStake(): Promise<BN> {
        let addrs = this.getAllAddressesP();
        return await getStakeForAddresses(addrs);
    }

    // public async exportFromXChain(amt: BN, destinationChain: AvmExportChainType) {
    //     let fee = xChain.getTxFee();
    //     let amtFee = amt.add(fee);
    //
    //     if (destinationChain === 'C') {
    //         // C Chain imports/exports do not have a fee
    //         amtFee = amt;
    //     }
    //
    //     let destinationAddr;
    //     if (destinationChain === 'P') {
    //         destinationAddr = this.getAddressP();
    //     } else {
    //         // C Chain
    //         destinationAddr = wallet.getEvmAddressBech();
    //     }
    //
    //     let fromAddresses = this.getAllAddressesX();
    //     let changeAddress = this.getChangeAddressX();
    //     let utxos = wallet.getUTXOSet();
    //     let exportTx = (await buildAvmExportTransaction(
    //         destinationChain,
    //         utxos,
    //         fromAddresses,
    //         destinationAddr,
    //         amtFee,
    //         changeAddress
    //     )) as AVMUnsignedTx;
    //
    //     let tx = await this.signX(exportTx);
    //
    //     return xChain.issueTx(tx);
    // }
}
