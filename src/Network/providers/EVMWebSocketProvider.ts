import { ethers } from 'ethers';
import { WalletType } from '@/Wallet/types';
// import { NetworkConfig } from '@/Network/types';
// import { wsUrlFromConfigEVM } from '@/helpers/network_helper';
// import { WalletProvider } from '@/Wallet/Wallet';

// const SUBSCRIBE_TIMEOUT = 500;
const SOCKET_RECONNECT_TIMEOUT = 1000;
// let configNow: NetworkConfig;

export default class EVMWebSocketProvider {
    provider: ethers.providers.WebSocketProvider;
    wsUrl: string;
    wallets: WalletType[] = [];

    constructor(wsUrl: string) {
        let provider = new ethers.providers.WebSocketProvider(wsUrl);
        this.provider = provider;
        this.wsUrl = wsUrl;

        this.addListeners();
    }

    setEndpoint(wsUrl: string) {
        this.destroyConnection();
        let provider = new ethers.providers.WebSocketProvider(wsUrl);
        this.provider = provider;
        this.wsUrl = wsUrl;

        this.addListeners();
    }

    trackWallet(wallet: WalletType) {
        if (this.wallets.includes(wallet)) {
            return;
        }

        this.wallets.push(wallet);
    }

    removeWallet(wallet: WalletType) {
        if (!this.wallets.includes(wallet)) {
            return;
        }

        let index = this.wallets.indexOf(wallet);
        this.wallets.splice(index, 1);
    }

    async destroyConnection() {
        this.provider._websocket.onclose = () => {};
        await this.provider.destroy();
    }

    async reconnect() {
        // Clear the current onclose handler so that we dont attempt a reconnection
        await this.destroyConnection();
        let wsProvider = new ethers.providers.WebSocketProvider(this.wsUrl);
        this.provider = wsProvider;
    }

    private addListeners() {
        let provider = this.provider;

        provider.on('block', () => {
            this.onBlock();
        });

        // Save default function so we can keep calling it
        let defaultOnOpen = provider._websocket.onopen;
        let defaultOnClose = provider._websocket.onclose;

        provider._websocket.onopen = (ev: any) => {
            if (defaultOnOpen) defaultOnOpen(ev);
        };

        provider._websocket.onclose = (ev: any) => {
            if (defaultOnClose) defaultOnClose(ev);

            setTimeout(() => {
                this.reconnect();
            }, SOCKET_RECONNECT_TIMEOUT);
        };
    }

    private removeListeners() {
        this.provider.off('block', this.onBlock);
    }

    private onBlock() {
        // Update wallet balances
        this.wallets.forEach((w) => {
            w.updateAvaxBalanceC();
            w.updateBalanceERC20();
        });
    }
}
// export let socketEVM: ethers.providers.WebSocketProvider;

// export function connectSocketC(conf: NetworkConfig) {
//     try {
//         let wsUrl = wsUrlFromConfigEVM(conf);
//         let wsProvider = new ethers.providers.WebSocketProvider(wsUrl);
//
//         if (socketEVM) {
//             // TODO: Might need to call the default here
//             socketEVM._websocket.onclose = () => {};
//             socketEVM.destroy();
//             socketEVM = wsProvider;
//         } else {
//             socketEVM = wsProvider;
//         }
//
//         updateEVMSubscriptions();
//
//         // Save default function so we can keep calling it
//         let defaultOnOpen = wsProvider._websocket.onopen;
//         let defaultOnClose = wsProvider._websocket.onclose;
//
//         wsProvider._websocket.onopen = (ev: any) => {
//             if (defaultOnOpen) defaultOnOpen(ev);
//         };
//
//         wsProvider._websocket.onclose = (ev: any) => {
//             if (defaultOnClose) defaultOnClose(ev);
//
//             setTimeout(() => {
//                 connectSocketC(configNow);
//             }, SOCKET_RECONNECT_TIMEOUT);
//         };
//
//         configNow = conf;
//     } catch (e) {
//         console.info('EVM Websocket connection failed.');
//     }
// }

// let evmSubscriptionTimeout: NodeJS.Timeout;

// export function updateEVMSubscriptions() {
//     if (!socketEVM) {
//         // try again later
//         if (evmSubscriptionTimeout) {
//             clearTimeout(evmSubscriptionTimeout);
//         }
//         evmSubscriptionTimeout = setTimeout(() => {
//             updateEVMSubscriptions();
//         }, SUBSCRIBE_TIMEOUT);
//         return;
//     }
//
//     removeBlockHeaderListener(socketEVM);
//     addBlockHeaderListener(socketEVM);
// }

// function removeBlockHeaderListener(provider: ethers.providers.WebSocketProvider) {
//     provider.off('block', blockHeaderCallback);
// }

// function addBlockHeaderListener(provider: ethers.providers.WebSocketProvider) {
//     provider.on('block', blockHeaderCallback);
// }

// function blockHeaderCallback() {
//     updateWalletBalanceC();
// }

// function updateWalletBalanceC() {
//     WalletProvider.refreshInstanceBalancesC();
// }
