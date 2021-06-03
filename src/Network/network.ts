import { Avalanche, Socket, PubSub } from 'avalanche/dist';
import { AVMAPI } from 'avalanche/dist/apis/avm';
import { InfoAPI } from 'avalanche/dist/apis/info';
import BinTools from 'avalanche/dist/utils/bintools';
import { EVMAPI } from 'avalanche/dist/apis/evm';
import Web3 from 'web3';
import { MainnetConfig, TestnetConfig } from './constants';
import { NetworkConfig } from './types';
import axios, { AxiosInstance } from 'axios';
import { rpcUrlFromConfig } from '@/helpers/network_helper';

// Default network connection
export const DefaultConfig = MainnetConfig;

export const avalanche: Avalanche = new Avalanche(
    DefaultConfig.apiIp,
    DefaultConfig.apiPort,
    DefaultConfig.apiProtocol,
    DefaultConfig.networkID
);

export const xChain: AVMAPI = avalanche.XChain();
export const cChain: EVMAPI = avalanche.CChain();
export const pChain = avalanche.PChain();
export const infoApi: InfoAPI = avalanche.Info();
export const bintools: BinTools = BinTools.getInstance();

const rpcUrl = rpcUrlFromConfig(DefaultConfig);
export const web3 = new Web3(rpcUrl);

export let explorer_api: AxiosInstance | null = null;
export let activeNetwork: NetworkConfig = MainnetConfig;

function createExplorerApi(networkConfig: NetworkConfig) {
    if (!networkConfig.explorerURL) {
        throw new Error('Network configuration does not specify an explorer API.');
    }

    return axios.create({
        baseURL: networkConfig.explorerURL,
        withCredentials: false,
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export function setRpcNetwork(conf: NetworkConfig): void {
    avalanche.setAddress(conf.apiIp, conf.apiPort, conf.apiProtocol);
    avalanche.setNetworkID(conf.networkID);

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

    // Set web3 Network Settings
    let web3Provider = rpcUrlFromConfig(conf);
    web3.setProvider(web3Provider);
    activeNetwork = conf;
}
