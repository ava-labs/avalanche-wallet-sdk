import Sockette from 'sockette';
import { PubSub } from 'avalanche';
import { NetworkConfig } from '@/Network/types';
import { wsUrlFromConfigX } from '@/helpers/network_helper';
import { WalletProvider } from '@/Wallet/Wallet';

const FILTER_ADDRESS_SIZE = 1000;

export let socketX: Sockette;

export function connectSocketX(network: NetworkConfig) {
    if (socketX) {
        socketX.close();
    }

    // Setup the X chain socket connection
    let wsURL = wsUrlFromConfigX(network);
    socketX = new Sockette(wsURL, {
        onopen: xOnOpen,
        onclose: xOnClose,
        onmessage: xOnMessage,
        onerror: xOnError,
    });
}

export function updateFilterAddresses(): void {
    if (!socketX) {
        return;
    }

    let wallets = WalletProvider.instances;

    let addrs = [];
    for (let i = 0; i < wallets.length; i++) {
        let w = wallets[i];
        let externalAddrs = w.getExternalAddressesX();
        let addrsLen = externalAddrs.length;
        let startIndex = Math.max(0, addrsLen - FILTER_ADDRESS_SIZE);
        let addAddrs = externalAddrs.slice(startIndex);
        addrs.push(...addAddrs);
    }

    let pubsub = new PubSub();
    let bloom = pubsub.newBloom(FILTER_ADDRESS_SIZE);

    // Divide addresses by 100 and send multiple messages
    // There is a max msg size ~10kb
    const GROUP_AMOUNT = 100;
    let index = 0;
    while (index < addrs.length) {
        let chunk = addrs.slice(index, index + GROUP_AMOUNT);
        let addAddrs = pubsub.addAddresses(chunk);
        socketX.send(addAddrs);
        index += GROUP_AMOUNT;
    }
}

// Clears the filter listening to X chain transactions
function clearFilter() {
    let pubsub = new PubSub();
    let bloom = pubsub.newBloom(FILTER_ADDRESS_SIZE);
    socketX.send(bloom);
}

function updateWalletBalanceX() {
    WalletProvider.refreshInstanceBalancesX();
}

// AVM Socket Listeners

function xOnOpen() {
    updateFilterAddresses();
}

function xOnMessage() {
    updateWalletBalanceX();
}

function xOnClose() {}

function xOnError() {}
