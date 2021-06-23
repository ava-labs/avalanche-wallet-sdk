import { ethers } from 'ethers';
import { NetworkConfig } from '@/Network/types';
import { wsUrlFromConfigEVM } from '@/helpers/network_helper';
import { WalletProvider } from '@/Wallet/Wallet';

const SOCKET_RECONNECT_TIMEOUT = 1000;
let configNow: NetworkConfig;

export let socketEVM: ethers.providers.WebSocketProvider;

export function connectSocketC(conf: NetworkConfig) {
    try {
        let wsUrl = wsUrlFromConfigEVM(conf);
        let wsProvider = new ethers.providers.WebSocketProvider(wsUrl);

        if (socketEVM) {
            // TODO: Might need to call the default here
            socketEVM._websocket.onclose = () => {};
            socketEVM.destroy();
            socketEVM = wsProvider;
        } else {
            socketEVM = wsProvider;
        }

        updateEVMSubscriptions();

        // Save default function so we can keep calling it
        let defaultOnOpen = wsProvider._websocket.onopen;
        let defaultOnClose = wsProvider._websocket.onclose;

        wsProvider._websocket.onopen = (ev: any) => {
            if (defaultOnOpen) defaultOnOpen(ev);
        };

        wsProvider._websocket.onclose = (ev: any) => {
            if (defaultOnClose) defaultOnClose(ev);

            setTimeout(() => {
                connectSocketC(configNow);
            }, SOCKET_RECONNECT_TIMEOUT);
        };

        configNow = conf;
    } catch (e) {
        console.info('EVM Websocket connection failed.');
    }
}

let evmSubscriptionTimeout: NodeJS.Timeout;
const SUBSCRIBE_TIMEOUT = 500;

export function updateEVMSubscriptions() {
    if (!socketEVM) {
        // try again later
        if (evmSubscriptionTimeout) {
            clearTimeout(evmSubscriptionTimeout);
        }
        evmSubscriptionTimeout = setTimeout(() => {
            updateEVMSubscriptions();
        }, SUBSCRIBE_TIMEOUT);
        return;
    }

    removeBlockHeaderListener(socketEVM);
    addBlockHeaderListener(socketEVM);
}

function removeBlockHeaderListener(provider: ethers.providers.WebSocketProvider) {
    provider.off('block', blockHeaderCallback);
}

function addBlockHeaderListener(provider: ethers.providers.WebSocketProvider) {
    provider.on('block', blockHeaderCallback);
}

function blockHeaderCallback() {
    updateWalletBalanceC();
}

function updateWalletBalanceC() {
    WalletProvider.refreshInstanceBalancesC();
}
