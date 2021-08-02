import { UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm/utxos';
import { UTXOSet as PlatformUTXOSet } from 'avalanche/dist/apis/platformvm/utxos';
import { UTXOSet as EVMUTXOSet } from 'avalanche/dist/apis/evm/utxos';
import { xChain, cChain, pChain } from '@/Network/network';
import { BN } from 'avalanche';
import { AvmImportChainType } from '@/Wallet/types';
import { GetStakeResponse } from 'avalanche/dist/common';

/**
 *
 * @param addrs an array of X chain addresses to get the atomic utxos of
 * @param chainID Which chain to check agains, either `P` or `C`
 */
export async function avmGetAtomicUTXOs(addrs: string[], chainID: AvmImportChainType): Promise<AVMUTXOSet> {
    const selection = addrs.slice(0, 1024);
    const remaining = addrs.slice(1024);

    let utxoSet;
    if (chainID === 'P') {
        utxoSet = (await xChain.getUTXOs(selection, pChain.getBlockchainID())).utxos;
    } else {
        utxoSet = (await xChain.getUTXOs(selection, cChain.getBlockchainID())).utxos;
    }

    if (remaining.length > 0) {
        const nextSet = await avmGetAtomicUTXOs(remaining, chainID);
        utxoSet = utxoSet.merge(nextSet);
    }
    return utxoSet;
}

// todo: Use end index to get ALL utxos
export async function platformGetAtomicUTXOs(addrs: string[]): Promise<PlatformUTXOSet> {
    // if (addrs.length > 1024) {
    //     throw new Error('Number of addresses can not be greater than 1024.');
    // }
    let selection = addrs.slice(0, 1024);
    let remaining = addrs.slice(1024);

    let utxoSet = (await pChain.getUTXOs(selection, xChain.getBlockchainID())).utxos;
    if (remaining.length > 0) {
        // @ts-ignore
        let nextSet = await platformGetAtomicUTXOs(remaining);
        // @ts-ignore
        utxoSet = utxoSet.merge(nextSet);
    }
    return utxoSet;
}

// todo: Use end index to get ALL utxos
async function evmGetAtomicUTXOs(addrs: string[]): Promise<EVMUTXOSet> {
    if (addrs.length > 1024) {
        throw new Error('Number of addresses can not be greater than 1024.');
    }

    let result: EVMUTXOSet = (await cChain.getUTXOs(addrs, xChain.getBlockchainID())).utxos;
    return result;
}

export async function getStakeForAddresses(addrs: string[]): Promise<GetStakeResponse> {
    if (addrs.length <= 256) {
        let data = await pChain.getStake(addrs);
        return data;
    } else {
        //Break the list in to 1024 chunks
        let chunk = addrs.slice(0, 256);
        let remainingChunk = addrs.slice(256);

        let chunkData = await pChain.getStake(chunk);
        let chunkStake = chunkData.staked;
        let chunkUtxos = chunkData.stakedOutputs;

        let next = await getStakeForAddresses(remainingChunk);
        return {
            staked: chunkStake.add(next.staked),
            stakedOutputs: [...chunkUtxos, ...next.stakedOutputs],
        };
    }
}

export async function avmGetAllUTXOs(addrs: string[]): Promise<AVMUTXOSet> {
    if (addrs.length <= 1024) {
        let utxos = await avmGetAllUTXOsForAddresses(addrs);
        return utxos;
    } else {
        //Break the list in to 1024 chunks
        let chunk = addrs.slice(0, 1024);
        let remainingChunk = addrs.slice(1024);

        let newSet = await avmGetAllUTXOsForAddresses(chunk);
        return newSet.merge(await avmGetAllUTXOs(remainingChunk));
    }
}

export async function avmGetAllUTXOsForAddresses(addrs: string[], endIndex?: any): Promise<AVMUTXOSet> {
    if (addrs.length > 1024) throw new Error('Maximum length of addresses is 1024');
    let response;
    if (!endIndex) {
        response = await xChain.getUTXOs(addrs);
    } else {
        response = await xChain.getUTXOs(addrs, undefined, 0, endIndex);
    }

    let utxoSet = response.utxos;
    let utxos = utxoSet.getAllUTXOs();
    let nextEndIndex = response.endIndex;
    let len = response.numFetched;

    if (len >= 1024) {
        let subUtxos = await avmGetAllUTXOsForAddresses(addrs, nextEndIndex);
        return utxoSet.merge(subUtxos);
    }
    return utxoSet;
}

// helper method to get utxos for more than 1024 addresses
export async function platformGetAllUTXOs(addrs: string[]): Promise<PlatformUTXOSet> {
    if (addrs.length <= 1024) {
        let newSet = await platformGetAllUTXOsForAddresses(addrs);
        return newSet;
    } else {
        //Break the list in to 1024 chunks
        let chunk = addrs.slice(0, 1024);
        let remainingChunk = addrs.slice(1024);

        let newSet = await platformGetAllUTXOsForAddresses(chunk);

        return newSet.merge(await platformGetAllUTXOs(remainingChunk));
    }
}

export async function platformGetAllUTXOsForAddresses(addrs: string[], endIndex?: any): Promise<PlatformUTXOSet> {
    let response;
    if (!endIndex) {
        response = await pChain.getUTXOs(addrs);
    } else {
        response = await pChain.getUTXOs(addrs, undefined, 0, endIndex);
    }

    let utxoSet = response.utxos;
    let nextEndIndex = response.endIndex;
    let len = response.numFetched;

    if (len >= 1024) {
        let subUtxos = await platformGetAllUTXOsForAddresses(addrs, nextEndIndex);
        return utxoSet.merge(subUtxos);
    }

    return utxoSet;
}
