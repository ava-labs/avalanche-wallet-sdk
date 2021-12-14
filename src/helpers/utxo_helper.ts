import { UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm/utxos';
import { UTXOSet as PlatformUTXOSet } from 'avalanche/dist/apis/platformvm/utxos';
import { UTXOSet as EVMUTXOSet } from 'avalanche/dist/apis/evm/utxos';
import { xChain, cChain, pChain } from '@/Network/network';
import { ExportChainsC, ExportChainsP, ExportChainsX } from '@/Wallet/types';
import { chainIdFromAlias } from '@/Network/helpers/idFromAlias';
import { GetStakeResponse } from 'avalanche/dist/apis/platformvm/interfaces';

/**
 *
 * @param addrs an array of X chain addresses to get the atomic utxos of
 * @param sourceChain Which chain to check against, either `P` or `C`
 */
export async function avmGetAtomicUTXOs(addrs: string[], sourceChain: ExportChainsX): Promise<AVMUTXOSet> {
    const selection = addrs.slice(0, 1024);
    const remaining = addrs.slice(1024);

    const sourceChainId = chainIdFromAlias(sourceChain);
    let utxoSet = (await xChain.getUTXOs(selection, sourceChainId)).utxos;

    if (remaining.length > 0) {
        const nextSet = await avmGetAtomicUTXOs(remaining, sourceChain);
        utxoSet = utxoSet.merge(nextSet);
    }
    return utxoSet;
}

// todo: Use end index to get ALL utxos
export async function platformGetAtomicUTXOs(addrs: string[], sourceChain: ExportChainsP): Promise<PlatformUTXOSet> {
    let selection = addrs.slice(0, 1024);
    let remaining = addrs.slice(1024);
    const sourceChainId = chainIdFromAlias(sourceChain);

    let utxoSet = (await pChain.getUTXOs(selection, sourceChainId)).utxos;
    if (remaining.length > 0) {
        let nextSet = await platformGetAtomicUTXOs(remaining, sourceChain);
        utxoSet = utxoSet.merge(nextSet);
    }
    return utxoSet;
}

// todo: Use end index to get ALL utxos
export async function evmGetAtomicUTXOs(addrs: string[], sourceChain: ExportChainsC): Promise<EVMUTXOSet> {
    if (addrs.length > 1024) {
        throw new Error('Number of addresses can not be greater than 1024.');
    }
    const sourceChainId = chainIdFromAlias(sourceChain);
    let result: EVMUTXOSet = (await cChain.getUTXOs(addrs, sourceChainId)).utxos;
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
