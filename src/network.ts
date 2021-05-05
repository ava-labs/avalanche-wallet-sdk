import { Avalanche } from 'avalanche/dist';
import { AVMAPI } from 'avalanche/dist/apis/avm';
import { InfoAPI } from 'avalanche/dist/apis/info';
import BinTools from 'avalanche/dist/utils/bintools';
import { EVMAPI } from 'avalanche/dist/apis/evm';
import Web3 from 'web3';
import { MainnetConfig } from './constants';
import { NetworkConfig } from './types';

// Default network connection
const DefaultConfig = MainnetConfig;

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

const rpcUrl = `${DefaultConfig.apiProtocol}://${DefaultConfig.apiIp}:${DefaultConfig.apiPort}/ext/bc/C/rpc`;
export const web3 = new Web3(rpcUrl);

export async function setNetwork(conf: NetworkConfig) {
    avalanche.setAddress(conf.apiIp, conf.apiPort, conf.apiProtocol);
    avalanche.setNetworkID(conf.networkID);

    let chainIdX = await infoApi.getBlockchainID('X');
    let chainIdP = await infoApi.getBlockchainID('P');
    let chainIdC = await infoApi.getBlockchainID('C');

    xChain.refreshBlockchainID(chainIdX);
    xChain.setBlockchainAlias('X');
    pChain.refreshBlockchainID(chainIdP);
    pChain.setBlockchainAlias('P');
    cChain.refreshBlockchainID(chainIdC);
    cChain.setBlockchainAlias('C');

    xChain.getAVAXAssetID(true);
    pChain.getAVAXAssetID(true);
    cChain.getAVAXAssetID(true);

    if (conf.explorerURL) {
        // explorer_api.defaults.baseURL = net.explorerUrl
    }

    // Set web3 Network Settings
    let web3Provider = `${conf.apiProtocol}://${conf.apiIp}:${conf.apiPort}/ext/bc/C/rpc`;
    web3.setProvider(web3Provider);
}
