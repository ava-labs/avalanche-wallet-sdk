import axios from 'axios';
import { SNOWTRACE_MAINNET, SNOWTRACE_TESTNET } from '@/Explorer/snowtrace/constants';
import { isFujiNetwork, isMainnetNetwork, NetworkConfig } from '@/Network';
import { SnowtraceErc20Tx, SnowtraceNormalTx, SnowtraceResponse } from '@/Explorer/snowtrace/types';

/**
 *
 * @param isMainnet
 */
function createSnowtraceAPI(isMainnet = true) {
    const baseUrl = isMainnet ? SNOWTRACE_MAINNET : SNOWTRACE_TESTNET;
    return axios.create({
        baseURL: baseUrl,
        withCredentials: false,
        headers: {
            'Content-Type': 'application/json',
        },
    });
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

    if (isMainnetNetwork(networkConfig)) {
        const resp = await createSnowtraceAPI().get<SnowtraceResponse<SnowtraceErc20Tx>>(query);
        return resp.data;
    } else if (isFujiNetwork(networkConfig)) {
        const resp = await createSnowtraceAPI(false).get<SnowtraceResponse<SnowtraceErc20Tx>>(query);
        return resp.data;
    }

    throw new Error('Snow trace is only available for Avalanche Mainnet and Testnet');
}

export async function getNormalHistory(address: string, networkConfig: NetworkConfig, page = 0, offset = 0) {
    const sort = 'desc';
    const query = `api?module=account&action=txlist&address=${address}&sort=${sort}&page=${page}&offset=${offset}`;

    if (isMainnetNetwork(networkConfig)) {
        const resp = await createSnowtraceAPI().get<SnowtraceResponse<SnowtraceNormalTx>>(query);
        return resp.data;
    } else if (isFujiNetwork(networkConfig)) {
        const resp = await createSnowtraceAPI(false).get<SnowtraceResponse<SnowtraceNormalTx>>(query);
        return resp.data;
    }

    throw new Error('Snow trace is only available for Avalanche Mainnet and Testnet');
}
