import { WalletProvider } from '@/Wallet/Wallet';
import { HdScanner } from '@/Wallet/HdScanner';
import { UTXOSet as AVMUTXOSet } from 'avalanche/dist/apis/avm/utxos';
import { avalanche } from '@/Network/network';
import { UTXOSet as PlatformUTXOSet } from 'avalanche/dist/apis/platformvm';
import { iHDWalletIndex } from '@/Wallet/types';
import { bintools } from '@/common';
import * as bip32 from 'bip32';
import { NetworkConfig } from '@/Network';

export abstract class HDWalletAbstract extends WalletProvider {
    protected internalScan: HdScanner;
    protected externalScan: HdScanner;
    protected accountKey: bip32.BIP32Interface;
    public isHdReady = false;

    /**
     *
     * @param accountKey The bip32 HD node for path `m/44'/9000'/n'` where n is the desired account index.
     * @protected
     */
    protected constructor(accountKey: bip32.BIP32Interface) {
        super();

        this.internalScan = new HdScanner(accountKey, true);
        this.externalScan = new HdScanner(accountKey, false);
        this.accountKey = accountKey;
    }

    protected onNetworkChange(config: NetworkConfig) {
        super.onNetworkChange(config);

        this.isHdReady = false;
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
    public async getExternalAddressesX(): Promise<string[]> {
        return await this.externalScan.getAllAddresses('X');
    }

    /**
     * Returns every external X chain address used by the wallet up to now.
     */
    public getExternalAddressesXSync(): string[] {
        return this.externalScan.getAllAddressesSync('X');
    }

    /**
     * Returns every internal X chain address used by the wallet up to now.
     */
    public async getInternalAddressesX(): Promise<string[]> {
        return await this.internalScan.getAllAddresses('X');
    }

    /**
     * Returns every internal X chain address used by the wallet up to now.
     */
    public getInternalAddressesXSync(): string[] {
        return this.internalScan.getAllAddressesSync('X');
    }

    /**
     * Returns every X chain address used by the wallet up to now (internal + external).
     */
    public async getAllAddressesX(): Promise<string[]> {
        return [...(await this.getExternalAddressesX()), ...(await this.getInternalAddressesX())];
    }

    /**
     * Returns every X chain address used by the wallet up to now (internal + external).
     */
    public getAllAddressesXSync(): string[] {
        return [...this.getExternalAddressesXSync(), ...this.getInternalAddressesXSync()];
    }

    public async getExternalAddressesP(): Promise<string[]> {
        return this.externalScan.getAllAddresses('P');
    }

    public getExternalAddressesPSync(): string[] {
        return this.externalScan.getAllAddressesSync('P');
    }

    /**
     * Returns every P chain address used by the wallet up to now.
     */
    public getAllAddressesP(): Promise<string[]> {
        return this.getExternalAddressesP();
    }

    /**
     * Returns every P chain address used by the wallet up to now.
     */
    public getAllAddressesPSync(): string[] {
        return this.getExternalAddressesPSync();
    }

    /**
     * Scans the network and initializes internal and external addresses on P and X chains.
     * - Heavy operation
     * - MUST use the explorer api to find the last used address
     * - If explorer is not available it will use the connected node. This may result in invalid balances.
     */
    public async resetHdIndices(externalStart = 0, internalStart = 0): Promise<iHDWalletIndex> {
        let promiseExt = this.externalScan.resetIndex(externalStart);
        let promiseInt = this.internalScan.resetIndex(internalStart);

        const [indexExt, indexInt] = await Promise.all([promiseExt, promiseInt]);

        this.emitAddressChange();
        this.isHdReady = true;
        this.emitHdReady();

        return {
            internal: indexInt,
            external: indexExt,
        };
    }

    public setHdIndices(external: number, internal: number) {
        this.externalScan.setIndex(external);
        this.internalScan.setIndex(internal);

        this.emitAddressChange();
        this.isHdReady = true;
        this.emitHdReady();
    }

    /**
     * Emits an event to indicate the wallet has finishing calculating its last use address
     * @protected
     */
    protected emitHdReady(): void {
        this.emit('hd_ready', {
            external: this.getExternalIndex(),
            internal: this.getInternalIndex(),
        });
    }

    public async updateUtxosX(): Promise<AVMUTXOSet> {
        let utxosX = await super.updateUtxosX();

        // If the current internal or external X address is in the utxo set, increment hd index
        let utxoAddrs = utxosX.getAddresses();
        let utxoAddrsStr = utxoAddrs.map((addr) => {
            return bintools.addressToString(avalanche.getHRP(), 'X', addr);
        });

        let addrExternalX = this.getAddressX();
        let addrInternalX = this.getChangeAddressX();

        let isAddrChange = false;
        // Increment external index if the current address is in the utxo set
        if (utxoAddrsStr.includes(addrExternalX)) {
            this.incrementExternal();
            isAddrChange = true;
        }

        // Increment internal index if the current address is in the utxo set
        if (utxoAddrsStr.includes(addrInternalX)) {
            this.incrementInternal();
            isAddrChange = true;
        }

        if (isAddrChange) this.emitAddressChange();

        return utxosX;
    }

    private incrementExternal() {
        this.externalScan.increment();
    }

    private incrementInternal() {
        this.internalScan.increment();
    }

    public async updateUtxosP(): Promise<PlatformUTXOSet> {
        let utxosP = await super.updateUtxosP();

        // If the current P address is in the utxo set, increment hd index
        let utxoAddrs = utxosP.getAddresses();
        let utxoAddrsStr = utxoAddrs.map((addr) => {
            return bintools.addressToString(avalanche.getHRP(), 'P', addr);
        });

        let addrExternalP = this.getAddressP();

        // Increment external index if the current address is in the utxo set
        if (utxoAddrsStr.includes(addrExternalP)) {
            this.incrementExternal();
            this.emitAddressChange();
        }

        return utxosP;
    }

    public getAddressAtIndexExternalX(index: number): string {
        if (index < 0) throw new Error('Index must be >= 0');
        return this.externalScan.getKeyForIndexX(index).getAddressString();
    }

    public getAddressAtIndexInternalX(index: number): string {
        if (index < 0) throw new Error('Index must be >= 0');
        return this.internalScan.getKeyForIndexX(index).getAddressString();
    }

    public getAddressAtIndexExternalP(index: number): string {
        if (index < 0) throw new Error('Index must be >= 0');
        return this.externalScan.getKeyForIndexP(index).getAddressString();
    }
}
