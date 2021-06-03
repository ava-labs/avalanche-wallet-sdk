//Testing pubsub
import { Socket, PubSub } from 'avalanche';
import { NetworkConfig } from './types';
import { wsUrlFromConfigEVM, wsUrlFromConfigX } from '@/helpers/network_helper';
import { WalletProvider } from '@/Wallet/Wallet';
import { web3 } from '@/Network/network';
import Web3 from 'web3';
import { DefaultConfig } from '@/Network/constants';

// let wsURL = wsUrlFromConfigX(DefaultConfig);
export let socketX: Socket;

let wsUrl = wsUrlFromConfigEVM(DefaultConfig);
export let socketEVM = new Web3(wsUrl);
let activeNetwork: NetworkConfig = DefaultConfig;

export function setSocketNetwork(config: NetworkConfig) {
    // Setup X chain connection
    connectSocketX(config);
    // Setup EVM socket connection
    connectSocketEVM(config);
    activeNetwork = config;
}

function connectSocketX(config: NetworkConfig) {
    if (socketX) {
        socketX.close();
    }

    // Setup the X chain socket connection
    let wsURL = wsUrlFromConfigX(config);
    socketX = new Socket(wsURL);
    addListenersX(socketX);
}

function connectSocketEVM(config: NetworkConfig) {
    try {
        let wsUrl = wsUrlFromConfigEVM(config);
        socketEVM.setProvider(wsUrl);
        addListenersEVM(socketEVM);
    } catch (e) {
        console.info('EVM Websocket connection failed.');
    }
}

function addListenersX(socket: Socket) {
    socket.onopen = function () {
        updateFilterAddresses();
    };

    socket.onmessage = function () {
        WalletProvider.refreshInstanceBalancesX();
    };

    socket.onclose = () => {};

    socket.onerror = (error: any) => {
        console.log(error);
    };
}

function addListenersEVM(provider: Web3) {
    let sub = provider.eth.subscribe('newBlockHeaders');
    sub.on('data', blockHeaderCallback);
    sub.on('error', onErrorEVM);
}

function onErrorEVM(err: any) {
    console.info(err);
    connectSocketEVM(activeNetwork);
}

function blockHeaderCallback() {
    WalletProvider.refreshInstanceBalancesC();
}

const BLOOM_SIZE = 1000;
export function updateFilterAddresses() {
    let wallets = WalletProvider.instances;
    let addrs = wallets.map((w) => w.getAddressX());

    let pubsub = new PubSub();
    let bloom = pubsub.newBloom(BLOOM_SIZE);
    let addAddrs = pubsub.addAddresses(addrs);

    socketX.send(bloom);
    socketX.send(addAddrs);
}
