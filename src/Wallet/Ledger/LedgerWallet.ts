//@ts-ignore
import Eth from '@ledgerhq/hw-app-eth';
// @ts-ignore
import AppAvax from '@obsidiansystems/hw-app-avalanche';
import EthereumjsCommon from '@ethereumjs/common';
import { importPublic, bnToRlp, rlp, BN as EthBN } from 'ethereumjs-util';
import {
    AVAX_ACCOUNT_PATH,
    ETH_ACCOUNT_PATH,
    LEDGER_ETH_ACCOUNT_PATH,
    LEDGER_EXCHANGE_TIMEOUT,
    MIN_EVM_SUPPORT_V,
} from '@/Wallet/constants';
import HDKey from 'hdkey';
import { ChainAlias, ILedgerAppConfig, WalletNameType } from '@/Wallet/types';
import { Transaction, TxOptions } from '@ethereumjs/tx';
import {
    UnsignedTx as AVMUnsignedTx,
    Tx as AVMTx,
    TransferableOperation,
    OperationTx,
    AVMConstants,
    ImportTx as AVMImportTx,
    SelectCredentialClass as AVMSelectCredentialClass,
} from 'avalanche/dist/apis/avm';
import { Credential, SigIdx, Signature } from 'avalanche/dist/common';
import {
    UnsignedTx as EVMUnsignedTx,
    Tx as EVMTx,
    ImportTx as EVMImportTx,
    ExportTx as EVMExportTx,
    EVMInput,
    SelectCredentialClass as EVMSelectCredentialClass,
    EVMConstants,
} from 'avalanche/dist/apis/evm';
import {
    UnsignedTx as PlatformUnsignedTx,
    Tx as PlatformTx,
    PlatformVMConstants,
    ExportTx as PlatformExportTx,
    ImportTx as PlatformImportTx,
    SelectCredentialClass as PlatformSelectCredentialClass,
} from 'avalanche/dist/apis/platformvm';
import { activeNetwork, avalanche, web3 } from '@/Network/network';
import { Buffer } from 'avalanche';
import { ChainIdType } from '@/common';
import { Buffer as BufferNative } from 'buffer';
import { ParseableAvmTxEnum, ParseablePlatformEnum, ParseableEvmTxEnum } from '@/helpers/tx_helper';
import { sha256 } from '@noble/hashes/sha256';
//@ts-ignore
import bippath from 'bip32-path';
import { bintools } from '@/common';
import { idToChainAlias } from '@/Network';
import { getAccountPathAvalanche, getAccountPathEVM } from '@/Wallet/helpers/derivationHelper';
import { PublicMnemonicWallet } from '@/Wallet/PublicMnemonicWallet';
import { getAppAvax, getAppEth, getEthAddressKeyFromAccountKey, getLedgerConfigAvax } from '@/Wallet/Ledger/utils';
import Transport from '@ledgerhq/hw-transport';
import { ERR_ConfigNotSet, ERR_TransportNotSet } from '@/Wallet/Ledger/errors';
import { TypedDataV1, TypedMessage, typedSignatureHash } from '@metamask/eth-sig-util';

export class LedgerWallet extends PublicMnemonicWallet {
    type: WalletNameType;
    static transport: Transport | undefined;
    static config: ILedgerAppConfig | undefined;
    accountIndex: number;

    /**
     *
     * @param xpubAVM of derivation path m/44'/9000'/n' where `n` is the account index
     * @param xpubEVM of derivation path m/44'/60'/0'/0/n where `n` is the account index
     * @param accountIndex The given xpubs must match this index
     * @param config
     */
    constructor(xpubAVM: string, xpubEVM: string, accountIndex: number) {
        super(xpubAVM, xpubEVM);

        this.type = 'ledger';
        this.accountIndex = accountIndex;
    }

    static async setTransport(transport: Transport) {
        LedgerWallet.transport = transport;

        transport.on('disconnect', () => {
            console.log('transport disconnect');
            LedgerWallet.transport = undefined;
        });

        // Update the config
        const config = await getLedgerConfigAvax(transport);
        LedgerWallet.config = config;
    }
    /**
     * Create a new ledger wallet instance from the given transport
     * @param transport
     * @param accountIndex
     */
    static async fromTransport(transport: Transport, accountIndex = 0) {
        transport.setExchangeTimeout(LEDGER_EXCHANGE_TIMEOUT);

        const pubAvax = await LedgerWallet.getExtendedPublicKeyAvaxAccount(transport, accountIndex);
        const pubEth = await LedgerWallet.getExtendedPublicKeyEthAddress(transport, accountIndex);

        let config = await getLedgerConfigAvax(transport);

        if (config.version < MIN_EVM_SUPPORT_V) {
            throw new Error(`Unable to connect ledger. You must use ledger version ${MIN_EVM_SUPPORT_V} or above.`);
        }
        // Use this transport for all ledger instances
        await LedgerWallet.setTransport(transport);
        const wallet = new LedgerWallet(pubAvax, pubEth, accountIndex);
        return wallet;
    }

    /**
     * Returns the extended public key used by C chain for address derivation.
     * @remarks Returns the extended public key for path `m/44'/60'/0'`. This key can be used to derive C chain addresses.
     * @param transport
     */
    static async getExtendedPublicKeyEthAccount(transport: Transport): Promise<string> {
        const ethApp = getAppEth(transport);
        let ethRes = await ethApp.getAddress(ETH_ACCOUNT_PATH, true, true);
        let hdEth = new HDKey();

        hdEth.publicKey = BufferNative.from(ethRes.publicKey, 'hex');
        hdEth.chainCode = BufferNative.from(ethRes.chainCode!, 'hex');
        return hdEth.publicExtendedKey;
    }

    /**
     * Get the extended public key for a specific C chain address.
     * @returns The xpub of HD node m/44'/60'/0'/0/n where `n` is `accountIndex`
     * @param transport
     * @param accountIndex
     */
    static async getExtendedPublicKeyEthAddress(transport: Transport, accountIndex: number): Promise<string> {
        const accountKey = await LedgerWallet.getExtendedPublicKeyEthAccount(transport);
        return getEthAddressKeyFromAccountKey(accountKey, accountIndex);
    }

    /**
     * Returns the extended public key used by X and P chains for address derivation.
     * @remarks Returns the extended public key for path `m/44'/90000'/n'` where `n` is the account index.
     * @param transport
     * @param accountIndex Which account's public key to derive
     */
    static async getExtendedPublicKeyAvaxAccount(transport: Transport, accountIndex = 0): Promise<string> {
        const app = getAppAvax(transport);

        let res = await app.getWalletExtendedPublicKey(getAccountPathAvalanche(accountIndex));

        let pubKey = res.public_key;
        let chainCode = res.chain_code;

        // Get the base58 publick key from the HDKey instance
        let hdKey = new HDKey();
        // @ts-ignore
        hdKey.publicKey = pubKey;
        // @ts-ignore
        hdKey.chainCode = chainCode;

        return hdKey.publicExtendedKey;
    }

    /**
     * Get information about the AVAX app on the ledger device.
     * @param transport
     */
    static async getAvaxConfig(transport: Transport) {
        return getLedgerConfigAvax(transport);
    }

    async signEvm(tx: Transaction): Promise<Transaction> {
        if (!LedgerWallet.transport) throw ERR_TransportNotSet;

        const rawUnsignedTx = rlp.encode([
            bnToRlp(tx.nonce),
            bnToRlp(tx.gasPrice),
            bnToRlp(tx.gasLimit),
            tx.to !== undefined ? tx.to.buf : Buffer.from([]),
            bnToRlp(tx.value),
            tx.data,
            bnToRlp(tx.common.chainIdBN()),
            Buffer.from([]),
            Buffer.from([]),
        ]);

        const ethApp = getAppEth(LedgerWallet.transport);
        const signature = await ethApp.signTransaction(
            getAccountPathEVM(this.accountIndex),
            rawUnsignedTx.toString('hex')
        );

        const signatureBN = {
            v: new EthBN(signature.v, 16),
            r: new EthBN(signature.r, 16),
            s: new EthBN(signature.s, 16),
        };

        const chainId = await web3.eth.getChainId();
        const networkId = await web3.eth.net.getId();

        let common = EthereumjsCommon.forCustomChain('mainnet', { networkId, chainId }, 'istanbul');

        const chainParams: TxOptions = {
            common,
        };

        const signedTx = Transaction.fromTxData(
            {
                nonce: tx.nonce,
                gasPrice: tx.gasPrice,
                gasLimit: tx.gasLimit,
                to: tx.to,
                value: tx.value,
                data: tx.data,
                ...signatureBN,
            },
            chainParams
        );
        return signedTx;
    }

    // Returns an array of derivation paths that need to sign this transaction
    // Used with signTransactionHash and signTransactionParsable
    async getTransactionPaths<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx>(
        unsignedTx: UnsignedTx,
        chainId: ChainIdType
    ): Promise<{ paths: string[]; isAvaxOnly: boolean }> {
        let tx = unsignedTx.getTransaction();
        let txType = tx.getTxType();

        let ins = tx.getIns();
        let operations: TransferableOperation[] = [];

        // Try to get operations, it will fail if there are none, ignore and continue
        try {
            operations = (tx as OperationTx).getOperations();
        } catch (e) {
            console.log('Failed to get tx operations.');
        }

        let items = ins;
        if (
            (txType === AVMConstants.IMPORTTX && chainId === 'X') ||
            (txType === PlatformVMConstants.IMPORTTX && chainId === 'P')
        ) {
            items = ((tx as AVMImportTx) || PlatformImportTx).getImportInputs();
        }

        let hrp = avalanche.getHRP();
        let paths: string[] = [];

        let isAvaxOnly = true;
        // Collect paths derivation paths for source addresses
        for (let i = 0; i < items.length; i++) {
            let item = items[i];

            let assetId = bintools.cb58Encode(item.getAssetID());
            if (assetId !== activeNetwork.avaxID) {
                isAvaxOnly = false;
            }

            let sigidxs: SigIdx[] = item.getInput().getSigIdxs();
            let sources = sigidxs.map((sigidx) => sigidx.getSource());
            let addrs: string[] = sources.map((source) => {
                return bintools.addressToString(hrp, chainId, source);
            });

            for (let j = 0; j < addrs.length; j++) {
                let srcAddr = addrs[j];
                let pathStr = await this.getPathFromAddress(srcAddr); // returns change/index

                paths.push(pathStr);
            }
        }

        // Do the Same for operational inputs, if there are any...
        for (let i = 0; i < operations.length; i++) {
            let op = operations[i];
            let sigidxs: SigIdx[] = op.getOperation().getSigIdxs();
            let sources = sigidxs.map((sigidx) => sigidx.getSource());
            let addrs: string[] = sources.map((source) => {
                return bintools.addressToString(hrp, chainId, source);
            });

            for (let j = 0; j < addrs.length; j++) {
                let srcAddr = addrs[j];
                let pathStr = await this.getPathFromAddress(srcAddr); // returns change/index

                paths.push(pathStr);
            }
        }

        return { paths, isAvaxOnly };
    }

    async getPathFromAddress(address: string) {
        let externalAddrs = await this.externalScan.getAllAddresses();
        let internalAddrs = await this.internalScan.getAllAddresses();
        let platformAddrs = await this.externalScan.getAllAddresses('P');

        let extIndex = externalAddrs.indexOf(address);
        let intIndex = internalAddrs.indexOf(address);
        let platformIndex = platformAddrs.indexOf(address);

        if (extIndex >= 0) {
            return `0/${extIndex}`;
        } else if (intIndex >= 0) {
            return `1/${intIndex}`;
        } else if (platformIndex >= 0) {
            return `0/${platformIndex}`;
        } else if (address[0] === 'C') {
            return '0/0';
        } else {
            throw new Error('Unable to find source address.');
        }
    }

    async signX(unsignedTx: AVMUnsignedTx): Promise<AVMTx> {
        let tx = unsignedTx.getTransaction();
        let txType = tx.getTxType();
        let chainId: ChainIdType = 'X';

        let parseableTxs = ParseableAvmTxEnum;
        let { paths, isAvaxOnly } = await this.getTransactionPaths<AVMUnsignedTx>(unsignedTx, chainId);

        if (!LedgerWallet.config) throw ERR_ConfigNotSet;

        // If ledger doesnt support parsing, sign hash
        let canLedgerParse = LedgerWallet.config.version >= '0.3.1';
        let isParsableType = txType in parseableTxs && isAvaxOnly;

        let signedTx;
        if (canLedgerParse && isParsableType) {
            signedTx = await this.signTransactionParsable<AVMUnsignedTx, AVMTx>(unsignedTx, paths, chainId);
        } else {
            signedTx = await this.signTransactionHash<AVMUnsignedTx, AVMTx>(unsignedTx, paths, chainId);
        }

        return signedTx;
    }

    getChangePath(chainId?: ChainAlias): string {
        switch (chainId) {
            case 'P':
                return 'm/0';
            case 'X':
            default:
                return 'm/1';
        }
    }

    getChangeIndex(chainId?: ChainAlias): number {
        switch (chainId) {
            case 'P':
                // return this.platformHelper.hdIndex
                return this.externalScan.getIndex();
            case 'X':
            default:
                // return this.internalHelper.hdIndex
                return this.internalScan.getIndex();
        }
    }

    getChangeBipPath<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx>(
        unsignedTx: UnsignedTx,
        chainId: ChainIdType
    ) {
        if (chainId === 'C') {
            return null;
        }

        let tx = unsignedTx.getTransaction();
        let txType = tx.getTxType();

        const chainChangePath = this.getChangePath(chainId).split('m/')[1];
        let changeIdx = this.getChangeIndex(chainId);
        // If change and destination paths are the same
        // it can cause ledger to not display the destination amt.
        // Since platform helper does not have internal/external
        // path for change (it uses the external index)
        // there will be address collisions. So return null.
        if (
            txType === PlatformVMConstants.IMPORTTX ||
            txType === PlatformVMConstants.EXPORTTX ||
            txType === PlatformVMConstants.ADDVALIDATORTX ||
            txType === PlatformVMConstants.ADDDELEGATORTX
        ) {
            return null;
        }

        return bippath.fromString(`${AVAX_ACCOUNT_PATH}/${chainChangePath}/${changeIdx}`);
    }

    // Used for signing transactions that are parsable
    async signTransactionParsable<
        UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx,
        SignedTx extends AVMTx | PlatformTx | EVMTx
    >(unsignedTx: UnsignedTx, paths: string[], chainId: ChainIdType): Promise<SignedTx> {
        // There must be an active transport connection
        if (!LedgerWallet.transport) throw ERR_TransportNotSet;
        let tx = unsignedTx.getTransaction();
        let txType = tx.getTxType();
        let parseableTxs = {
            X: ParseableAvmTxEnum,
            P: ParseablePlatformEnum,
            C: ParseableEvmTxEnum,
        }[chainId];

        let bip32Paths = this.pathsToUniqueBipPaths(paths);

        const appAvax = getAppAvax(LedgerWallet.transport);
        const accountPath =
            chainId === 'C'
                ? bippath.fromString(`${ETH_ACCOUNT_PATH}`)
                : bippath.fromString(getAccountPathAvalanche(this.accountIndex));
        let txbuff = unsignedTx.toBuffer();
        let changePath = this.getChangeBipPath(unsignedTx, chainId);

        let ledgerSignedTx = await appAvax.signTransaction(accountPath, bip32Paths, txbuff, changePath);

        let sigMap = ledgerSignedTx.signatures;
        let creds = this.getCredentials<UnsignedTx>(unsignedTx, paths, sigMap, chainId);

        let signedTx;
        switch (chainId) {
            case 'X':
                signedTx = new AVMTx(unsignedTx as AVMUnsignedTx, creds);
                break;
            case 'P':
                signedTx = new PlatformTx(unsignedTx as PlatformUnsignedTx, creds);
                break;
            case 'C':
                signedTx = new EVMTx(unsignedTx as EVMUnsignedTx, creds);
                break;
        }

        return signedTx as SignedTx;
    }

    /**
     *
     * @param accountPath `m/44'/9000'/0'` For X/P Chains, `m/44'/60'/0'` for C Chain
     * @param bip32Paths an array of paths to sign with `['0/0','0/1'..]`
     * @param hash A buffer of the hash to sign
     * @remarks Never sign untrusted hashes. This can lead to loss of funds.
     */
    async signHash(accountPath: any, bip32Paths: any, hash: Buffer): Promise<Map<string, Buffer>> {
        if (!LedgerWallet.transport) throw ERR_TransportNotSet;
        const appAvax = getAppAvax(LedgerWallet.transport);
        return await appAvax.signHash(accountPath, bip32Paths, hash);
    }
    // Used for non parsable transactions.
    // Ideally we wont use this function at all, but ledger is not ready yet.
    async signTransactionHash<
        UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx,
        SignedTx extends AVMTx | PlatformTx | EVMTx
    >(unsignedTx: UnsignedTx, paths: string[], chainId: ChainIdType): Promise<SignedTx> {
        if (!LedgerWallet.transport) throw ERR_TransportNotSet;
        let txbuff = unsignedTx.toBuffer();
        const msg: Buffer = Buffer.from(sha256(txbuff));

        let bip32Paths = this.pathsToUniqueBipPaths(paths);

        const appAvax = getAppAvax(LedgerWallet.transport);
        // Sign the msg with ledger
        //TODO: Update when ledger supports Accounts
        const accountPathSource = chainId === 'C' ? ETH_ACCOUNT_PATH : getAccountPathAvalanche(this.accountIndex);
        const accountPath = bippath.fromString(accountPathSource);
        let sigMap = await appAvax.signHash(accountPath, bip32Paths, msg);

        let creds: Credential[] = this.getCredentials<UnsignedTx>(unsignedTx, paths, sigMap, chainId);

        let signedTx;
        switch (chainId) {
            case 'X':
                signedTx = new AVMTx(unsignedTx as AVMUnsignedTx, creds);
                break;
            case 'P':
                signedTx = new PlatformTx(unsignedTx as PlatformUnsignedTx, creds);
                break;
            case 'C':
                signedTx = new EVMTx(unsignedTx as EVMUnsignedTx, creds);
                break;
        }

        return signedTx as SignedTx;
    }

    pathsToUniqueBipPaths(paths: string[]) {
        let uniquePaths = paths.filter((val: any, i: number) => {
            return paths.indexOf(val) === i;
        });

        let bip32Paths = uniquePaths.map((path) => {
            return bippath.fromString(path, false);
        });

        return bip32Paths;
    }

    getCredentials<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx>(
        unsignedTx: UnsignedTx,
        paths: string[],
        sigMap: any,
        chainId: ChainIdType
    ): Credential[] {
        let creds: Credential[] = [];
        let tx = unsignedTx.getTransaction();
        let txType = tx.getTxType();

        // @ts-ignore
        let ins = tx.getIns ? tx.getIns() : [];
        let operations: TransferableOperation[] = [];
        let evmInputs: EVMInput[] = [];

        let items = ins;
        if (
            (txType === AVMConstants.IMPORTTX && chainId === 'X') ||
            (txType === PlatformVMConstants.IMPORTTX && chainId === 'P') ||
            (txType === EVMConstants.IMPORTTX && chainId === 'C')
        ) {
            items = ((tx as AVMImportTx) || PlatformImportTx || EVMImportTx).getImportInputs();
        }

        // Try to get operations, it will fail if there are none, ignore and continue
        try {
            operations = (tx as OperationTx).getOperations();
        } catch (e) {
            console.log('Failed to get tx operations.');
        }

        let CredentialClass;
        if (chainId === 'X') {
            CredentialClass = AVMSelectCredentialClass;
        } else if (chainId === 'P') {
            CredentialClass = PlatformSelectCredentialClass;
        } else {
            CredentialClass = EVMSelectCredentialClass;
        }

        // Try to get evm inputs, it will fail if there are none, ignore and continue
        try {
            evmInputs = (tx as EVMExportTx).getInputs();
        } catch (e) {
            console.log('Failed to get EVM inputs.');
        }

        for (let i = 0; i < items.length; i++) {
            const sigidxs: SigIdx[] = items[i].getInput().getSigIdxs();
            const cred: Credential = CredentialClass(items[i].getInput().getCredentialID());

            for (let j = 0; j < sigidxs.length; j++) {
                let pathIndex = i + j;
                let pathStr = paths[pathIndex];

                let sigRaw = sigMap.get(pathStr);
                let sigBuff = Buffer.from(sigRaw);
                const sig: Signature = new Signature();
                sig.fromBuffer(sigBuff);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }

        for (let i = 0; i < operations.length; i++) {
            let op = operations[i].getOperation();
            const sigidxs: SigIdx[] = op.getSigIdxs();
            const cred: Credential = CredentialClass(op.getCredentialID());

            for (let j = 0; j < sigidxs.length; j++) {
                let pathIndex = items.length + i + j;
                let pathStr = paths[pathIndex];

                let sigRaw = sigMap.get(pathStr);
                let sigBuff = Buffer.from(sigRaw);
                const sig: Signature = new Signature();
                sig.fromBuffer(sigBuff);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }

        for (let i = 0; i < evmInputs.length; i++) {
            let evmInput = evmInputs[i];
            const sigidxs: SigIdx[] = evmInput.getSigIdxs();
            const cred: Credential = CredentialClass(evmInput.getCredentialID());

            for (let j = 0; j < sigidxs.length; j++) {
                let pathIndex = items.length + i + j;
                let pathStr = paths[pathIndex];

                let sigRaw = sigMap.get(pathStr);
                let sigBuff = Buffer.from(sigRaw);
                const sig: Signature = new Signature();
                sig.fromBuffer(sigBuff);
                cred.addSignature(sig);
            }
            creds.push(cred);
        }

        return creds;
    }

    async signP(unsignedTx: PlatformUnsignedTx): Promise<PlatformTx> {
        if (!LedgerWallet.transport) throw ERR_TransportNotSet;

        let tx = unsignedTx.getTransaction();
        let txType = tx.getTxType();
        let chainId: ChainIdType = 'P';
        let parseableTxs = ParseablePlatformEnum;

        let { paths, isAvaxOnly } = await this.getTransactionPaths<PlatformUnsignedTx>(unsignedTx, chainId);

        if (!LedgerWallet.config) throw ERR_ConfigNotSet;

        // If ledger doesnt support parsing, sign hash
        let canLedgerParse = LedgerWallet.config.version >= '0.3.1';
        let isParsableType = txType in parseableTxs && isAvaxOnly;

        // TODO: Remove after ledger is fixed
        // If UTXOS contain lockedStakeable funds always use sign hash
        let txIns = unsignedTx.getTransaction().getIns();
        for (let i = 0; i < txIns.length; i++) {
            let typeID = txIns[i].getInput().getTypeID();
            if (typeID === PlatformVMConstants.STAKEABLELOCKINID) {
                canLedgerParse = false;
                break;
            }
        }

        // TODO: Remove after ledger update
        // Ledger is not able to parse P/C atomic transactions
        if (txType === PlatformVMConstants.EXPORTTX) {
            const destChainBuff = (tx as PlatformExportTx).getDestinationChain();
            // If destination chain is C chain, sign hash
            const destChain = idToChainAlias(bintools.cb58Encode(destChainBuff));
            if (destChain === 'C') {
                canLedgerParse = false;
            }
        }
        // TODO: Remove after ledger update
        // Ledger is not able to parse P/C atomic transactions
        if (txType === PlatformVMConstants.IMPORTTX) {
            const sourceChainBuff = (tx as PlatformImportTx).getSourceChain();
            // If destination chain is C chain, sign hash
            const sourceChain = idToChainAlias(bintools.cb58Encode(sourceChainBuff));
            if (sourceChain === 'C') {
                canLedgerParse = false;
            }
        }

        let signedTx;
        if (canLedgerParse && isParsableType) {
            signedTx = await this.signTransactionParsable<PlatformUnsignedTx, PlatformTx>(unsignedTx, paths, chainId);
        } else {
            signedTx = await this.signTransactionHash<PlatformUnsignedTx, PlatformTx>(unsignedTx, paths, chainId);
        }
        return signedTx;
    }

    async signC(unsignedTx: EVMUnsignedTx): Promise<EVMTx> {
        // TODO: Might need to upgrade paths array to:
        //  paths = Array(utxoSet.getAllUTXOs().length).fill('0/0'),
        let tx = unsignedTx.getTransaction();
        let typeId = tx.getTxType();

        let paths = [`0/${this.accountIndex}`];
        if (typeId === EVMConstants.EXPORTTX) {
            let ins = (tx as EVMExportTx).getInputs();
            paths = ins.map(() => `0/${this.accountIndex}`);
        } else if (typeId === EVMConstants.IMPORTTX) {
            let ins = (tx as EVMImportTx).getImportInputs();
            paths = ins.map(() => `0/${this.accountIndex}`);
        }

        let canLedgerParse = true;

        // TODO: Remove after ledger update
        // Ledger is not able to parse P/C atomic transactions
        if (typeId === EVMConstants.EXPORTTX) {
            const destChainBuff = (tx as EVMExportTx).getDestinationChain();
            // If destination chain is C chain, sign hash
            const destChain = idToChainAlias(bintools.cb58Encode(destChainBuff));
            if (destChain === 'P') {
                canLedgerParse = false;
            }
        }
        // TODO: Remove after ledger update
        if (typeId === EVMConstants.IMPORTTX) {
            const sourceChainBuff = (tx as EVMImportTx).getSourceChain();
            // If destination chain is C chain, sign hash
            const sourceChain = idToChainAlias(bintools.cb58Encode(sourceChainBuff));
            if (sourceChain === 'P') {
                canLedgerParse = false;
            }
        }

        let txSigned;
        if (canLedgerParse) {
            txSigned = (await this.signTransactionParsable(unsignedTx, paths, 'C')) as EVMTx;
        } else {
            txSigned = (await this.signTransactionHash(unsignedTx, paths, 'C')) as EVMTx;
        }

        return txSigned;
    }

    // /**
    //  * This function is equivalent to the eth_sign Ethereum JSON-RPC method as specified in EIP-1417,
    //  * as well as the MetaMask's personal_sign method.
    //  * @param data The hex data to sign
    //  */
    // async personalSign(data: string): Promise<string> {
    //     throw new Error('Not implemented.');
    // const ethApp = getAppEth(LedgerWallet.transport);
    // const path = getAccountPathEVM(this.accountIndex).substr(2);
    // const result = await ethApp.signPersonalMessage(path, data.substr(2));
    //
    // let v = result['v'] - 27;
    // let vStr = v.toString(16);
    // if (vStr.length < 2) {
    //     vStr = '0' + v;
    // }
    // const sig = `0x${result['r'] + result['s'] + vStr}`;
    // return sig;
    // }
}
