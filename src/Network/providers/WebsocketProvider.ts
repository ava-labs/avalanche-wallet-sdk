import { AVMWebSocketProvider } from '@/Network/providers/AVMWebSocketProvider';
import { EVMWebSocketProvider } from '@/Network/providers/EVMWebSocketProvider';
import { WalletType } from '@/Wallet/types';
import { NetworkConfig } from '@/Network/types';
import { wsUrlFromConfigEVM, wsUrlFromConfigX } from '@/helpers/network_helper';
import { activeNetwork } from '@/Network/network';

export class WebsocketProvider {
    avmProvider: AVMWebSocketProvider;
    evmProvider: EVMWebSocketProvider;

    constructor(avmEndpoint: string, evmEndpoint: string) {
        this.avmProvider = new AVMWebSocketProvider(avmEndpoint);
        this.evmProvider = new EVMWebSocketProvider(evmEndpoint);
    }

    static fromActiveNetwork(): WebsocketProvider {
        return WebsocketProvider.fromNetworkConfig(activeNetwork);
    }

    static fromNetworkConfig(config: NetworkConfig): WebsocketProvider {
        let evm = wsUrlFromConfigEVM(config);
        let avm = wsUrlFromConfigX(config);
        return new WebsocketProvider(avm, evm);
    }

    public setEndpoints(avmEndpoint: string, evmEndpoint: string): void {
        this.avmProvider.setEndpoint(avmEndpoint);
        this.evmProvider.setEndpoint(evmEndpoint);
    }

    public setNetwork(config: NetworkConfig): void {
        let evm = wsUrlFromConfigEVM(config);
        let avm = wsUrlFromConfigX(config);
        this.setEndpoints(avm, evm);
    }

    public trackWallet(wallet: WalletType): void {
        this.avmProvider.trackWallet(wallet);
        this.evmProvider.trackWallet(wallet);
    }

    public removeWallet(wallet: WalletType): void {
        this.avmProvider.removeWallet(wallet);
        this.evmProvider.removeWallet(wallet);
    }
}
