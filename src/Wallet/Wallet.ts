import {
    AssetBalanceP,
    AssetBalanceRawX,
    AssetBalanceX,
    AvmExportChainType,
    WalletBalanceERC20,
    WalletBalanceX,
    WalletNameType,
} from './types';
import {
    buildAvmExportTransaction,
    buildEvmExportTransaction,
    buildEvmTransferErc20Tx,
    buildEvmTransferNativeTx,
} from '@/helpers/TxHelper';
import Avalanche, { BN, Buffer } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import { activeNetwork, avalanche, bintools, cChain, pChain, web3, xChain } from '@/Network/network';
import EvmWallet from '@/Wallet/EvmWallet';

import {
    avmGetAllUTXOs,
    getAtomicUTXOsForAllAddresses,
    getStakeForAddresses,
    platformGetAllUTXOs,
    platformGetAtomicUTXOs,
} from '../helpers/utxo_helper';

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
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx } from 'avalanche/dist/apis/evm';

import { UnixNow } from 'avalanche/dist/utils';
import { getAssetDescription } from '@/Asset/Assets';
import { balanceOf } from '@/Asset/Erc20';
import { NO_NETWORK } from '@/errors';

export abstract class WalletProvider {
    abstract type: WalletNameType;
    abstract evmWallet: EvmWallet;

    abstract getAddressX(): string;
    abstract getChangeAddressX(): string;
    abstract getAddressP(): string;
    abstract getAddressC(): string;
    abstract getEvmAddressBech(): string;

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
    abstract signX(tx: AVMUnsignedTx): Promise<AvmTx>;
    abstract signP(tx: PlatformUnsignedTx): Promise<PlatformTx>;
    abstract signC(tx: EVMUnsignedTx): Promise<EVMTx>;

    /**
     *
     * @param to - the address funds are being send to.
     * @param amount - amount of AVAX to send in nAVAX
     * @param memo - A MEMO for the transaction
     */
    async sendAvaxX(to: string, amount: BN, memo?: string): Promise<string> {
        if (!activeNetwork) throw NO_NETWORK;

        let memoBuff = memo ? Buffer.from(memo) : undefined;

        let froms = this.getAllAddressesX();
        let changeAddress = this.getChangeAddressX();
        let utxoSet = this.utxosX;

        // Add Tx Fee to amount
        // let fee = xChain.getTxFee();
        // Amt + Fee
        // let feeAmt = amount.add(fee);

        let tx = await xChain.buildBaseTx(
            utxoSet,
            amount,
            activeNetwork.avaxID,
            [to],
            froms,
            [changeAddress],
            memoBuff
        );
        let signedTx = await this.signX(tx);
        let txId = await xChain.issueTx(signedTx);
        return txId;
    }

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

    async exportPChain(amt: BN) {
        let fee = xChain.getTxFee();
        let amtFee = amt.add(fee);

        let utxoSet = this.utxosP;
        let destinationAddr = this.getAddressX();

        let pChangeAddr = this.getAddressP();
        let fromAddrs = this.getAllAddressesP();

        let xId = xChain.getBlockchainID();

        let exportTx = await pChain.buildExportTx(utxoSet, amtFee, xId, [destinationAddr], fromAddrs, [pChangeAddr]);

        let tx = await this.signP(exportTx);
        return await pChain.issueTx(tx);
    }

    async exportCChain(amt: BN) {
        let fee = xChain.getTxFee();
        let amtFee = amt.add(fee);

        let hexAddr = this.getAddressC();
        let bechAddr = this.getEvmAddressBech();

        let fromAddresses = [hexAddr];
        let destinationAddr = this.getAddressX();

        let exportTx = await buildEvmExportTransaction(fromAddresses, destinationAddr, amtFee, bechAddr);

        let tx = await this.signC(exportTx);
        return cChain.issueTx(tx);
    }

    async exportXChain(amt: BN, destinationChain: AvmExportChainType) {
        let fee = xChain.getTxFee();
        let amtFee = amt.add(fee);

        if (destinationChain === 'C') {
            // C Chain imports/exports do not have a fee
            amtFee = amt;
        }

        let destinationAddr;
        if (destinationChain === 'P') {
            destinationAddr = this.getAddressP();
        } else {
            // C Chain
            destinationAddr = this.getEvmAddressBech();
        }

        let fromAddresses = this.getAllAddressesX();
        let changeAddress = this.getChangeAddressX();
        let utxos = this.utxosX;
        let exportTx = (await buildAvmExportTransaction(
            destinationChain,
            utxos,
            fromAddresses,
            destinationAddr,
            amtFee,
            changeAddress
        )) as AVMUnsignedTx;

        let tx = await this.signX(exportTx);

        return xChain.issueTx(tx);
    }

    // async getAtomicUTXOsX() {
    //     let addrs = this.getAllAddressesX();
    //     let result = await getAtomicUTXOsForAllAddresses<AVMUTXOSet>(addrs, 'X');
    //     return result;
    // }

    async getAtomicUTXOsP(): Promise<PlatformUTXOSet> {
        let addrs = this.getAllAddressesP();
        return await platformGetAtomicUTXOs(addrs);
    }

    async importP(): Promise<string> {
        const utxoSet = await this.getAtomicUTXOsP();

        if (utxoSet.getAllUTXOs().length === 0) {
            throw new Error('Nothing to import.');
        }

        // Owner addresses, the addresses we exported to
        let pToAddr = this.getAddressP();

        let hrp = avalanche.getHRP();
        let utxoAddrs = utxoSet.getAddresses().map((addr) => bintools.addressToString(hrp, 'P', addr));

        // let fromAddrs = utxoAddrs;
        let ownerAddrs = utxoAddrs;

        const unsignedTx = await pChain.buildImportTx(
            utxoSet,
            ownerAddrs,
            xChain.getBlockchainID(),
            [pToAddr],
            [pToAddr],
            [pToAddr],
            undefined,
            undefined
        );
        const tx = await this.signP(unsignedTx);
        return await pChain.issueTx(tx);
    }
    // async exportCChain(amt: BN) {
    //     return await WalletHelper.exportFromCChain(this, amt)
    // }
}
