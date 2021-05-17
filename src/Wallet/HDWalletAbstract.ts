import { WalletProvider } from '@/Wallet/Wallet';
import HdScanner from '@/Wallet/HdScanner';
import HDKey from 'hdkey';
import { UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm/utxos';
import { avalanche, bintools } from '@/Network/network';
import { UTXOSet as PlatformUTXOSet } from 'avalanche/dist/apis/platformvm';

export abstract class HDWalletAbstract extends WalletProvider {
    protected internalScan: HdScanner;
    protected externalScan: HdScanner;
    protected accountKey: HDKey;

    constructor(accountKey: HDKey) {
        super();

        this.internalScan = new HdScanner(accountKey, true);
        this.externalScan = new HdScanner(accountKey, false);
        this.accountKey = accountKey;
    }

    /**
     * Returns current index used for external address derivation.
     */
    public getExternalIndex(): number {
        return this.externalScan.getIndex();
    }

    /**
     * Returns current index used for internal address derivation.
     */
    public getInternalIndex(): number {
        return this.internalScan.getIndex();
    }

    /**
     * Gets the active external address on the X chain
     * - The X address will change after every deposit.
     */
    public getAddressX(): string {
        return this.externalScan.getAddressX();
    }

    /**
     * Gets the active change address on the X chain
     * - The change address will change after every transaction on the X chain.
     */
    public getChangeAddressX() {
        return this.internalScan.getAddressX();
    }

    /**
     * Gets the active address on the P chain
     */
    public getAddressP(): string {
        return this.externalScan.getAddressP();
    }

    /**
     * Returns every external X chain address used by the wallet up to now.
     */
    public getExternalAddressesX(): string[] {
        return this.externalScan.getAllAddresses('X');
    }

    /**
     * Returns every internal X chain address used by the wallet up to now.
     */
    public getInternalAddressesX(): string[] {
        return this.internalScan.getAllAddresses('X');
    }

    /**
     * Returns every X chain address used by the wallet up to now (internal + external).
     */
    public getAllAddressesX(): string[] {
        return [...this.getExternalAddressesX(), ...this.getInternalAddressesX()];
    }

    public getExternalAddressesP(): string[] {
        return this.externalScan.getAllAddresses('P');
    }

    /**
     * Returns every P chain address used by the wallet up to now.
     */
    public getAllAddressesP(): string[] {
        return this.getExternalAddressesP();
    }

    /**
     * Scans the network and initializes internal and external addresses on P and X chains.
     * - Heavy operation
     * - MUST use the explorer api to find the last used address
     * - If explorer is not available it will use the connected node. This may result in invalid balances.
     */
    public async resetHdIndices() {
        await this.externalScan.resetIndex();
        await this.internalScan.resetIndex();
    }

    public async getUtxosX(): Promise<AVMUTXOSet> {
        let utxosX = await super.getUtxosX();

        // If the current internal or external X address is in the utxo set, increment hd index
        let utxoAddrs = utxosX.getAddresses();
        let utxoAddrsStr = utxoAddrs.map((addr) => {
            return bintools.addressToString(avalanche.getHRP(), 'X', addr);
        });

        let addrExternalX = this.getAddressX();
        let addrInternalX = this.getChangeAddressX();

        // console.log(utxoAddrsStr)

        // Increment external index if the current address is in the utxo set
        if (utxoAddrsStr.includes(addrExternalX)) {
            this.externalScan.increment();
        }

        // Increment internal index if the current address is in the utxo set
        if (utxoAddrsStr.includes(addrInternalX)) {
            this.internalScan.increment();
        }

        return utxosX;
    }

    public async getUtxosP(): Promise<PlatformUTXOSet> {
        let utxosP = await super.getUtxosP();

        // If the current internal or external X address is in the utxo set, increment hd index
        let utxoAddrs = utxosP.getAddresses();
        let utxoAddrsStr = utxoAddrs.map((addr) => {
            return bintools.addressToString(avalanche.getHRP(), 'P', addr);
        });

        let addrExternalP = this.getAddressP();

        // console.log(utxoAddrsStr)

        // Increment external index if the current address is in the utxo set
        if (utxoAddrsStr.includes(addrExternalP)) {
            this.externalScan.increment();
        }

        return utxosP;
    }
}
