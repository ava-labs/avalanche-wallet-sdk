import * as bip32 from 'bip32';
import Eth from '@ledgerhq/hw-app-eth';
// @ts-ignore
import AppAvax from '@obsidiansystems/hw-app-avalanche';
import { MIN_EVM_SUPPORT_V } from '@/Wallet/constants';
import { ILedgerAppConfig } from '@/Wallet/types';

/**
 *
 * @param xpub Extended public key for m/44'/60'/0'
 * @param index Index of the Eth address
 * @returns Extended public key for m/44'/60'/0'/0/n where `n` is the address index
 */
export function getEthAddressKeyFromAccountKey(xpub: string, index: number) {
    const node = bip32.fromBase58(xpub).derivePath(`0/${index}`);
    return node.toBase58();
}

export function getAppAvax(transport: any): AppAvax {
    return new AppAvax(transport, 'w0w');
}

export function getAppEth(transport: any): Eth {
    return new Eth(transport, 'w0w');
}

export async function getLedgerConfigAvax(transport: any): Promise<ILedgerAppConfig> {
    const app = getAppAvax(transport);
    let config = await app.getAppConfiguration();

    if (!config) {
        throw new Error(`Unable to connect ledger. You must use ledger version ${MIN_EVM_SUPPORT_V} or above.`);
    }

    return config;
}
