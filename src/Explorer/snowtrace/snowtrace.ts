import { SNOWTRACE_MAINNET, SNOWTRACE_TESTNET } from '@/Explorer/snowtrace/constants';
import { isFujiNetwork, isMainnetNetwork, NetworkConfig } from '@/Network';
import { SnowtraceErc20Tx, SnowtraceNormalTx, SnowtraceResponse } from '@/Explorer/snowtrace/types';
import { filterDuplicateTransactions } from './utils';

async function fetchSnowtraceAPI<T>(query: string, isMainnet = true): Promise<T> {
    const baseUrl = isMainnet ? SNOWTRACE_MAINNET : SNOWTRACE_TESTNET;
    const response = await fetch(`${baseUrl}/${query}`);
    return response.json();
}

export async function getErc20History(
    address: string,
    networkConfig: NetworkConfig,
    page = 0,
    offset = 0,
    contractAddress?: string
) {
    const contractQuery = contractAddress ? `&contractaddress=${contractAddress}` : '';
    const sort = 'desc';
    const query = `api?module=account&action=tokentx&address=${address}&sort=${sort}&page=${page}&offset=${offset}${contractQuery}`;

    let resp;
    if (isMainnetNetwork(networkConfig)) {
        resp = await fetchSnowtraceAPI<SnowtraceResponse<SnowtraceErc20Tx>>(query);
    } else if (isFujiNetwork(networkConfig)) {
        resp = await fetchSnowtraceAPI<SnowtraceResponse<SnowtraceErc20Tx>>(query, false);
    } else {
        throw new Error('Snow trace is only available for Avalanche Mainnet and Testnet');
    }

    return filterDuplicateTransactions<SnowtraceErc20Tx>(resp.result);
}

export async function getNormalHistory(address: string, networkConfig: NetworkConfig, page = 0, offset = 0) {
    const sort = 'desc';
    const query = `api?module=account&action=txlist&address=${address}&sort=${sort}&page=${page}&offset=${offset}`;

    let resp;
    if (isMainnetNetwork(networkConfig)) {
        resp = await fetchSnowtraceAPI<SnowtraceResponse<SnowtraceNormalTx>>(query);
    } else if (isFujiNetwork(networkConfig)) {
        resp = await fetchSnowtraceAPI<SnowtraceResponse<SnowtraceNormalTx>>(query, false);
    } else {
        throw new Error('Snow trace is only available for Avalanche Mainnet and Testnet');
    }
    return filterDuplicateTransactions<SnowtraceNormalTx>(resp.result);
}

/**
 * https://docs.etherscan.io/api-endpoints/contracts#get-contract-abi-for-verified-contract-source-codes
 *
 * @param address
 * @param networkConfig
 * @returns string array, the first index is the ABI
 */
export async function getABIForContract(
    address: string,
    networkConfig: NetworkConfig
): Promise<SnowtraceResponse<string>> {
    const isMainnet = isMainnetNetwork(networkConfig);
    const isFuji = isFujiNetwork(networkConfig);

    if (!isMainnet && !isFuji) {
        throw new Error('Snow trace is only available for Avalanche Mainnet and Testnet');
    }

    const params = new window.URLSearchParams({ module: 'contract', action: 'getabi', address });
    return await fetchSnowtraceAPI<SnowtraceResponse<string>>(`api?${params.toString()}`, isMainnet);
}
