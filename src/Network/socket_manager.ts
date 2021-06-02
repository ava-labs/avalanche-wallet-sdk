//Testing pubsub
import { Socket, PubSub } from 'avalanche';
import { NetworkConfig } from './types';
import { wsUrlFromConfigX } from '@/helpers/network_helper';
import { WalletProvider } from '@/Wallet/Wallet';

// let wsURL = wsUrlFromConfigX(DefaultConfig);
export let socketX: Socket;

const bloomSize = 1000;
let pubsub = new PubSub();
let bloom = pubsub.newBloom(bloomSize);
let addAddrs = pubsub.addAddresses(['X-fuji1fwr9479vg7hm895n5q4cxgnsfj23x5uxaxzhuz']);

console.log(bloom);
console.log(addAddrs);

export function setSocketNetwork(config: NetworkConfig) {
    if (socketX) {
        socketX.close();
    }

    let wsURL = wsUrlFromConfigX(config);
    socketX = new Socket(wsURL);

    socketX.onopen = function () {
        console.log('Socket Connected');
        socketX.send(bloom);
        socketX.send(addAddrs);
    };

    socketX.onmessage = function (data: any) {
        console.log(data);
    };

    socketX.onclose = () => {
        console.log('Socket Disconnected');
    };

    socketX.onerror = (error: any) => {
        console.log(error);
    };
}

export function updateFilterAddresses() {
    let wallets = WalletProvider.instances;
    let addrs = wallets.map((w) => w.getAddressX());

    console.log(addrs);
    console.log(wallets);
}
