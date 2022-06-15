import {
    AssetBalanceP,
    AssetBalanceRawX,
    AssetBalanceX,
    BTCNetworkType,
    ERC20Balance,
    ExportChainsC,
    ExportChainsP,
    ExportChainsX,
    iAvaxBalance,
    WalletBalanceX,
    WalletEventArgsType,
    WalletEventType,
    WalletNameType,
} from './types';
import {
    buildAvmExportTransaction,
    buildCreateNftFamilyTx,
    buildCustomEvmTx,
    buildEvmExportTransaction,
    buildEvmTransferEIP1559Tx,
    buildEvmTransferErc20Tx,
    buildEvmTransferErc721Tx,
    buildEvmTransferNativeTx,
    buildMintNftTx,
    buildPlatformExportTransaction,
    estimateAvaxGas,
    estimateErc20Gas,
} from '@/helpers/tx_helper';
import { BN, Buffer } from 'avalanche';
import { FeeMarketEIP1559Transaction, Transaction } from '@ethereumjs/tx';
import { activeNetwork, avalanche, cChain, pChain, web3, xChain } from '@/Network/network';
import { EvmWallet } from '@/Wallet/EVM/EvmWallet';

import {
    avmGetAllUTXOs,
    avmGetAtomicUTXOs,
    evmGetAtomicUTXOs,
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
import { getErc20Token } from '@/Asset/Erc20';
import { NO_NETWORK } from '@/errors';
import { avaxCtoX, bnToLocaleString, getTxFeeP, getTxFeeX, waitTxC, waitTxEvm, waitTxP, waitTxX } from '@/utils';
import { EvmWalletReadonly } from '@/Wallet/EVM/EvmWalletReadonly';
import EventEmitter from 'events';
import { getTransactionSummary, getTransactionSummaryEVM, HistoryItemType } from '@/History';
import { bintools } from '@/common';
import { ChainIdType } from '@/common';
import {
    createGraphForC,
    createGraphForP,
    createGraphForX,
    getStepsForBalanceC,
    getStepsForBalanceP,
    getStepsForBalanceX,
    UniversalTx,
} from '@/UniversalTx';
import { UniversalNodeAbstract } from '@/UniversalTx/UniversalNode';
import { GetStakeResponse } from 'avalanche/dist/apis/platformvm/interfaces';
import { networkEvents } from '@/Network/eventEmitter';
import { NetworkConfig } from '@/Network';
import { chainIdFromAlias } from '@/Network/helpers/idFromAlias';
import {
    estimateExportGasFee,
    estimateExportGasFeeFromMockTx,
    estimateImportGasFeeFromMockTx,
    getBaseFeeRecommended,
} from '@/helpers/gas_helper';
import { getErc20History, getNormalHistory } from '@/Explorer/snowtrace';
import {
    filterDuplicateOrtelius,
    getAddressHistory,
    getAddressHistoryEVM,
    getTx,
    getTxEvm,
    OrteliusAvalancheTx,
} from '@/Explorer';
import { TypedDataV1, TypedMessage } from '@metamask/eth-sig-util';
import { getHistoryForOwnedAddresses } from '@/History/getHistoryForOwnedAddresses';

export abstract class WalletProvider {
    abstract type: WalletNameType;
    abstract evmWallet: EvmWallet | EvmWalletReadonly;

    /**
     * The X chain UTXOs of the wallet's current state
     */
    public utxosX: AVMUTXOSet = new AVMUTXOSet();

    /**
     * The P chain UTXOs of the wallet's current state
     */
    public utxosP: PlatformUTXOSet = new PlatformUTXOSet();

    public balanceX: WalletBalanceX = {};

    abstract signEvm(tx: Transaction | FeeMarketEIP1559Transaction): Promise<Transaction | FeeMarketEIP1559Transaction>;
    abstract signX(tx: AVMUnsignedTx): Promise<AvmTx>;
    abstract signP(tx: PlatformUnsignedTx): Promise<PlatformTx>;
    abstract signC(tx: EVMUnsignedTx): Promise<EVMTx>;

    abstract getAddressX(): string;
    abstract getChangeAddressX(): string;
    abstract getAddressP(): string;

    abstract getExternalAddressesX(): Promise<string[]>;
    abstract getExternalAddressesXSync(): string[];
    abstract getInternalAddressesX(): Promise<string[]>;
    abstract getInternalAddressesXSync(): string[];
    abstract getExternalAddressesP(): Promise<string[]>;
    abstract getExternalAddressesPSync(): string[];

    abstract getAllAddressesX(): Promise<string[]>;
    abstract getAllAddressesXSync(): string[];
    abstract getAllAddressesP(): Promise<string[]>;
    abstract getAllAddressesPSync(): string[];

    abstract personalSign(data: string): Promise<string>;
    abstract signTypedData_V1(data: TypedDataV1): Promise<string>;
    abstract signTypedData_V3(data: TypedMessage<any>): Promise<string>;
    abstract signTypedData_V4(data: TypedMessage<any>): Promise<string>;

    protected constructor() {
        networkEvents.on('network_change', this.onNetworkChange.bind(this));
    }

    /**
     * Call after getting done with the wallet to avoi memory leaks and remove event listeners
     */
    public destroy() {
        networkEvents.off('network_change', this.onNetworkChange);
    }

    /**
     * Fired when the network changes
     * @param config
     * @protected
     */
    //@ts-ignore
    protected onNetworkChange(config: NetworkConfig) {}

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

    protected emit(event: WalletEventType, args?: WalletEventArgsType): void {
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
     * Gets the active address on the C chain
     * @return Hex representation of the EVM address.
     */
    public getAddressC() {
        return this.evmWallet.getAddress();
    }

    public getEvmAddressBech() {
        return this.evmWallet.getAddressBech32();
    }

    /**
     * Returns the BTC address of the C-Chain public key.
     */
    public getAddressBTC(type: BTCNetworkType): string {
        return this.evmWallet.getAddressBTC(type);
    }

    /**
     *
     * @param to - the address funds are being send to.
     * @param amount - amount of AVAX to send in nAVAX
     * @param memo - A MEMO for the transaction
     */
    async sendAvaxX(to: string, amount: BN, memo?: string): Promise<string> {
        if (!activeNetwork) throw NO_NETWORK;

        let memoBuff = memo ? Buffer.from(memo) : undefined;

        let froms = await this.getAllAddressesX();
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
     * Sends AVAX to another address on the C chain using legacy transaction format.
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
        let txId = await this.issueEvmTx(tx);
        await this.updateAvaxBalanceC();
        return txId;
    }

    /**
     * Send Avalanche Native Tokens on X chain
     * @param assetID ID of the token to send
     * @param amount How many units of the token to send. Based on smallest divisible unit.
     * @param to X chain address to send tokens to
     */
    async sendANT(assetID: string, amount: BN, to: string): Promise<string> {
        let utxoSet = this.getUtxosX();
        let fromAddrs = await this.getAllAddressesX();
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
        let token = await getErc20Token(contractAddress);
        let balOld = await token.balanceOf(fromAddr);
        let tx = await buildEvmTransferErc20Tx(fromAddr, to, amount, gasPrice, gasLimit, contractAddress);
        let txHash = await this.issueEvmTx(tx);

        // TODO: We should not be using setTimeout, wait until tx is confirmed on chain
        // TODO: Can it be an issue with sticky sessions? Nodes behind a LB?
        // If new balance doesnt match old, emit balance change
        setTimeout(async () => {
            let balNew = await token.balanceOf(fromAddr);
            if (!balOld.eq(balNew)) {
                this.emitBalanceChangeC();
            }
        }, 2000);

        return txHash;
    }

    /**
     * Makes a `safeTransferFrom` call on a ERC721 contract.
     * @param to Hex address to transfer the NFT to.
     * @param tokenID ID of the token to transfer inside the ERC71 family.
     * @param gasPrice Gas price in WEI format
     * @param gasLimit Gas limit
     * @param contractAddress Contract address of the ERC721 token
     */
    async sendErc721(contractAddress: string, to: string, tokenID: number, gasPrice: BN, gasLimit: number) {
        const tx = await buildEvmTransferErc721Tx(this.getAddressC(), to, gasPrice, gasLimit, contractAddress, tokenID);
        return await this.issueEvmTx(tx);
    }

    /**
     * Estimate the gas needed for an ERC20 Transfer transaction
     * @param contractAddress The ERC20 contract address
     * @param to Address receiving the tokens
     * @param amount Amount to send. Given in the smallest divisible unit.
     */
    async estimateErc20Gas(contractAddress: string, to: string, amount: BN): Promise<number> {
        let from = this.getAddressC();
        return await estimateErc20Gas(contractAddress, from, to, amount);
    }

    /**
     * Estimate the gas needed for an ERC721 `safeTransferFrom` transaction
     * @param contractAddress The ERC20 contract address
     * @param to Address receiving the tokens
     * @param tokenID ID of the token to transfer inside the ERC71 family.
     */
    async estimateErc721TransferGasLimit(contractAddress: string, to: string, tokenID: number) {
        return this.evmWallet.estimateErc721TransferGasLimit(contractAddress, to, tokenID);
    }

    /**
     * Estimate gas limit for the given inputs.
     * @param to
     * @param data
     */
    async estimateGas(to: string, data: string) {
        const from = this.getAddressC();
        const nonce = await web3.eth.getTransactionCount(from);
        return await web3.eth.estimateGas({
            from: from,
            nonce: nonce,
            to: to,
            data: data,
        });
    }

    /**
     * Estimate the gas needed for a AVAX send transaction on the C chain.
     * @param to Destination address.
     * @param amount Amount of AVAX to send, in WEI.
     */
    async estimateAvaxGasLimit(to: string, amount: BN, gasPrice: BN): Promise<number> {
        let from = this.getAddressC();
        return await estimateAvaxGas(from, to, amount, gasPrice);
    }

    /**
     * A method to create custom EVM transactions.
     * @param gasPrice
     * @param gasLimit
     * @param data `data` field of the transaction, in hex format
     * @param to `to` field of the transaction, in hex format
     * @param value `value` field of the transaction, in hex format
     * @param nonce Nonce of the transaction, in number. If not provided, SDK will get the latest nonce from the network
     */
    async sendCustomEvmTx(gasPrice: BN, gasLimit: number, data?: string, to?: string, value?: string, nonce?: number) {
        let from = this.getAddressC();
        let tx = await buildCustomEvmTx(from, gasPrice, gasLimit, data, to, value, nonce);
        return await this.issueEvmTx(tx);
    }

    /**
     * Returns the maximum spendable AVAX balance for the given chain.
     * Scans all chains and take cross over fees into account
     * @param chainType X, P or C
     */
    public getUsableAvaxBalanceForChain(chainType: ChainIdType, atomicFeeXP: BN, atomicFeeC: BN): BN {
        return this.createUniversalNode(chainType, atomicFeeXP, atomicFeeC).reduceTotalBalanceFromParents();
    }

    /**
     * Create a new instance of a UniversalNode for the given chain using current balance state
     * @param chain Chain of the universal node.
     * @private
     */
    private createUniversalNode(chain: ChainIdType, atomicFeeXP: BN, atomicFeeC: BN): UniversalNodeAbstract {
        let xBal = this.getAvaxBalanceX().unlocked;
        let pBal = this.getAvaxBalanceP().unlocked;
        let cBal = avaxCtoX(this.getAvaxBalanceC()); // need to use 9 decimal places

        switch (chain) {
            case 'X':
                return createGraphForX(xBal, pBal, cBal, atomicFeeXP, atomicFeeC);
            case 'P':
                return createGraphForP(xBal, pBal, cBal, atomicFeeXP, atomicFeeC);
            case 'C':
                return createGraphForC(xBal, pBal, cBal, atomicFeeXP, atomicFeeC);
        }
    }

    /**
     * Can this wallet have the given amount on the given chain after a series of internal transactions (if required).
     * @param chain X/P/C
     * @param amount The amount to check against
     */
    public canHaveBalanceOnChain(chain: ChainIdType, amount: BN, atomicFeeXP: BN, atomicFeeC: BN): boolean {
        // The maximum amount of AVAX we can have on this chain
        let maxAmt = this.createUniversalNode(chain, atomicFeeXP, atomicFeeC).reduceTotalBalanceFromParents();
        return maxAmt.gte(amount);
    }

    /**
     * Returns an array of transaction to do in order to have the target amount on the given chain
     * @param chain The chain (X/P/C) to have the desired amount on
     * @param amount The desired amount
     */
    public getTransactionsForBalance(chain: ChainIdType, amount: BN, atomicFeeXP: BN, atomicFeeC: BN): UniversalTx[] {
        let xBal = this.getAvaxBalanceX().unlocked;
        let pBal = this.getAvaxBalanceP().unlocked;
        let cBal = avaxCtoX(this.getAvaxBalanceC()); // need to use 9 decimal places

        switch (chain) {
            case 'P':
                return getStepsForBalanceP(xBal, pBal, cBal, amount, atomicFeeXP, atomicFeeC);
            case 'C':
                return getStepsForBalanceC(xBal, pBal, cBal, amount, atomicFeeXP, atomicFeeC);
            case 'X':
                return getStepsForBalanceX(xBal, pBal, cBal, amount, atomicFeeXP, atomicFeeC);
        }
    }

    /**
     * Given a `Transaction`, it will sign and issue it to the network.
     * @param tx The unsigned transaction to issue.
     */
    async issueEvmTx(tx: Transaction | FeeMarketEIP1559Transaction): Promise<string> {
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
        const addresses = await this.getAllAddressesX();
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
        let addresses = await this.getAllAddressesP();
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
    public async getStake(): Promise<GetStakeResponse> {
        let addrs = await this.getAllAddressesP();
        return await getStakeForAddresses(addrs);
    }

    /**
     * Returns the wallet's balance of the given ERC20 contracts
     * @param addresses ERC20 Contract addresses
     */
    public async getBalanceERC20(addresses: string[]): Promise<ERC20Balance[]> {
        let walletAddr = this.getAddressC();
        let tokenCalls = addresses.map((addr) => getErc20Token(addr));
        let tokens = await Promise.all(tokenCalls);

        let balanceCalls = tokens.map((token) => token.balanceOf(walletAddr));
        let balances = await Promise.all(balanceCalls);

        return balances.map((bal, i) => {
            let token = tokens[i];
            let balance: ERC20Balance = {
                address: token.address,
                denomination: token.decimals,
                balanceParsed: bnToLocaleString(bal, token.decimals),
                balance: bal,
                name: token.name,
                symbol: token.symbol,
            };
            return balance;
        });
    }

    private async updateUnknownAssetsX() {
        let utxos = this.utxosX.getAllUTXOs();

        let assetIds = utxos.map((utxo) => {
            let idBuff = utxo.getAssetID();
            return bintools.cb58Encode(idBuff);
        });
        let uniqueIds = assetIds.filter((id, index) => {
            return assetIds.indexOf(id) === index;
        });

        let promises = uniqueIds.map((id) => getAssetDescription(id));
        await Promise.all(promises);
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

        // TODO: Check previous value
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
     * The export fee is added automatically to the amount. Make sure the exported amount includes the import fee for the destination chain.
     *
     * @param amt amount of nAVAX to transfer. Fees excluded.
     * @param destinationChain Either `X` or `C`
     * @return returns the transaction id.
     */
    async exportPChain(amt: BN, destinationChain: ExportChainsP) {
        let pChangeAddr = this.getAddressP();
        let fromAddrs = await this.getAllAddressesP();

        const destinationAddr = destinationChain === 'X' ? this.getAddressX() : this.getEvmAddressBech();

        let utxoSet = this.utxosP;

        const exportTx = await buildPlatformExportTransaction(
            utxoSet,
            fromAddrs,
            destinationAddr,
            amt,
            pChangeAddr,
            destinationChain
        );

        let tx = await this.signP(exportTx);
        let txId = await pChain.issueTx(tx);
        await waitTxP(txId);

        await this.updateUtxosP();

        return txId;
    }

    /***
     * Estimates the required fee for a C chain export transaction
     * @param destinationChain Either `X` or `P`
     * @param baseFee Current base fee of the network, use a padded amount.
     * @return BN C chain atomic export transaction fee in nAVAX.
     */
    estimateAtomicFeeExportC(destinationChain: ExportChainsC, baseFee: BN): BN {
        let destinationAddr = destinationChain === 'X' ? this.getAddressX() : this.getAddressP();
        const hexAddr = this.getAddressC();
        // The amount does not effect the fee that much
        const amt = new BN(0);
        const gas = estimateExportGasFeeFromMockTx(destinationChain, amt, hexAddr, destinationAddr);
        return avaxCtoX(baseFee.mul(new BN(gas)));
    }

    /**
     * Exports AVAX from C chain to X chain
     * @remarks
     * Make sure the exported `amt` includes the import fee for the destination chain.
     *
     * @param amt amount of nAVAX to transfer
     * @param destinationChain either `X` or `P`
     * @param exportFee Export fee in nAVAX
     * @return returns the transaction id.
     */
    async exportCChain(amt: BN, destinationChain: ExportChainsC, exportFee?: BN): Promise<string> {
        let hexAddr = this.getAddressC();
        let bechAddr = this.getEvmAddressBech();

        let fromAddresses = [hexAddr];
        let destinationAddr = destinationChain === 'X' ? this.getAddressX() : this.getAddressP();

        // Calculate export fee if it's not given.
        if (!exportFee) {
            const gas = estimateExportGasFeeFromMockTx(destinationChain, amt, hexAddr, destinationAddr);
            const baseFee = await getBaseFeeRecommended();
            exportFee = avaxCtoX(baseFee.mul(new BN(gas)));
        }

        let exportTx = await buildEvmExportTransaction(
            fromAddresses,
            destinationAddr,
            amt,
            bechAddr,
            destinationChain,
            exportFee
        );

        let tx = await this.signC(exportTx);

        let txId = await cChain.issueTx(tx);

        await waitTxC(txId);

        await this.updateAvaxBalanceC();
        return txId;
    }

    /**
     * Exports AVAX from X chain to either P or C chain
     * @remarks
     * The export fee will be added to the amount automatically. Make sure the exported amount has the import fee for the destination chain.
     *
     * @param amt amount of nAVAX to transfer
     * @param destinationChain Which chain to export to.
     * @return returns the transaction id.
     */
    async exportXChain(amt: BN, destinationChain: ExportChainsX) {
        let destinationAddr = destinationChain === 'P' ? this.getAddressP() : this.getEvmAddressBech();

        let fromAddresses = await this.getAllAddressesX();
        let changeAddress = this.getChangeAddressX();
        let utxos = this.utxosX;
        let exportTx = await buildAvmExportTransaction(
            destinationChain,
            utxos,
            fromAddresses,
            destinationAddr,
            amt,
            changeAddress
        );

        let tx = await this.signX(exportTx);

        let txId = await xChain.issueTx(tx);
        await waitTxX(txId);

        // Update UTXOs
        await this.updateUtxosX();

        return txId;
    }

    async getAtomicUTXOsX(sourceChain: ExportChainsX) {
        let addrs = await this.getAllAddressesX();
        let result = await avmGetAtomicUTXOs(addrs, sourceChain);
        return result;
    }

    async getAtomicUTXOsP(sourceChain: ExportChainsP): Promise<PlatformUTXOSet> {
        let addrs = await this.getAllAddressesP();
        return await platformGetAtomicUTXOs(addrs, sourceChain);
    }

    async getAtomicUTXOsC(sourceChain: ExportChainsC) {
        const bechAddr = this.getEvmAddressBech();
        return await evmGetAtomicUTXOs([bechAddr], sourceChain);
    }

    /**
     * Fetches X-Chain atomic utxos from all source networks and returns them as one set.
     */
    async getAllAtomicUTXOsX() {
        const utxos = await Promise.all([this.getAtomicUTXOsX('P'), this.getAtomicUTXOsX('C')]);
        return utxos[0].merge(utxos[1]);
    }

    /**
     * Fetches P-Chain atomic utxos from all source networks and returns them as one set.
     */
    async getAllAtomicUTXOsP() {
        const utxos = await Promise.all([this.getAtomicUTXOsP('X'), this.getAtomicUTXOsP('C')]);
        return utxos[0].merge(utxos[1]);
    }

    /**
     * Fetches C-Chain atomic utxos from all source networks and returns them as one set.
     */
    async getAllAtomicUTXOsC() {
        const utxos = await Promise.all([this.getAtomicUTXOsC('X'), this.getAtomicUTXOsC('P')]);
        return utxos[0].merge(utxos[1]);
    }

    /**
     * Imports atomic X chain UTXOs to the current active X chain address
     * @param sourceChain The chain to import from, either `P` or `C`
     */
    async importX(sourceChain: ExportChainsX) {
        const utxoSet = await this.getAtomicUTXOsX(sourceChain);

        if (utxoSet.getAllUTXOs().length === 0) {
            throw new Error('Nothing to import.');
        }

        let xToAddr = this.getAddressX();

        let hrp = avalanche.getHRP();
        let utxoAddrs = utxoSet.getAddresses().map((addr) => bintools.addressToString(hrp, 'X', addr));

        let fromAddrs = utxoAddrs;
        let ownerAddrs = utxoAddrs;

        const sourceChainId = chainIdFromAlias(sourceChain);

        // Owner addresses, the addresses we exported to
        const unsignedTx = await xChain.buildImportTx(utxoSet, ownerAddrs, sourceChainId, [xToAddr], fromAddrs, [
            xToAddr,
        ]);

        const tx = await this.signX(unsignedTx);
        const txId = await xChain.issueTx(tx);

        await waitTxX(txId);

        // Update UTXOs
        await this.updateUtxosX();

        return txId;
    }

    /**
     * Import utxos in atomic memory to the P chain.
     * @param sourceChain Either `X` or `C`
     * @param [toAddress] The destination P chain address assets will get imported to. Defaults to the P chain address of the wallet.
     */
    async importP(sourceChain: ExportChainsP, toAddress?: string): Promise<string> {
        const utxoSet = await this.getAtomicUTXOsP(sourceChain);

        if (utxoSet.getAllUTXOs().length === 0) {
            throw new Error('Nothing to import.');
        }

        // Owner addresses, the addresses we exported to
        let walletAddrP = this.getAddressP();

        let hrp = avalanche.getHRP();
        let utxoAddrs = utxoSet.getAddresses().map((addr) => bintools.addressToString(hrp, 'P', addr));

        let ownerAddrs = utxoAddrs;

        if (!toAddress) {
            toAddress = walletAddrP;
        }

        const sourceChainId = chainIdFromAlias(sourceChain);

        const unsignedTx = await pChain.buildImportTx(
            utxoSet,
            ownerAddrs,
            sourceChainId,
            [toAddress],
            ownerAddrs,
            [walletAddrP],
            undefined,
            undefined
        );
        const tx = await this.signP(unsignedTx);
        const txId = await pChain.issueTx(tx);

        await waitTxP(txId);

        await this.updateUtxosP();

        return txId;
    }

    /**
     *
     * @param sourceChain Which chain to import from. `X` or `P`
     * @param [fee] The import fee to use in the transactions. If omitted the SDK will try to calculate the fee. For deterministic transactions you should always pre calculate and provide this value.
     * @param [utxoSet] If omitted imports all atomic UTXOs.
     */
    async importC(sourceChain: ExportChainsC, fee?: BN, utxoSet?: EVMUTXOSet) {
        let bechAddr = this.getEvmAddressBech();

        if (!utxoSet) {
            utxoSet = await this.getAtomicUTXOsC(sourceChain);
        }

        const utxos = utxoSet.getAllUTXOs();
        if (utxos.length === 0) {
            throw new Error('Nothing to import.');
        }

        let toAddress = this.getAddressC();
        let ownerAddresses = [bechAddr];
        let fromAddresses = ownerAddresses;
        const sourceChainId = chainIdFromAlias(sourceChain);

        // Calculate fee if not provided
        if (!fee) {
            // Calculate number of signatures
            const numSigs = utxos.reduce((acc, utxo) => {
                return acc + utxo.getOutput().getAddresses().length;
            }, 0);
            const numIns = utxos.length;

            const importGas = estimateImportGasFeeFromMockTx(numIns, numSigs);
            const baseFee = await getBaseFeeRecommended();
            fee = avaxCtoX(baseFee.mul(new BN(importGas)));
        }

        const unsignedTx = await cChain.buildImportTx(
            utxoSet,
            toAddress,
            ownerAddresses,
            sourceChainId,
            fromAddresses,
            fee
        );
        let tx = await this.signC(unsignedTx);
        let id = await cChain.issueTx(tx);

        await waitTxC(id);

        await this.updateAvaxBalanceC();

        return id;
    }

    async createNftFamily(name: string, symbol: string, groupNum: number) {
        let fromAddresses = await this.getAllAddressesX();
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

        let sourceAddresses = await this.getAllAddressesX();

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

        let pAddressStrings = await this.getAllAddressesP();

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
        let pAddressStrings = await this.getAllAddressesP();

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

    /**
     * Issues the given transaction.
     * @param tx A universal transaction json object.
     */
    public async issueUniversalTx(tx: UniversalTx): Promise<string> {
        switch (tx.action) {
            case 'export_x_c':
                return await this.exportXChain(tx.amount, 'C');
            case 'import_x_c':
                return await this.importC('X', tx.fee);
            case 'export_x_p':
                return await this.exportXChain(tx.amount, 'P');
            case 'import_x_p':
                return await this.importP('X');
            case 'export_c_x':
                return await this.exportCChain(tx.amount, 'X', tx.fee);
            case 'import_c_x':
                return await this.importX('C');
            case 'export_c_p':
                return await this.exportCChain(tx.amount, 'P', tx.fee);
            case 'import_c_p':
                return await this.importP('C');
            case 'export_p_x':
                return await this.exportPChain(tx.amount, 'X');
            case 'import_p_x':
                return await this.importX('P');
            case 'export_p_c':
                return await this.exportPChain(tx.amount, 'C');
            case 'import_p_c':
                return await this.importC('P', tx.fee);
            default:
                throw new Error('Method not supported.');
        }
    }

    async getHistoryX(limit = 0): Promise<OrteliusAvalancheTx[]> {
        let addrs = await this.getAllAddressesX();
        return await getAddressHistory(addrs, limit, xChain.getBlockchainID());
    }

    async getHistoryP(limit = 0): Promise<OrteliusAvalancheTx[]> {
        let addrs = await this.getAllAddressesP();
        return await getAddressHistory(addrs, limit, pChain.getBlockchainID());
    }

    /**
     * Returns atomic history for this wallet on the C chain.
     * @remarks Excludes EVM transactions.
     * @param limit
     */
    async getHistoryC(limit = 0): Promise<OrteliusAvalancheTx[]> {
        let addrs = [this.getEvmAddressBech(), ...(await this.getAllAddressesX())];
        return await getAddressHistory(addrs, limit, cChain.getBlockchainID());
    }

    /**
     * Returns history for this wallet on the C chain.
     * @remarks Excludes atomic C chain import/export transactions.
     */
    async getHistoryEVM() {
        let addr = this.getAddressC();
        return await getAddressHistoryEVM(addr);
    }

    /**
     * Returns the erc 20 activity for this wallet's C chain address. Uses Snowtrace APIs.
     * @param offset Number of items per page. Optional.
     * @param page If provided will paginate the results. Optional.
     * @param contractAddress Filter activity by the ERC20 contract address. Optional.
     */
    async getHistoryERC20(page?: number, offset?: number, contractAddress?: string) {
        const erc20Hist = await getErc20History(this.getAddressC(), activeNetwork, page, offset, contractAddress);
        return erc20Hist;
    }

    /**
     * Get a list of 'Normal' Transactions for wallet's C chain address. Uses Snowtrace APIs.
     * @param offset Number of items per page. Optional.
     * @param page If provided will paginate the results. Optional.
     */
    async getHistoryNormalTx(page?: number, offset?: number) {
        const normalHist = await getNormalHistory(this.getAddressC(), activeNetwork, page, offset);
        return normalHist;
    }

    async getHistory(limit: number = 0): Promise<HistoryItemType[]> {
        return getHistoryForOwnedAddresses(
            await this.getAllAddressesX(),
            await this.getAllAddressesP(),
            this.getEvmAddressBech(),
            this.getAddressC(),
            limit
        );
    }

    /**
     * Fetches information about the given txId and parses it from the wallet's perspective
     * @param txId
     */
    async getHistoryTx(txId: string): Promise<HistoryItemType> {
        let addrs = await this.getAllAddressesX();
        let addrC = this.getAddressC();

        let rawData = await getTx(txId);
        return await getTransactionSummary(rawData, addrs, addrC);
    }

    /**
     * Fetches information about the given txId and parses it from the wallet's perspective
     * @param txHash
     */
    async getHistoryTxEvm(txHash: string): Promise<HistoryItemType> {
        let addrC = this.getAddressC();

        let rawData = await getTxEvm(txHash);
        return getTransactionSummaryEVM(rawData, addrC);
    }

    async parseOrteliusTx(tx: OrteliusAvalancheTx): Promise<HistoryItemType> {
        let addrsX = await this.getAllAddressesX();
        let addrBechC = this.getEvmAddressBech();
        let addrs = [...addrsX, addrBechC];
        let addrC = this.getAddressC();
        return await getTransactionSummary(tx, addrs, addrC);
    }
}
