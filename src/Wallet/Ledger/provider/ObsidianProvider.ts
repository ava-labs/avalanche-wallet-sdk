import Transport from '@ledgerhq/hw-transport';
import AppObsidian from '@obsidiansystems/hw-app-avalanche';
import { LedgerProvider } from '@/Wallet/Ledger/provider/models';
import bip32Path, { Bip32Path } from 'bip32-path';

export const ObsidianProvider: LedgerProvider = {
    type: 'obsidian',

    getApp(t: Transport): AppObsidian {
        return new AppObsidian(t);
    },

    async getVersion(t): Promise<string> {
        const app = this.getApp(t) as AppObsidian;
        return (await app.getAppConfiguration()).version;
    },

    async getXPUB(t: Transport, path: string) {
        const app = this.getApp(t) as AppObsidian;
        const keys = await app.getWalletExtendedPublicKey(path);
        return {
            pubKey: keys.public_key,
            chainCode: keys.chain_code,
        };
    },

    async signHash(t, hash, account, signers) {
        const app = this.getApp(t) as AppObsidian;
        const signed = await app.signHash(account, signers, hash);
        return {
            signatures: signed,
            hash: hash,
        };
    },

    async getAddress(t, path, config = { show: true, hrp: 'avax' }) {
        const app = this.getApp(t) as AppObsidian;

        const res = await app.getWalletAddress(path.toString(), config.hrp);
        return {
            publicKey: res,
        };
    },

    async signTx(t: Transport, tx, accountPath, signers, change) {
        const app = this.getApp(t) as AppObsidian;

        let changePath = undefined;
        if (change && change.length > 0) {
            const newPath = `${accountPath.toString()}/${change[0].toString(true)}`;
            changePath = bip32Path.fromString(newPath);
        }

        const signed = await app.signTransaction(accountPath, signers, tx, changePath);

        return {
            signatures: signed.signatures,
        };
    },

    /**
     * This method is not supported on the Obsidian provider
     */
    canParseTx(): boolean {
        return false;
    },
};
