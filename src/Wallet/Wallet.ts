import {
    AssetBalanceP,
    AssetBalanceRawX,
    AssetBalanceX,
    AvmExportChainType,
    AvmImportChainType,
    ERC20Balance,
    iAvaxBalance,
    WalletBalanceERC20,
    WalletBalanceX,
    WalletCollectiblesX,
    WalletEventArgsType,
    WalletEventType,
    WalletNameType,
} from './types';
import {
    buildAvmExportTransaction,
    buildCreateNftFamilyTx,
    buildCustomEvmTx,
    buildEvmExportTransaction,
    buildEvmTransferErc20Tx,
    buildEvmTransferNativeTx,
    buildMintNftTx,
    estimateErc20Gas,
} from '@/helpers/tx_helper';
import { BN, Buffer } from 'avalanche';
import { Transaction } from '@ethereumjs/tx';
import { activeNetwork, avalanche, cChain, pChain, web3, xChain } from '@/Network/network';
import EvmWallet from '@/Wallet/EvmWallet';

import {
    avmGetAllUTXOs,
    avmGetAtomicUTXOs,
    getStakeForAddresses,
    platformGetAllUTXOs,
    platformGetAtomicUTXOs,
} from '@/helpers/utxo_helper';

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
import { avaxCtoX, bnToLocaleString, waitTxC, waitTxEvm, waitTxP, waitTxX } from '@/utils/utils';
import EvmWalletReadonly from '@/Wallet/EvmWalletReadonly';
import EventEmitter from 'events';
import {
    getAddressHistory,
    getAddressHistoryEVM,
    getTransactionSummary,
    getTransactionSummaryEVM,
} from '@/History/history';
import { HistoryItemType, ITransactionData } from '@/History/types';
import moment from 'moment';
import { bintools } from '@/common';
import { ChainIdType } from '@/types';
import {
    canHaveBalanceOnC,
    canHaveBalanceOnP,
    canHaveBalanceOnX,
    getStepsForBalanceC,
    getStepsForBalanceP,
    getStepsForBalanceX,
    UniversalTx,
} from '@/helpers/universal_tx_helper';

export abstract class WalletProvider {
    abstract type: WalletNameType;
    abstract evmWallet: EvmWallet | EvmWalletReadonly;

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

    /***
     * Used to get an identifier string that is consistent across different network connections.
     * Currently returns the C address of this wallet.
     */
    public getBaseAddress(): string {
        return this.getAddressC();
    }

    protected emitter: EventEmitter = new EventEmitter();

    public on(event: WalletEventType, listener: (...args: any[]) => void): void {
        this.emitter.on(event, listener);
    }

    public off(event: WalletEventType, listener: (...args: any[]) => void): void {
        this.emitter.off(event, listener);
    }

    protected emit(event: WalletEventType, args: WalletEventArgsType): void {
        this.emitter.emit(event, args);
    }

    protected emitAddressChange(): void {
        this.emit('addressChanged', {
            X: this.getAddressX(),
            changeX: this.getChangeAddressX(),
            P: this.getAddressP(),
        });
    }

    protected emitBalanceChangeX(): void {
        this.emit('balanceChangedX', this.balanceX);
    }

    protected emitBalanceChangeP(): void {
        this.emit('balanceChangedP', this.getAvaxBalanceP());
    }

    protected emitBalanceChangeC(): void {
        this.emit('balanceChangedC', this.getAvaxBalanceC());
    }

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
        await waitTxX(txId);

        // Update UTXOs
        this.updateUtxosX();

        return txId;
    }

    /**
     * Sends AVAX to another address on the C chain.
     * @param to Hex address to send AVAX to.
     * @param amount Amount of AVAX to send, represented in WEI format.
     * @param gasPrice Gas price in WEI format
     * @param gasLimit Gas limit
     *
     * @return Returns the transaction hash
     */
    async sendAvaxC(to: string, amount: BN, gasPrice: BN, gasLimit: number): Promise<string> {
        let fromAddr = this.getAddressC();
        let tx = await buildEvmTransferNativeTx(fromAddr, to, amount, gasPrice, gasLimit);
        return await this.issueEvmTx(tx);
    }

    /**
     * Send Avalanche Native Tokens on X chain
     * @param assetID ID of the token to send
     * @param amount How many units of the token to send. Based on smallest divisible unit.
     * @param to X chain address to send tokens to
     */
    async sendANT(assetID: string, amount: BN, to: string): Promise<string> {
        let utxoSet = this.getUtxosX();
        let fromAddrs = this.getAllAddressesX();
        let changeAddr = this.getChangeAddressX();

        let tx = await xChain.buildBaseTx(utxoSet, amount, assetID, [to], fromAddrs, [changeAddr]);
        let signed = await this.signX(tx);
        let txId = await xChain.issueTx(signed);
        await waitTxX(txId);

        this.updateUtxosX();
        return txId;
    }

    /**
     * Makes a transfer call on a ERC20 contract.
     * @param to Hex address to transfer tokens to.
     * @param amount Amount of the ERC20 token to send, donated in the token's correct denomination.
     * @param gasPrice Gas price in WEI format
     * @param gasLimit Gas limit
     * @param contractAddress Contract address of the ERC20 token
     */
    async sendErc20(to: string, amount: BN, gasPrice: BN, gasLimit: number, contractAddress: string): Promise<string> {
        let fromAddr = this.getAddressC();
        let tx = await buildEvmTransferErc20Tx(fromAddr, to, amount, gasPrice, gasLimit, contractAddress);
        let txHash = await this.issueEvmTx(tx);
        return txHash;
    }

    /**
     * Estimate the gas needed for an ERC20 Transfer transaction
     * @param contractAddress The ERC20 contract address
     * @param to Address receiving the tokens
     * @param amount Amount to send. Given in the smallest divisible unit.
     */
    async estimateErc20Gas(contractAddress: string, to: string, amount: BN) {
        let from = this.getAddressC();
        return await estimateErc20Gas(contractAddress, from, to, amount);
    }

    /**
     * A method to create custom EVM transactions.
     * @param gasPrice
     * @param gasLimit
     * @param data `data` field of the transaction, in hex format
     * @param to `to` field of the transaction, in hex format
     * @param value `value` field of the transaction, in hex format
     * @param nonce Nonce of the transaction, in number
     */
    async sendCustomEvmTx(gasPrice: BN, gasLimit: number, data?: string, to?: string, value?: string, nonce?: number) {
        let from = this.getAddressC();
        let tx = await buildCustomEvmTx(from, gasPrice, gasLimit, data, to, value, nonce);
        return await this.issueEvmTx(tx);
    }

    /**
     * Can this wallet have the given amount on the given chain after a series of internal transactions (if required).
     * @param chain X/P/C
     * @param amount The amount to check against
     */
    public canHaveBalanceOnChain(chain: ChainIdType, amount: BN): boolean {
        let xBal = this.getAvaxBalanceX().unlocked;
        let pBal = this.getAvaxBalanceP().unlocked;
        let cBal = avaxCtoX(this.getAvaxBalanceC()); // need to use 9 decimal places

        switch (chain) {
            case 'P':
                return canHaveBalanceOnP(xBal, pBal, cBal, amount);
            case 'C':
                return canHaveBalanceOnC(xBal, pBal, cBal, amount);
            case 'X':
                return canHaveBalanceOnX(xBal, pBal, cBal, amount);
        }
    }

    /**
     * Returns an array of transaction to do in order to have the target amount on the given chain
     * @param chain The chain (X/P/C) to have the desired amount on
     * @param amount The desired amount
     */
    public getTransactionsForBalance(chain: ChainIdType, amount: BN): UniversalTx[] {
        let xBal = this.getAvaxBalanceX().unlocked;
        let pBal = this.getAvaxBalanceP().unlocked;
        let cBal = avaxCtoX(this.getAvaxBalanceC()); // need to use 9 decimal places

        switch (chain) {
            case 'P':
                return getStepsForBalanceP(xBal, pBal, cBal, amount);
            case 'C':
                return getStepsForBalanceC(xBal, pBal, cBal, amount);
            case 'X':
                return getStepsForBalanceX(xBal, pBal, cBal, amount);
        }
    }

    /**
     * Given a `Transaction`, it will sign and issue it to the network.
     * @param tx The unsigned transaction to issue.
     */
    async issueEvmTx(tx: Transaction): Promise<string> {
        let signedTx = await this.signEvm(tx);
        let txHex = signedTx.serialize().toString('hex');
        let hash = await web3.eth.sendSignedTransaction('0x' + txHex);
        const txHash = hash.transactionHash;
        return await waitTxEvm(txHash);
    }

    /**
     * Returns the C chain AVAX balance of the wallet in WEI format.
     */
    async updateAvaxBalanceC(): Promise<BN> {
        let balOld = this.evmWallet.getBalance();
        let balNew = await this.evmWallet.updateBalance();

        if (!balOld.eq(balNew)) {
            this.emitBalanceChangeC();
        }

        return balNew;
    }

    /**
     *  Returns UTXOs on the X chain that belong to this wallet.
     *  - Makes network request.
     *  - Updates `this.utxosX` with new UTXOs
     *  - Calls `this.updateBalanceX()` after success.
     *  */
    public async updateUtxosX(): Promise<AVMUTXOSet> {
        const addresses = this.getAllAddressesX();
        let oldUtxos = this.utxosX;
        this.utxosX = await avmGetAllUTXOs(addresses);

        await this.updateUnknownAssetsX();
        this.updateBalanceX();

        return this.utxosX;
    }

    /**
     *  Returns the fetched UTXOs on the X chain that belong to this wallet.
     */
    public getUtxosX(): AVMUTXOSet {
        return this.utxosX;
    }

    /**
     *  Returns UTXOs on the P chain that belong to this wallet.
     *  - Makes network request.
     *  - Updates `this.utxosP` with the new UTXOs
     */
    public async updateUtxosP(): Promise<PlatformUTXOSet> {
        let addresses = this.getAllAddressesP();
        this.utxosP = await platformGetAllUTXOs(addresses);

        this.emitBalanceChangeP();

        return this.utxosP;
    }

    /**
     * Returns the fetched UTXOs on the P chain that belong to this wallet.
     */
    public getUtxosP(): PlatformUTXOSet {
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
        let newBal = await balanceOf(this.getAddressC());
        let balNow = this.balanceERC20;

        let strNewBal = JSON.stringify(newBal);
        let strBalNow = JSON.stringify(balNow);
        // Compare stringified balances
        if (strNewBal !== strBalNow) {
            this.emitBalanceChangeC();
        }
        this.balanceERC20 = newBal;
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

    private async updateUnknownAssetsX() {
        let utxos = this.utxosX.getAllUTXOs();

        for (let i = 0; i < utxos.length; i++) {
            let utxo = utxos[i];
            let assetIdBuff = utxo.getAssetID();
            let assetId = bintools.cb58Encode(assetIdBuff);
            await getAssetDescription(assetId);
        }
    }

    /**
     * Uses the X chain UTXOs owned by this wallet, gets asset description for unknown assets,
     * and returns a dictionary of Asset IDs to balance amounts.
     * - Updates `this.balanceX`
     * - Expensive operation if there are unknown assets
     * - Uses existing UTXOs
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

        this.emitBalanceChangeX();
        return res;
    }

    public getBalanceX(): WalletBalanceX {
        return this.balanceX;
    }

    /**
     * A helpful method that returns the AVAX balance on X, P, C chains.
     * Internally calls chain specific getAvaxBalance methods.
     */
    public getAvaxBalance(): iAvaxBalance {
        let X = this.getAvaxBalanceX();
        let P = this.getAvaxBalanceP();
        let C = this.getAvaxBalanceC();

        return {
            X,
            P,
            C,
        };
    }

    /**
     * Returns the X chain AVAX balance of the current wallet state.
     * - Does not make a network request.
     * - Does not refresh wallet balance.
     */
    public getAvaxBalanceX(): AssetBalanceRawX {
        if (!activeNetwork) {
            throw new Error('Network not selected.');
        }
        return (
            this.balanceX[activeNetwork.avaxID] || {
                unlocked: new BN(0),
                locked: new BN(0),
            }
        );
    }

    public getAvaxBalanceC(): BN {
        return this.evmWallet.getBalance();
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
        let txId = await pChain.issueTx(tx);
        await waitTxP(txId);

        this.updateUtxosP();

        return txId;
    }

    /**
     * Exports AVAX from C chain to X chain
     * @remarks
     * The export transaction will cover the Export + Import Fees
     *
     * @param amt amount of nAVAX to transfer
     * @return returns the transaction id.
     */
    async exportCChain(amt: BN): Promise<string> {
        let fee = xChain.getTxFee();
        let amtFee = amt.add(fee);

        let hexAddr = this.getAddressC();
        let bechAddr = this.getEvmAddressBech();

        let fromAddresses = [hexAddr];
        let destinationAddr = this.getAddressX();

        let exportTx = await buildEvmExportTransaction(fromAddresses, destinationAddr, amtFee, bechAddr);

        let tx = await this.signC(exportTx);

        let addrC = this.getAddressC();
        let nonceBefore = await web3.eth.getTransactionCount(addrC);
        let txId = await cChain.issueTx(tx);

        // TODO: Return the txId from the wait function, once support is there
        await waitTxC(addrC, nonceBefore);
        return txId;
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

        let txId = await xChain.issueTx(tx);
        await waitTxX(txId);

        // Update UTXOs
        this.updateUtxosX();

        return txId;
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
        const txId = await xChain.issueTx(tx);

        await waitTxX(txId);

        // Update UTXOs
        this.updateUtxosX();

        return txId;
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
        const txId = await pChain.issueTx(tx);

        await waitTxP(txId);

        this.updateUtxosP();

        return txId;
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
        const txId = await xChain.issueTx(signed);
        return await waitTxX(txId);
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
        const txId = await xChain.issueTx(signed);
        return await waitTxX(txId);
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
        const txId = await pChain.issueTx(tx);
        await waitTxP(txId);

        this.updateUtxosP();

        return txId;
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

        // If reward address isn't given use current P address
        if (!rewardAddress) {
            rewardAddress = this.getAddressP();
        }

        let stakeReturnAddr = this.getAddressP();

        // For change address use the current platform chain
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
        const txId = await pChain.issueTx(tx);
        await waitTxP(txId);

        this.updateUtxosP();
        return txId;
    }

    async getHistoryX(limit = 0): Promise<ITransactionData[]> {
        let addrs = this.getAllAddressesX();
        return await getAddressHistory(addrs, limit, xChain.getBlockchainID());
    }

    async getHistoryP(limit = 0): Promise<ITransactionData[]> {
        let addrs = this.getAllAddressesP();
        return await getAddressHistory(addrs, limit, pChain.getBlockchainID());
    }

    async getHistoryC(limit = 0): Promise<ITransactionData[]> {
        let addrs = [this.getEvmAddressBech()];
        return await getAddressHistory(addrs, limit, cChain.getBlockchainID());
    }

    async getHistoryEVM() {
        let addr = this.getAddressC();
        return await getAddressHistoryEVM(addr);
    }

    async getHistory(limit: number = 0): Promise<HistoryItemType[]> {
        let txsX = await this.getHistoryX(limit);
        let txsP = await this.getHistoryP(limit);
        let txsC = await this.getHistoryC(limit);

        let txsXPC = txsX.concat(txsP, txsC);

        let txsEVM = await this.getHistoryEVM();

        let addrs = this.getAllAddressesX();
        let addrC = this.getAddressC();

        // Parse X,P,C transactions
        // Have to loop because of the asynchronous call
        let parsedXPC = [];
        for (let i = 0; i < txsXPC.length; i++) {
            let tx = txsXPC[i];
            try {
                let summary = await getTransactionSummary(tx, addrs, addrC);
                parsedXPC.push(summary);
            } catch (err) {
                console.error(err);
            }
        }

        // Parse EVM Transactions
        let parsedEVM = txsEVM.map((tx) => getTransactionSummaryEVM(tx, addrC));

        // Sort and join X,P,C transactions
        let parsedAll = [...parsedXPC, ...parsedEVM];
        let txsSorted = parsedAll.sort((x, y) => (moment(x.timestamp).isBefore(moment(y.timestamp)) ? 1 : -1));

        // If there is a limit only return that much
        if (limit > 0) {
            return txsSorted.slice(0, limit);
        }
        return txsSorted;
    }
}
