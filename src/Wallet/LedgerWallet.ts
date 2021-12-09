import Eth from '@ledgerhq/hw-app-eth';
// @ts-ignore
import AppAvax from '@obsidiansystems/hw-app-avalanche';
import EthereumjsCommon from '@ethereumjs/common';
import { importPublic, publicToAddress, bnToRlp, rlp, BN as EthBN } from 'ethereumjs-util';
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
    ImportTx as PlatformImportTx,
    SelectCredentialClass as PlatformSelectCredentialClass,
} from 'avalanche/dist/apis/platformvm';
import { HDWalletAbstract } from '@/Wallet/HDWalletAbstract';
import EvmWalletReadonly from '@/Wallet/EvmWalletReadonly';
import { KeyPair as EVMKeyPair } from 'avalanche/dist/apis/evm/keychain';
import { activeNetwork, avalanche, web3 } from '@/Network/network';
import { Buffer, BN } from 'avalanche';
import { ChainIdType } from '@/types';
import { ParseableAvmTxEnum, ParseablePlatformEnum, ParseableEvmTxEnum } from '@/helpers/tx_helper';
import createHash from 'create-hash';
//@ts-ignore
import bippath from 'bip32-path';
import { bintools } from '@/common';
import * as bip32 from 'bip32';

export default class LedgerWallet extends HDWalletAbstract {
    evmWallet: EvmWalletReadonly;
    type: WalletNameType = 'ledger';
    evmAccount: HDKey;
    config: ILedgerAppConfig;

    appAvax: AppAvax;
    ethApp: Eth;

    constructor(
        avaxAcct: bip32.BIP32Interface,
        evmAcct: HDKey,
        avaxApp: AppAvax,
        ethApp: Eth,
        config: ILedgerAppConfig
    ) {
        super(avaxAcct);
        this.evmAccount = evmAcct;
        this.config = config;
        this.appAvax = avaxApp;
        this.ethApp = ethApp;

        this.evmWallet = new EvmWalletReadonly(importPublic(evmAcct.publicKey));
    }

    /**
     * Create a new ledger wallet instance from the given transport
     * @param transport
     */
    static async fromTransport(transport: any) {
        transport.setExchangeTimeout(LEDGER_EXCHANGE_TIMEOUT);
        let app, eth;

        app = new AppAvax(transport, 'w0w');
        eth = new Eth(transport, 'w0w');

        let config = await app.getAppConfiguration();

        if (!config) {
            throw new Error(`Unable to connect ledger. You must use ledger version ${MIN_EVM_SUPPORT_V} or above.`);
        }

        if (config.version < MIN_EVM_SUPPORT_V) {
            throw new Error(`Unable to connect ledger. You must use ledger version ${MIN_EVM_SUPPORT_V} or above.`);
        }

        return await LedgerWallet.fromApp(app, eth);
    }

    static async getAvaxAccount(app: AppAvax): Promise<bip32.BIP32Interface> {
        let res = await app.getWalletExtendedPublicKey(AVAX_ACCOUNT_PATH);

        let pubKey = res.public_key;
        let chainCode = res.chain_code;

        // Get the base58 publick key from the HDKey instance
        let hdKey = new HDKey();
        // @ts-ignore
        hdKey.publicKey = pubKey;
        // @ts-ignore
        hdKey.chainCode = chainCode;

        let hd = bip32.fromBase58(hdKey.publicExtendedKey);

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
        let config = await app.getAppConfiguration();
        return new LedgerWallet(avaxAccount, evmAccount, app, eth, config);
    }

    getAddressC(): string {
        return this.evmWallet.getAddress();
    }

    getEvmAddressBech(): string {
        let keypair = new EVMKeyPair(avalanche.getHRP(), 'C');
        let addr = keypair.addressFromPublicKey(Buffer.from(this.evmAccount.publicKey));
        return bintools.addressToString(avalanche.getHRP(), 'C', addr);
    }

    async signEvm(tx: Transaction): Promise<Transaction> {
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

        const signature = await this.ethApp.signTransaction(LEDGER_ETH_ACCOUNT_PATH, rawUnsignedTx.toString('hex'));

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
            // @ts-ignore
            // if (assetId !== store.state.Assets.AVA_ASSET_ID) {
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

        // If ledger doesnt support parsing, sign hash
        let canLedgerParse = this.config.version >= '0.3.1';
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
        let tx = unsignedTx.getTransaction();
        let txType = tx.getTxType();
        let parseableTxs = {
            X: ParseableAvmTxEnum,
            P: ParseablePlatformEnum,
            C: ParseableEvmTxEnum,
        }[chainId];

        let title = `Sign ${parseableTxs[txType]}`;

        let bip32Paths = this.pathsToUniqueBipPaths(paths);

        const accountPath =
            chainId === 'C' ? bippath.fromString(`${ETH_ACCOUNT_PATH}`) : bippath.fromString(`${AVAX_ACCOUNT_PATH}`);
        let txbuff = unsignedTx.toBuffer();
        let changePath = this.getChangeBipPath(unsignedTx, chainId);

        let ledgerSignedTx = await this.appAvax.signTransaction(accountPath, bip32Paths, txbuff, changePath);

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

    // Used for non parsable transactions.
    // Ideally we wont use this function at all, but ledger is not ready yet.
    async signTransactionHash<
        UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx,
        SignedTx extends AVMTx | PlatformTx | EVMTx
    >(unsignedTx: UnsignedTx, paths: string[], chainId: ChainIdType): Promise<SignedTx> {
        let txbuff = unsignedTx.toBuffer();
        const msg: Buffer = Buffer.from(createHash('sha256').update(txbuff).digest());

        let bip32Paths = this.pathsToUniqueBipPaths(paths);

        // Sign the msg with ledger
        const accountPath = bippath.fromString(`${AVAX_ACCOUNT_PATH}`);
        let sigMap = await this.appAvax.signHash(accountPath, bip32Paths, msg);

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
        let tx = unsignedTx.getTransaction();
        let txType = tx.getTxType();
        let chainId: ChainIdType = 'P';
        let parseableTxs = ParseablePlatformEnum;

        let { paths, isAvaxOnly } = await this.getTransactionPaths<PlatformUnsignedTx>(unsignedTx, chainId);
        // If ledger doesnt support parsing, sign hash
        let canLedgerParse = this.config.version >= '0.3.1';
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

        let signedTx;
        if (canLedgerParse && isParsableType) {
            signedTx = await this.signTransactionParsable<PlatformUnsignedTx, PlatformTx>(unsignedTx, paths, chainId);
        } else {
            signedTx = await this.signTransactionHash<PlatformUnsignedTx, PlatformTx>(unsignedTx, paths, chainId);
        }
        // store.commit('Ledger/closeModal')
        return signedTx;
    }

    async signC(unsignedTx: EVMUnsignedTx): Promise<EVMTx> {
        // TODO: Might need to upgrade paths array to:
        //  paths = Array(utxoSet.getAllUTXOs().length).fill('0/0'),
        let tx = unsignedTx.getTransaction();
        let typeId = tx.getTxType();

        let paths = ['0/0'];
        if (typeId === EVMConstants.EXPORTTX) {
            let ins = (tx as EVMExportTx).getInputs();
            paths = ins.map(() => '0/0');
        } else if (typeId === EVMConstants.IMPORTTX) {
            let ins = (tx as EVMImportTx).getImportInputs();
            paths = ins.map(() => '0/0');
        }

        let txSigned = (await this.signTransactionParsable(unsignedTx, paths, 'C')) as EVMTx;
        // store.commit('Ledger/closeModal')
        return txSigned;
    }
}
