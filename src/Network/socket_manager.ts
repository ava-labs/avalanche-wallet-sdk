//Testing pubsub
import { Socket, PubSub } from 'avalanche';
import { NetworkConfig } from './types';
import { wsUrlFromConfigX } from '@/helpers/network_helper';
import { WalletProvider } from '@/Wallet/Wallet';

// let wsURL = wsUrlFromConfigX(DefaultConfig);
export let socketX: Socket;

const BLOOM_SIZE = 1000;

export function setSocketNetwork(config: NetworkConfig) {
    if (socketX) {
        socketX.close();
    }

    let wsURL = wsUrlFromConfigX(config);
    socketX = new Socket(wsURL);

    socketX.onopen = function () {
        updateFilterAddresses();
    };

    socketX.onmessage = function () {
        refreshWalletBalancesX();
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

    let pubsub = new PubSub();
    let bloom = pubsub.newBloom(BLOOM_SIZE);
    let addAddrs = pubsub.addAddresses(addrs);

    socketX.send(bloom);
    socketX.send(addAddrs);
}

/**
 * Refreshes X chain UTXOs for every wallet instance
 */
function refreshWalletBalancesX() {
    let wallets = WalletProvider.instances;
    wallets.forEach((w) => {
        w.getUtxosX();
    });
}
