import Sockette from 'sockette';
import { PubSub } from 'avalanche';
import { WalletType } from '@/Wallet/types';

const FILTER_ADDRESS_SIZE = 1000;

export default class AVMWebSocketProvider {
    isConnected = false;
    socket: Sockette;

    wallets: WalletType[] = [];
    boundHandler: any;

    constructor(wsUrl: string) {
        this.boundHandler = () => this.onWalletAddressChange();
        this.socket = new Sockette(wsUrl, {
            onopen: () => {
                this.onOpen();
            },
            onclose: () => {
                this.onClose();
            },
            onmessage: () => {
                this.onMessage();
            },
            onerror: () => {
                this.onError();
            },
        });
    }

    /**
     * Starts watching for transactions on this wallet.
     * @param wallet The wallet instance to track
     */
    trackWallet(wallet: WalletType): void {
        if (this.wallets.includes(wallet)) {
            return;
        }
        this.wallets.push(wallet);

        wallet.on('addressChanged', this.boundHandler);
        this.updateFilterAddresses();
    }

    onWalletAddressChange(): void {
        this.updateFilterAddresses();
    }

    removeWallet(w: WalletType): void {
        if (!this.wallets.includes(w)) {
            return;
        }

        let index = this.wallets.indexOf(w);
        this.wallets.splice(index, 1);
        w.off('addressChanged', this.boundHandler);
    }

    setEndpoint(wsUrl: string): void {
        this.socket.close();

        this.socket = new Sockette(wsUrl, {
            onopen: () => {
                this.onOpen();
            },
            onclose: () => {
                this.onClose();
            },
            onmessage: () => {
                this.onMessage();
            },
            onerror: () => {
                this.onError();
            },
        });
    }

    // Clears the filter listening to X chain transactions
    clearFilter(): void {
        let pubsub = new PubSub();
        let bloom = pubsub.newBloom(FILTER_ADDRESS_SIZE);
        this.socket.send(bloom);
    }

    /**
     * Creates a bloom filter from the addresses of the tracked wallets and subscribes to
     * transactions on the node.
     */
    updateFilterAddresses() {
        if (!this.isConnected) {
            return;
        }

        let wallets = this.wallets;

        let addrs = [];
        for (let i = 0; i < wallets.length; i++) {
            let w = wallets[i];
            let externalAddrs = w.getExternalAddressesXSync();
            let addrsLen = externalAddrs.length;
            let startIndex = Math.max(0, addrsLen - FILTER_ADDRESS_SIZE);
            let addAddrs = externalAddrs.slice(startIndex);
            addrs.push(...addAddrs);
        }

        let pubsub = new PubSub();
        let bloom = pubsub.newBloom(FILTER_ADDRESS_SIZE);
        this.socket.send(bloom);

        // Divide addresses by 100 and send multiple messages
        // There is a max msg size ~10kb
        const GROUP_AMOUNT = 100;
        let index = 0;
        while (index < addrs.length) {
            let chunk = addrs.slice(index, index + GROUP_AMOUNT);
            let addAddrs = pubsub.addAddresses(chunk);
            this.socket.send(addAddrs);
            index += GROUP_AMOUNT;
        }
    }

    private updateWalletBalanceX() {
        this.wallets.forEach((w) => {
            w.updateUtxosX();
        });
    }

    private onOpen() {
        this.isConnected = true;
        this.updateFilterAddresses();
    }

    private onMessage() {
        this.updateWalletBalanceX();
    }

    private onClose() {
        this.isConnected = false;
    }

    private onError() {}
}
