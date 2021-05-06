import HDKey from 'hdkey';
import { getPreferredHRP } from 'avalanche/dist/utils';
import { avalanche, bintools, pChain, xChain } from '../network';
import { KeyPair as AVMKeyPair } from 'avalanche/dist/apis/avm/keychain';
import { HdChainType } from './types';
import { Buffer } from 'avalanche'
import { INDEX_RANGE, SCAN_RANGE, SCAN_SIZE } from './constants';
import { getAddressChains } from '../Explorer/Explorer';


type AddressCache = {
    [index:string]: HDKey
}

// Each HD wallet has 2 HdScaners, one for internal chain, one for external
export default class HdScanner {
    protected index = 0;
    protected addressCache: AddressCache = {}
    readonly changePath: string;
    readonly accountKey: HDKey;

    constructor(accountKey: HDKey, isInternal = true) {
        this.changePath = isInternal ? '1' : '0'
        this.accountKey = accountKey
    }

    getIndex(){
        return this.index
    }

    public getAddressX(){
        return this.getAddressForIndex(this.index, 'X')
    }

    // public getAddressAtX(index: number){
    //     return this.getAddressForIndex(index, 'X')
    // }

    public getAddressP(){
        return this.getAddressForIndex(this.index, 'P')
    }

    public getAllAddresses(chainId: HdChainType = 'X'): string[]{
        let upTo = this.index;
        let addrs = []
        for (var i = 0; i <= upTo; i++) {
            addrs.push(this.getAddressForIndex(i, chainId));
        }
        return addrs
    }

    getAddressesInRange(start: number, end: number){
        let res = []
        for(let i = start; i<end;i++){
            res.push(this.getAddressForIndex(i))
        }
        return res
    }

    private getAddressForIndex(index: number, chainId: HdChainType = 'X'): string {

        let key: HDKey;
        if (this.addressCache[index]) {
            key = this.addressCache[index]
        }else{
            key = this.accountKey.derive(`m/${this.changePath}/${index}`) as HDKey;
            this.addressCache[index] = key
        }

        let publicKey = key.publicKey.toString('hex');
        let publicKeyBuff = Buffer.from(publicKey, 'hex');

        let hrp = getPreferredHRP(avalanche.getNetworkID());

        let keypair = new AVMKeyPair(hrp, chainId);
        let addrBuf = keypair.addressFromPublicKey(publicKeyBuff);
        let addr = bintools.addressToString(hrp, chainId, addrBuf);

        return addr
    }


    // Uses the explorer to scan used addresses and find its starting index
    public async resetIndex(){
        this.index = await this.findAvailableIndexExplorer()
    }


    // Scans the address space of this hd path and finds the last used index using the
    // explorer API.
    private async findAvailableIndexExplorer(startIndex = 0): Promise<number> {
        let upTo = 512;

        let addrs = this.getAddressesInRange(startIndex, startIndex + upTo);
        let addrChains = await getAddressChains(addrs);

        for (var i = 0; i < addrs.length - INDEX_RANGE; i++) {
            let gapSize: number = 0;

            for (var n = 0; n < INDEX_RANGE; n++) {
                let scanIndex = i + n;
                let scanAddr = addrs[scanIndex];

                let rawAddr = scanAddr.split('-')[1];
                let chains: string[] = addrChains[rawAddr];

                if (!chains) {
                    // If doesnt exist on any chain
                    gapSize++;
                } else {
                    i = i + n;
                    break;
                }
            }

            // If the gap is reached return the index
            if (gapSize === INDEX_RANGE) {
                return startIndex + i;
            }
        }

        return await this.findAvailableIndexExplorer(startIndex + (upTo - INDEX_RANGE));
    }

    // Uses the node to find last used HD index
    // Only used when there is no explorer API available
    private async findAvailableIndexNode(start: number = 0): Promise<number> {
        let addrsX: string[] = [];
        let addrsP: string[] = [];

        // Get keys for indexes start to start+scan_size
        for (let i: number = start; i < start + SCAN_SIZE; i++) {
            let addressX = this.getAddressForIndex(i, 'X');
            let addressP = this.getAddressForIndex(i, 'P');
            addrsX.push(addressX);
            addrsP.push(addressP);
        }


        let utxoSetX = (await xChain.getUTXOs(addrsX)).utxos;
        let utxoSetP = (await pChain.getUTXOs(addrsP)).utxos;

        // Scan UTXOs of these indexes and try to find a gap of INDEX_RANGE
        for (let i: number = 0; i < addrsX.length - INDEX_RANGE; i++) {
            let gapSize: number = 0;
            // console.log(`Scan index: ${this.chainId} ${this.changePath}/${i+start}`);
            for (let n: number = 0; n < INDEX_RANGE; n++) {
                let scanIndex: number = i + n;
                let addr: string = addrsX[scanIndex];
                let addrBuf = bintools.parseAddress(addr, 'X');
                let addrUTXOsX: string[] = utxoSetX.getUTXOIDs([addrBuf]);
                let addrUTXOsP: string[] = utxoSetP.getUTXOIDs([addrBuf]);
                if (addrUTXOsX.length === 0 && addrUTXOsP.length === 0) {
                    gapSize++;
                } else {
                    // Potential improvement
                    i = i + n;
                    break;
                }
            }

            // If we found a gap of 20, we can return the last fullIndex+1
            if (gapSize === INDEX_RANGE) {
                let targetIndex = start + i;
                return targetIndex;
            }
        }
        return await this.findAvailableIndexNode(start + SCAN_RANGE);
    }
}
