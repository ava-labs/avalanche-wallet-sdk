import { ethers } from 'ethers';
import { WalletType } from '@/Wallet/types';

const SOCKET_RECONNECT_TIMEOUT = 1000;

export class EVMWebSocketProvider {
    provider: ethers.providers.WebSocketProvider;
    wsUrl: string;
    wallets: WalletType[] = [];

    constructor(wsUrl: string) {
        let provider = new ethers.providers.WebSocketProvider(wsUrl);
        this.provider = provider;
        this.wsUrl = wsUrl;

        this.addListeners();
    }

    setEndpoint(wsUrl: string): void {
        this.destroyConnection();
        let provider = new ethers.providers.WebSocketProvider(wsUrl);
        this.provider = provider;
        this.wsUrl = wsUrl;

        this.addListeners();
    }

    trackWallet(wallet: WalletType): void {
        if (this.wallets.includes(wallet)) {
            return;
        }

        this.wallets.push(wallet);
    }

    removeWallet(wallet: WalletType): void {
        if (!this.wallets.includes(wallet)) {
            return;
        }

        let index = this.wallets.indexOf(wallet);
        this.wallets.splice(index, 1);
    }

    async destroyConnection(): Promise<void> {
        this.provider._websocket.onclose = () => {};
        await this.provider.destroy();
    }

    async reconnect(): Promise<void> {
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
        });
    }
}
