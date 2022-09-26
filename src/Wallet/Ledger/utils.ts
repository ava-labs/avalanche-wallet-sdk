import * as bip32 from 'bip32';
import Eth from '@ledgerhq/hw-app-eth';
import AppZondax from '@zondax/ledger-avalanche-app';
import AppObsidian from '@obsidiansystems/hw-app-avalanche';
import { MIN_EVM_SUPPORT_V } from '@/Wallet/constants';
import Transport from '@ledgerhq/hw-transport';
import { LedgerProviderType, ObsidianProvider, ZondaxProvider } from '@/Wallet/Ledger/provider';
import { ZONDAX_VERSION } from '@/Wallet/Ledger/provider/constants';
import { AddDelegatorTx, AddValidatorTx } from 'avalanche/dist/apis/platformvm';
import { bintools } from '@/common';
import { avalanche } from '@/Network';
import { BaseTx as AVMBaseTx } from 'avalanche/dist/apis/avm';
import { BaseTx as PlatformBaseTx } from 'avalanche/dist/apis/platformvm';
import { EVMBaseTx } from 'avalanche/dist/apis/evm';
import { UnsignedTx as AVMUnsignedTx } from 'avalanche/dist/apis/avm/tx';
import { UnsignedTx as PlatformUnsignedTx } from 'avalanche/dist/apis/platformvm/tx';
import { UnsignedTx as EVMUnsignedTx } from 'avalanche/dist/apis/evm/tx';

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

export function getAppAvax(transport: Transport, provider: LedgerProviderType) {
    return provider === 'obsidian' ? ObsidianProvider.getApp(transport) : ZondaxProvider.getApp(transport);
}

export function getAppEth(transport: Transport): Eth {
    //@ts-ignore
    return new Eth(transport, 'w0w');
}

export async function getLedgerProvider(transport: Transport) {
    const isObsidian = await isObsidianApp(transport);
    console.log('is obsidian: ', isObsidian);
    return isObsidian ? ObsidianProvider : ZondaxProvider;
}

// export async function getLedgerConfigAvax(transport: any) {
//     const app = getAppAvax(transport);
//     let config = await app.getAppInfo();
//
//     if (!config) {
//         throw new Error(`Unable to connect ledger. You must use ledger version ${MIN_EVM_SUPPORT_V} or above.`);
//     }
//
//     return config;
// }

export async function isObsidianApp(t: Transport): Promise<boolean> {
    const version = await ObsidianProvider.getVersion(t);

    //TODO: Fix when version is updated
    // Current dev zondax version
    if (version === '0.0.2') return false;
    return version < ZONDAX_VERSION;
}

/**
 * Returns an array of unique addresses that are found on stake outputs of a tx.
 * @param tx
 */
export function getStakeOutAddresses(tx: AVMBaseTx | PlatformBaseTx | EVMBaseTx) {
    if (tx instanceof AddValidatorTx || tx instanceof AddDelegatorTx) {
        const allAddrs = tx
            .getStakeOuts()
            .map((out) =>
                out
                    .getOutput()
                    .getAddresses()
                    .map((addr) => {
                        return bintools.addressToString(avalanche.getHRP(), 'P', addr);
                    })
            )
            .flat();
        // Remove duplicates
        return [...new Set(allAddrs)];
    }

    return [];
}

export function getOutputAddresses(tx: AVMBaseTx | PlatformBaseTx) {
    const chainID = tx instanceof AVMBaseTx ? 'X' : 'P';
    const outAddrs = tx
        .getOuts()
        .map((out) =>
            out
                .getOutput()
                .getAddresses()
                .map((addr) => {
                    return bintools.addressToString(avalanche.getHRP(), chainID, addr);
                })
        )
        .flat();
    return [...new Set(outAddrs)];
}

/**
 * Returns every output address for the given transaction.
 * @param unsignedTx
 */
export function getTxOutputAddresses<UnsignedTx extends AVMUnsignedTx | PlatformUnsignedTx | EVMUnsignedTx>(
    unsignedTx: UnsignedTx
) {
    if (unsignedTx instanceof EVMUnsignedTx) {
        return [];
    }

    // console.log(unsignedTx.serialize('display'));

    const tx = unsignedTx.getTransaction();
    if (unsignedTx instanceof AVMUnsignedTx) {
        const outAddrs = getOutputAddresses(tx);
        return outAddrs;
    } else if (unsignedTx instanceof PlatformUnsignedTx) {
        const stakeAddrs = getStakeOutAddresses(tx);
        const outAddrs = getOutputAddresses(tx);

        return [...new Set([...stakeAddrs, ...outAddrs])];
    }

    return [];
}
