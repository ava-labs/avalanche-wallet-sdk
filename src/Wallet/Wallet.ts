import {
    AssetBalanceP,
    AssetBalanceRawX,
    AssetBalanceX,
    WalletBalanceERC20,
    WalletBalanceX,
    WalletNameType,
} from './types';
import { buildAvmExportTransaction, buildEvmTransferErc20Tx, buildEvmTransferNativeTx } from '@/helpers/TxHelper';
import Avalanche, { BN } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import { activeNetwork, bintools, web3, xChain } from '@/Network/network';
import EvmWallet from '@/Wallet/EvmWallet';

import { avmGetAllUTXOs, getStakeForAddresses, platformGetAllUTXOs } from '../helpers/utxo_helper';

import {
    UTXOSet as AVMUTXOSet,
    UnsignedTx as AVMUnsignedTx,
    Tx as AvmTx,
    AVMConstants,
    AmountOutput,
} from 'avalanche/dist/apis/avm';
import {
    UTXOSet as PlatformUTXOSet,
    UnsignedTx as PlatformUnsignedTx,
    Tx as PlatformTx,
    PlatformVMConstants,
    StakeableLockOut,
} from 'avalanche/dist/apis/platformvm';
import { UnixNow } from 'avalanche/dist/utils';
import { getAssetDescription } from '@/Asset/Assets';
import { balanceOf } from '@/Asset/Erc20';

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

    public balanceX: WalletBalanceX = {};
    public balanceERC20: WalletBalanceERC20 = {};

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
        this.updateBalanceX();
        return this.utxosX;
    }

    // Returns UTXOs on the P chain that belong to this wallet
    public async getUtxosP(): Promise<PlatformUTXOSet> {
        let addresses = this.getAllAddressesP();
        this.utxosP = await platformGetAllUTXOs(addresses);
        return this.utxosP;
    }

    public async getStake(): Promise<BN> {
        let addrs = this.getAllAddressesP();
        return await getStakeForAddresses(addrs);
    }

    public async updateBalanceERC20(): Promise<WalletBalanceERC20> {
        this.balanceERC20 = await balanceOf(this.getAddressC());
        return this.balanceERC20;
    }

    private async updateBalanceX(): Promise<WalletBalanceX> {
        let utxos = this.utxosX.getAllUTXOs();

        let unixNow = UnixNow();

        let res: WalletBalanceX = {};

        for (var i = 0; i < utxos.length; i++) {
            let utxo = utxos[i];
            let out = utxo.getOutput();
            let type = out.getOutputID();

            if (type != AVMConstants.SECPXFEROUTPUTID) continue;

            let locktime = out.getLocktime();
            let amount = (out as AmountOutput).getAmount();
            let assetIdBuff = utxo.getAssetID();
            let assetId = bintools.cb58Encode(assetIdBuff);

            let asset: AssetBalanceX = res[assetId];

            if (!asset) {
                let assetInfo = await getAssetDescription(assetId);
                asset = { locked: new BN(0), unlocked: new BN(0), meta: assetInfo };
            }

            if (locktime.lte(unixNow)) {
                // not locked
                asset.unlocked = asset.unlocked.add(amount);
            } else {
                // locked
                asset.locked = asset.locked.add(amount);
            }

            res[assetId] = asset;
        }

        this.balanceX = res;
        return res;
    }

    // Returns the AVAX balance on X chain based on the current utxos.
    // This method does not refresh utxos.
    public getAvaxBalanceX(): AssetBalanceX {
        // checkNetworkConnection()
        if (!activeNetwork) {
            throw new Error('Network not selected.');
        }
        return this.balanceX[activeNetwork.avaxID];
    }

    // Returns the AVAX balance on P chain based on the current utxos.
    // This method does not refresh utxos.
    public getAvaxBalanceP(): AssetBalanceP {
        let unlocked = new BN(0);
        let locked = new BN(0);
        let lockedStakeable = new BN(0);

        let utxos = this.utxosP.getAllUTXOs();
        let unixNow = UnixNow();

        for (var i = 0; i < utxos.length; i++) {
            let utxo = utxos[i];
            let out = utxo.getOutput();
            let type = out.getOutputID();

            let amount = (out as AmountOutput).getAmount();

            if (type === PlatformVMConstants.STAKEABLELOCKOUTID) {
                let locktime = (out as StakeableLockOut).getStakeableLocktime();
                if (locktime.lte(unixNow)) {
                    unlocked.iadd(amount);
                } else {
                    lockedStakeable = lockedStakeable.add(amount);
                }
            } else {
                let locktime = (out as AmountOutput).getLocktime();
                if (locktime.lte(unixNow)) {
                    unlocked.iadd(amount);
                } else {
                    locked.iadd(amount);
                }
            }
        }

        return {
            unlocked,
            locked,
            lockedStakeable: lockedStakeable,
        };
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
