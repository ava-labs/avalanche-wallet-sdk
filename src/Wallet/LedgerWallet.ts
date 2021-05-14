import { WalletProvider } from '@/Wallet/Wallet';

// @ts-ignore
import TransportU2F from '@ledgerhq/hw-transport-u2f';
// @ts-ignore
import Eth from '@ledgerhq/hw-app-eth';
// @ts-ignore
import AppAvax from '@obsidiansystems/hw-app-avalanche';

export default class LedgerWallet extends WalletProvider {
    fromU2F() {}
}
