import Transport from '@ledgerhq/hw-transport';
import AppZondax from '@avalabs/hw-app-avalanche';
import { Bip32Path } from 'bip32-path';
import { LedgerProvider } from '@/Wallet/Ledger/provider/models';

const RETURN_CODE_SUCCESS = 0x9000;

export const ZondaxProvider: LedgerProvider = {
    type: 'zondax',

    getApp(t: Transport): AppZondax {
        return new AppZondax(t);
    },

    async getVersion(t: Transport): Promise<string> {
        const app = this.getApp(t) as AppZondax;
        return (await app.getAppInfo()).appVersion;
    },

    async getAddress(
        t: Transport,
        path: Bip32Path,
        config = {
            show: false,
            hrp: 'avax',
        }
    ) {
        const app = this.getApp(t) as AppZondax;
        const resp = await app.getAddressAndPubKey(path.toString(), config.show, config.hrp, config.chainId);
        return {
            publicKey: resp.publicKey,
        };
    },

    async getXPUB(t: Transport, path: string, config) {
        const app = this.getApp(t) as AppZondax;
        const isShow = !!config?.show;
        const keys = await app.getExtendedPubKey(path, isShow, config?.hrp, config?.chainId);
        if (keys.returnCode !== RETURN_CODE_SUCCESS) throw new Error(keys.errorMessage);

        return {
            pubKey: keys.publicKey,
            chainCode: keys.chain_code,
        };
    },

    async signHash(t, hash, account, signers) {
        const app = this.getApp(t) as AppZondax;
        const signerPaths = signers.map((sig) => sig.toString(true));
        const resp = await app.signHash(account.toString(), signerPaths, hash);
        if (resp.returnCode !== RETURN_CODE_SUCCESS) throw new Error(resp.errorMessage);

        const sigs = resp.signatures || new Map();
        const hashMsg = resp.hash || Buffer.from('');

        return {
            hash: hashMsg,
            signatures: sigs,
        };
    },

    /**
     * Checks if the transaction can be parsed.
     * @param txSize Transaction size in bytes
     * @param signersSize Number of signer paths
     * @param changePathsSize Number of change paths
     */
    canParseTx(txSize: number, signersSize: number, changePathsSize: number) {
        const ledgerMsgSize = (signersSize + changePathsSize) * 9 + txSize;
        const ledgerLimit = 8 * 1024; // Maximum limit we can send to ledger.

        return ledgerMsgSize <= ledgerLimit;
    },

    async signTx(t: Transport, tx: Buffer, accountPath: Bip32Path, signers: Bip32Path[], changePaths: Bip32Path[]) {
        if (!this.canParseTx(tx.length, signers.length, changePaths.length))
            throw new Error(`Transaction size too big.`);

        const app = this.getApp(t) as AppZondax;
        const signerPaths = signers.map((path) => path.toString(true));
        const changeArr = changePaths.map((path) => path.toString(true));

        const signed = await app.sign(accountPath.toString(), signerPaths, tx, changeArr);
        if (signed.returnCode !== RETURN_CODE_SUCCESS) throw new Error(signed.errorMessage);

        const sigs = signed.signatures || new Map();

        return {
            signatures: sigs,
        };
    },
};
