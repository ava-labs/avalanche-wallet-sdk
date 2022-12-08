import Transport from '@ledgerhq/hw-transport';
import AppZondax from '@avalabs/hw-app-avalanche';
import { Bip32Path } from 'bip32-path';
import { LedgerProvider } from '@/Wallet/Ledger/provider/models';

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

    async getXPUB(t: Transport, path: string) {
        const app = this.getApp(t) as AppZondax;
        const keys = await app.getExtendedPubKey(path, false);
        return {
            pubKey: keys.publicKey,
            chainCode: keys.chain_code,
        };
    },

    async signHash(t, hash, account, signers) {
        const app = this.getApp(t) as AppZondax;
        const signerPaths = signers.map((sig) => sig.toString(true));
        const resp = await app.signHash(account.toString(), signerPaths, hash);

        const sigs = resp.signatures || new Map();
        const hashMsg = resp.hash || Buffer.from('');

        return {
            hash: hashMsg,
            signatures: sigs,
        };
    },

    async signTx(t: Transport, tx: Buffer, accountPath: Bip32Path, signers: Bip32Path[], changePaths: Bip32Path[]) {
        const app = this.getApp(t) as AppZondax;
        const signerPaths = signers.map((path) => path.toString(true));
        const changeArr = changePaths.map((path) => path.toString(true));

        const signed = await app.sign(accountPath.toString(), signerPaths, tx, changeArr);
        const sigs = signed.signatures || new Map();

        return {
            signatures: sigs,
        };
    },
};
