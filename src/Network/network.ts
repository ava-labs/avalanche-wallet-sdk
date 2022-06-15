import { Avalanche } from 'avalanche/dist';
import { AVMAPI } from 'avalanche/dist/apis/avm';
import { InfoAPI } from 'avalanche/dist/apis/info';
import { EVMAPI } from 'avalanche/dist/apis/evm';
import Web3 from 'web3';
import { DefaultConfig } from './constants';
import { NetworkConfig, NetworkConfigRpc, NetworkProtocolType } from './types';
import { getRpcC, getRpcP, getRpcX } from './helpers/rpcFromConfig';
import URL from 'url';
import { bintools } from '@/common';
import {
    canUseCredentials,
    createAvalancheProvider,
    createExplorerApi,
    getNetworkIdFromURL,
} from '@/helpers/network_helper';

import { FetchHttpProvider } from '@/utils/FetchHTTPProvider';
import { getEthersJsonRpcProvider } from '@/Network/getEthersProvider';
import { ethers } from 'ethers';
import { HttpClient } from '@/helpers/http_client';

export const avalanche: Avalanche = createAvalancheProvider(DefaultConfig);

export const xChain: AVMAPI = avalanche.XChain();
export const cChain: EVMAPI = avalanche.CChain();
export const pChain = avalanche.PChain();
export const infoApi: InfoAPI = avalanche.Info();

function getProviderFromUrl(url: string, credentials = false) {
    return new FetchHttpProvider(url, {
        timeout: 20000,
        withCredentials: credentials,
    });
}

const rpcUrl = getRpcC(DefaultConfig);
export const web3 = new Web3(getProviderFromUrl(rpcUrl, true) as any);
// JSON RPC Ethers provider
export let ethersProvider: ethers.providers.JsonRpcProvider = getEthersJsonRpcProvider(DefaultConfig);
export let explorer_api: HttpClient | null = null;
export let activeNetwork: NetworkConfig = DefaultConfig;

/**
 * Returns the evm chain ID of the active network
 */
export function getEvmChainID(): number {
    return activeNetwork.evmChainID;
}

/**
 * Similar to `setRpcNetwork`, but checks if credentials can be used with the api.
 * @param config
 */
export async function setRpcNetworkAsync(config: NetworkConfig): Promise<void> {
    let credentials = await canUseCredentials(config);
    setRpcNetwork(config, credentials);
}

/**
 * Changes the connected network of the SDK.
 * This is a synchronous call that does not do any network requests.
 * @param conf
 * @param credentials
 */
export function setRpcNetwork(conf: NetworkConfig, credentials = true): void {
    avalanche.setAddress(conf.apiIp, conf.apiPort, conf.apiProtocol);
    avalanche.setNetworkID(conf.networkID);

    if (credentials) {
        avalanche.setRequestConfig('withCredentials', credentials);
    } else {
        avalanche.removeRequestConfig('withCredentials');
    }

    xChain.refreshBlockchainID(conf.xChainID);
    xChain.setBlockchainAlias('X');

    pChain.refreshBlockchainID(conf.pChainID);
    pChain.setBlockchainAlias('P');

    cChain.refreshBlockchainID(conf.cChainID);
    cChain.setBlockchainAlias('C');

    xChain.setAVAXAssetID(conf.avaxID);
    pChain.setAVAXAssetID(conf.avaxID);
    cChain.setAVAXAssetID(conf.avaxID);

    if (conf.explorerURL) {
        explorer_api = createExplorerApi(conf);
    } else {
        explorer_api = null;
    }

    let rpcUrl = getRpcC(conf);
    web3.setProvider(getProviderFromUrl(rpcUrl, credentials) as any);
    // Update ethers provider
    ethersProvider = getEthersJsonRpcProvider(conf);

    activeNetwork = conf;
}

/**
 * Given the base url for an Avalanche API, returns a NetworkConfig object.
 * @param url A string including protocol, base domain, and ports (if any). Ex: `http://localhost:9650`
 */
export async function getConfigFromUrl(url: string): Promise<NetworkConfig> {
    let urlObj = URL.parse(url);
    let portStr = urlObj.port;
    if (!urlObj.hostname || !urlObj.protocol) throw new Error('Invalid url.');

    if (!portStr) {
        portStr = urlObj.protocol === 'http:' ? '80' : '443';
    }

    // get network ID
    let netID = await getNetworkIdFromURL(url);
    let protocol: NetworkProtocolType = urlObj.protocol === 'http:' ? 'http' : 'https';

    let connection = new Avalanche(urlObj.hostname, parseInt(portStr), protocol, netID);
    // TODO: Use a helper for this
    let connectionEvm = new Web3(getProviderFromUrl(urlObj.href + 'ext/bc/C/rpc') as any);

    let infoApi = connection.Info();
    let xApi = connection.XChain();

    let fetchIdX = infoApi.getBlockchainID('X');
    let fetchIdP = infoApi.getBlockchainID('P');
    let fetchIdC = infoApi.getBlockchainID('C');
    let fetchEvmChainID = connectionEvm.eth.getChainId();
    let fetchAvaxId = await xApi.getAVAXAssetID();

    let values = await Promise.all([fetchIdX, fetchIdP, fetchIdC, fetchAvaxId, fetchEvmChainID]);

    let idX = values[0];
    let idP = values[1];
    let idC = values[2];
    let avaxId = bintools.cb58Encode(values[3]);
    let evmChainId = values[4];

    let config: NetworkConfig = {
        rawUrl: url,
        apiProtocol: protocol,
        apiIp: urlObj.hostname,
        apiPort: parseInt(portStr),
        networkID: netID,
        xChainID: idX,
        pChainID: idP,
        cChainID: idC,
        avaxID: avaxId,
        evmChainID: evmChainId,
        get rpcUrl(): NetworkConfigRpc {
            return {
                c: getRpcC(this),
                p: getRpcP(this),
                x: getRpcX(this),
            };
        },
    };

    return config;
}
