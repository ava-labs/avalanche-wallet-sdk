//Testing pubsub
// import { Socket, PubSub } from 'avalanche';
import { NetworkConfig } from './types';
// import { wsUrlFromConfigEVM, wsUrlFromConfigX } from '@/helpers/network_helper';
// import { WalletProvider } from '@/Wallet/Wallet';
// import Web3 from 'web3';
import { DefaultConfig } from '@/Network/constants';
import { connectSocketX } from '@/Network/providers/socket_x';
import { connectSocketC } from '@/Network/providers/socket_c';

// export let socketX: Socket;

// let wsUrl = wsUrlFromConfigEVM(DefaultConfig);

// const wsOptions = {
//     timeout: 30000, // ms
//     // Enable auto reconnection
//     reconnect: {
//         auto: true,
//         delay: 5000, // ms
//         maxAttempts: 5,
//         onTimeout: false,
//     },
// };
// let wsProvider = new Web3.providers.WebsocketProvider(wsUrl, wsOptions);
// export let socketEVM = new Web3(wsProvider);

let activeNetwork: NetworkConfig = DefaultConfig;

export function setSocketNetwork(config: NetworkConfig) {
    // Setup X chain connection
    connectSocketX(config);
    // connectSocketX(config);
    // Setup EVM socket connection
    connectSocketC(config);
    activeNetwork = config;
}

// function connectSocketX(config: NetworkConfig) {
//     if (socketX) {
//         socketX.close();
//     }
//
//     // Setup the X chain socket connection
//     let wsURL = wsUrlFromConfigX(config);
//     socketX = new Socket(wsURL);
//     addListenersX(socketX);
// }

// function connectSocketEVM(config: NetworkConfig) {
//     try {
//         let wsUrl = wsUrlFromConfigEVM(config);
//         let wsProvider = new Web3.providers.WebsocketProvider(wsUrl, wsOptions);
//         socketEVM.setProvider(wsProvider);
//         addListenersEVM(socketEVM);
//     } catch (e) {
//         console.info('EVM Websocket connection failed.');
//     }
// }

/**
 * Add the event listeners to the socket events.
 * @param socket The socket instance to add event listeners to.
 */
// function addListenersX(socket: Socket) {
//     socket.onopen = function () {
//         updateFilterAddresses();
//     };
//
//     socket.onmessage = function () {
//         WalletProvider.refreshInstanceBalancesX();
//     };
//
//     socket.onclose = () => {};
//
//     socket.onerror = (error: any) => {
//         console.log(error);
//     };
// }

// function addListenersEVM(provider: Web3) {
//     let sub = provider.eth.subscribe('newBlockHeaders');
//     sub.on('data', blockHeaderCallback);
//     sub.on('error', onErrorEVM);
// }

// function onErrorEVM(err: any) {
//     console.info(err);
// }

// function blockHeaderCallback() {
//     WalletProvider.refreshInstanceBalancesC();
// }

// const BLOOM_SIZE = 1000;
// export function updateFilterAddresses(): void {
//     if (!socketX) {
//         return;
//     }
//
//     let wallets = WalletProvider.instances;
//     let addrs = wallets.map((w) => w.getAddressX());
//
//     let pubsub = new PubSub();
//     let bloom = pubsub.newBloom(BLOOM_SIZE);
//     let addAddrs = pubsub.addAddresses(addrs);
//
//     socketX.send(bloom);
//     socketX.send(addAddrs);
// }
