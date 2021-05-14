import {
    AssetBalanceP,
    AssetBalanceRawX,
    AssetBalanceX,
    AvmExportChainType,
    AvmImportChainType,
    ERC20Balance,
    WalletBalanceERC20,
    WalletBalanceX,
    WalletNameType,
} from './types';
import {
    buildAvmExportTransaction,
    buildCreateNftFamilyTx,
    buildEvmExportTransaction,
    buildEvmTransferErc20Tx,
    buildEvmTransferNativeTx,
    buildMintNftTx,
} from '@/helpers/TxHelper';
import Avalanche, { BN, Buffer } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import { activeNetwork, avalanche, bintools, cChain, pChain, web3, xChain } from '@/Network/network';
import EvmWallet from '@/Wallet/EvmWallet';

import {
    avmGetAllUTXOs,
    avmGetAtomicUTXOs,
    getStakeForAddresses,
    platformGetAllUTXOs,
    platformGetAtomicUTXOs,
} from '../helpers/utxo_helper';

import {
    UTXOSet as AVMUTXOSet,
    UnsignedTx as AVMUnsignedTx,
    UTXO as AVMUTXO,
    Tx as AvmTx,
    AVMConstants,
    AmountOutput,
} from 'avalanche/dist/apis/avm';
import {
    UTXOSet as PlatformUTXOSet,
    UTXO as PlatformUTXO,
    UnsignedTx as PlatformUnsignedTx,
    Tx as PlatformTx,
    PlatformVMConstants,
    StakeableLockOut,
} from 'avalanche/dist/apis/platformvm';
import { UnsignedTx as EVMUnsignedTx, Tx as EVMTx, UTXOSet as EVMUTXOSet } from 'avalanche/dist/apis/evm';

import { PayloadBase, UnixNow } from 'avalanche/dist/utils';
import { getAssetDescription } from '@/Asset/Assets';
import { balanceOf, getErc20Token } from '@/Asset/Erc20';
import { NO_NETWORK } from '@/errors';
import { bnToLocaleString } from '@/utils/utils';

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

    /**
     * The X chain UTXOs of the wallet's current state
     */
    public utxosX: AVMUTXOSet = new AVMUTXOSet();

    /**
     * The P chain UTXOs of the wallet's current state
     */
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

    /**
     * Sends AVAX to another address on the C chain.
     * @param to Hex address to send AVAX to.
     * @param amount Amount of AVAX to send, represented in WEI format.
     * @param gasPrice Gas price in gWEI format
     * @param gasLimit Gas limit
     *
     * @return Returns the transaction hash
     */
    async sendAvaxC(to: string, amount: BN, gasPrice: BN, gasLimit: number): Promise<string> {
        let fromAddr = this.getAddressC();

        let tx = await buildEvmTransferNativeTx(fromAddr, to, amount, gasPrice, gasLimit);

        let signedTx = await this.signEvm(tx);

        let txHex = signedTx.serialize().toString('hex');
        let hash = await web3.eth.sendSignedTransaction('0x' + txHex);
        return hash.transactionHash;
    }

    /**
     * Makes a transfer call on a ERC20 contract.
     * @param to Hex address to transfer tokens to.
     * @param amount Amount of the ERC20 token to send, donated in the token's correct denomination.
     * @param gasPrice Gas price in gWEI format
     * @param gasLimit Gas limit
     * @param contractAddress Contract address of the ERC20 token
     */
    async sendErc20(to: string, amount: BN, gasPrice: BN, gasLimit: number, contractAddress: string): Promise<string> {
        let fromAddr = this.getAddressC();
        let tx = await buildEvmTransferErc20Tx(fromAddr, to, amount, gasPrice, gasLimit, contractAddress);

        let signedTx = await this.signEvm(tx);
        let txHex = signedTx.serialize().toString('hex');
        let hash = await web3.eth.sendSignedTransaction('0x' + txHex);
        return hash.transactionHash;
    }

    /**
     * Returns the C chain AVAX balance of the wallet in WEI format.
     */
    async updateAvaxBalanceC(): Promise<BN> {
        return await this.evmWallet.updateBalance();
    }

    /**
     *  Returns UTXOs on the X chain that belong to this wallet.
     *  - Makes network request.
     *  - Updates `this.utxosX` with new UTXOs
     *  - Calls `this.updateBalanceX()` after success.
     */
    public async getUtxosX(): Promise<AVMUTXOSet> {
        const addresses = this.getAllAddressesX();
        this.utxosX = await avmGetAllUTXOs(addresses);
        this.updateBalanceX();
        return this.utxosX;
    }

    /**
     *  Returns UTXOs on the P chain that belong to this wallet.
     *  - Makes network request.
     *  - Updates `this.utxosP` with the new UTXOs
     */
    public async getUtxosP(): Promise<PlatformUTXOSet> {
        let addresses = this.getAllAddressesP();
        this.utxosP = await platformGetAllUTXOs(addresses);
        return this.utxosP;
    }

    /**
     * Returns the number AVAX staked by this wallet.
     */
    public async getStake(): Promise<BN> {
        let addrs = this.getAllAddressesP();
        return await getStakeForAddresses(addrs);
    }

    /**
     * Requests the balance for each ERC20 contract in the SDK.
     * - Makes network requests.
     * - Updates the value of `this.balanceERC20`
     */
    public async updateBalanceERC20(): Promise<WalletBalanceERC20> {
        this.balanceERC20 = await balanceOf(this.getAddressC());
        return this.balanceERC20;
    }

    /**
     * Returns the wallet's balance of the given ERC20 contract
     * @param address ERC20 Contract address
     */
    public async getBalanceERC20(address: string): Promise<ERC20Balance> {
        let token = await getErc20Token(address);
        let bal = await token.balanceOf(this.getAddressC());
        let res: ERC20Balance = {
            address: address,
            denomination: token.decimals,
            balanceParsed: bnToLocaleString(bal, token.decimals),
            balance: bal,
            name: token.name,
            symbol: token.symbol,
        };
        return res;
    }

    /**
     * Fetches the X chain UTXOs owned by this wallet, gets asset description for unknown assets,
     * and returns a nicely formatted dictionary that represents
     * - Updates `this.balanceX`
     * - Expensive operation
     * @private
     */
    private async updateBalanceX(): Promise<WalletBalanceX> {
        if (!activeNetwork) throw NO_NETWORK;
        let utxos = this.utxosX.getAllUTXOs();

        let unixNow = UnixNow();

        let res: WalletBalanceX = {};

        for (let i = 0; i < utxos.length; i++) {
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

        // If there are no AVAX UTXOs create a dummy empty balance object
        let avaxID = activeNetwork.avaxID;
        if (!res[avaxID]) {
            let assetInfo = await getAssetDescription(avaxID);
            res[avaxID] = {
                locked: new BN(0),
                unlocked: new BN(0),
                meta: assetInfo,
            };
        }

        this.balanceX = res;
        return res;
    }

    /**
     * Returns the X chain AVAX balance of the current wallet state.
     * - Does not make a network request.
     * - Does not refresh wallet balance.
     */
    public getAvaxBalanceX(): AssetBalanceX {
        // checkNetworkConnection()
        if (!activeNetwork) {
            throw new Error('Network not selected.');
        }
        return this.balanceX[activeNetwork.avaxID];
    }

    /**
     * Returns the P chain AVAX balance of the current wallet state.
     * - Does not make a network request.
     * - Does not refresh wallet balance.
     */
    public getAvaxBalanceP(): AssetBalanceP {
        let unlocked = new BN(0);
        let locked = new BN(0);
        let lockedStakeable = new BN(0);

        let utxos = this.utxosP.getAllUTXOs();
        let unixNow = UnixNow();

        for (let i = 0; i < utxos.length; i++) {
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

    /**
     * Exports AVAX from P chain to X chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @return returns the transaction id.
     */
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

    /**
     * Exports AVAX from C chain to X chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @return returns the transaction id.
     */
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

    /**
     * Exports AVAX from X chain to either P or C chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @param destinationChain Which chain to export to.
     * @return returns the transaction id.
     */
    async exportXChain(amt: BN, destinationChain: AvmExportChainType) {
        let fee = xChain.getTxFee();
        let amtFee = amt.add(fee);

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

    async getAtomicUTXOsX(chainID: AvmImportChainType) {
        let addrs = this.getAllAddressesX();
        let result = await avmGetAtomicUTXOs(addrs, chainID);
        return result;
    }

    async getAtomicUTXOsP(): Promise<PlatformUTXOSet> {
        let addrs = this.getAllAddressesP();
        return await platformGetAtomicUTXOs(addrs);
    }

    /**
     * Imports atomic X chain utxos to the current actie X chain address
     * @param chainID The chain ID to import from, either `P` or `C`
     */
    async importX(chainID: AvmImportChainType) {
        const utxoSet = await this.getAtomicUTXOsX(chainID);

        if (utxoSet.getAllUTXOs().length === 0) {
            throw new Error('Nothing to import.');
        }

        let xToAddr = this.getAddressX();

        let hrp = avalanche.getHRP();
        let utxoAddrs = utxoSet.getAddresses().map((addr) => bintools.addressToString(hrp, 'X', addr));

        let fromAddrs = utxoAddrs;
        let ownerAddrs = utxoAddrs;

        let sourceChainId;
        if (chainID === 'P') {
            sourceChainId = pChain.getBlockchainID();
        } else {
            sourceChainId = cChain.getBlockchainID();
        }

        // Owner addresses, the addresses we exported to
        const unsignedTx = await xChain.buildImportTx(utxoSet, ownerAddrs, sourceChainId, [xToAddr], fromAddrs, [
            xToAddr,
        ]);

        const tx = await this.signX(unsignedTx);
        return await xChain.issueTx(tx);
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

    async importC() {
        let bechAddr = this.getEvmAddressBech();

        const utxoResponse = await cChain.getUTXOs(bechAddr, xChain.getBlockchainID());
        const utxoSet: EVMUTXOSet = utxoResponse.utxos;

        if (utxoSet.getAllUTXOs().length === 0) {
            throw new Error('Nothing to import.');
        }

        let toAddress = this.getAddressC();
        let ownerAddresses = [bechAddr];
        let fromAddresses = ownerAddresses;
        let sourceChain = xChain.getBlockchainID();

        const unsignedTx = await cChain.buildImportTx(utxoSet, toAddress, ownerAddresses, sourceChain, fromAddresses);
        let tx = await this.signC(unsignedTx);
        let id = await cChain.issueTx(tx);

        return id;
    }

    async createNftFamily(name: string, symbol: string, groupNum: number) {
        let fromAddresses = this.getAllAddressesX();
        let changeAddress = this.getChangeAddressX();

        let minterAddress = this.getAddressX();

        let utxoSet = this.utxosX;

        let unsignedTx = await buildCreateNftFamilyTx(
            name,
            symbol,
            groupNum,
            fromAddresses,
            minterAddress,
            changeAddress,
            utxoSet
        );

        let signed = await this.signX(unsignedTx);
        return await xChain.issueTx(signed);
    }

    async mintNft(mintUtxo: AVMUTXO, payload: PayloadBase, quantity: number) {
        let ownerAddress = this.getAddressX();
        let changeAddress = this.getChangeAddressX();

        let sourceAddresses = this.getAllAddressesX();

        let utxoSet = this.utxosX;
        let tx = await buildMintNftTx(
            mintUtxo,
            payload,
            quantity,
            ownerAddress,
            changeAddress,
            sourceAddresses,
            utxoSet
        );
        let signed = await this.signX(tx);
        return await xChain.issueTx(signed);
    }

    /**
     * Adds a validator to the network using the given node id.
     *
     * @param nodeID The node id you are adding as a validator
     * @param amt Amount of AVAX to stake in nAVAX
     * @param start Validation period start date
     * @param end Validation period end date
     * @param delegationFee Minimum 2%
     * @param rewardAddress P chain address to send staking rewards
     * @param utxos
     *
     * @return Transaction id
     */
    async validate(
        nodeID: string,
        amt: BN,
        start: Date,
        end: Date,
        delegationFee: number,
        rewardAddress?: string,
        utxos?: PlatformUTXO[]
    ): Promise<string> {
        let utxoSet = this.utxosP;

        // If given custom UTXO set use that
        if (utxos) {
            utxoSet = new PlatformUTXOSet();
            utxoSet.addArray(utxos);
        }

        let pAddressStrings = this.getAllAddressesP();
        // let pAddressStrings = this.platformHelper.getAllDerivedAddresses()

        let stakeAmount = amt;

        // If reward address isn't given use index 0 address
        if (!rewardAddress) {
            rewardAddress = this.getAddressP();
        }

        // For change address use first available on the platform chain
        let changeAddress = this.getAddressP();

        let stakeReturnAddr = this.getAddressP();

        // Convert dates to unix time
        let startTime = new BN(Math.round(start.getTime() / 1000));
        let endTime = new BN(Math.round(end.getTime() / 1000));

        const unsignedTx = await pChain.buildAddValidatorTx(
            utxoSet,
            [stakeReturnAddr],
            pAddressStrings, // from
            [changeAddress], // change
            nodeID,
            startTime,
            endTime,
            stakeAmount,
            [rewardAddress],
            delegationFee
        );

        let tx = await this.signP(unsignedTx);
        return await pChain.issueTx(tx);
    }

    async delegate(
        nodeID: string,
        amt: BN,
        start: Date,
        end: Date,
        rewardAddress?: string,
        utxos?: PlatformUTXO[]
    ): Promise<string> {
        let utxoSet = this.utxosP;
        let pAddressStrings = this.getAllAddressesP();

        let stakeAmount = amt;

        // If given custom UTXO set use that
        if (utxos) {
            utxoSet = new PlatformUTXOSet();
            utxoSet.addArray(utxos);
        }

        // If reward address isn't given use index 0 address
        if (!rewardAddress) {
            rewardAddress = this.getAddressP();
        }

        let stakeReturnAddr = this.getAddressP();

        // For change address use first available on the platform chain
        let changeAddress = this.getAddressP();

        // Convert dates to unix time
        let startTime = new BN(Math.round(start.getTime() / 1000));
        let endTime = new BN(Math.round(end.getTime() / 1000));

        const unsignedTx = await pChain.buildAddDelegatorTx(
            utxoSet,
            [stakeReturnAddr],
            pAddressStrings,
            [changeAddress],
            nodeID,
            startTime,
            endTime,
            stakeAmount,
            [rewardAddress] // reward address
        );

        const tx = await this.signP(unsignedTx);
        return await pChain.issueTx(tx);
    }

    // Sign message
}
