import HDKey from 'hdkey';
import { Buffer } from 'avalanche';
import { getPreferredHRP } from 'avalanche/dist/utils';
import { avalanche, bintools, pChain, xChain } from '../network';
import { KeyPair as AVMKeyPair } from 'avalanche/dist/apis/avm/keychain';
// import MnemonicWallet from './MnemonicWallet';
// import { INDEX_RANGE, SCAN_SIZE } from './constants';

export default class HdProvider {
    constructor() {}

    static deriveAddress(accountKey: HDKey, path: string, chainId = 'X') {
        let key = accountKey.derive(`m/${path}`) as HDKey;
        let publicKey = key.publicKey.toString('hex');
        let publicKeyBuff = Buffer.from(publicKey, 'hex');

        let hrp = getPreferredHRP(avalanche.getNetworkID());

        let keypair = new AVMKeyPair(hrp, chainId);
        let addrBuf = keypair.addressFromPublicKey(publicKeyBuff);
        let addr = bintools.addressToString(hrp, chainId, addrBuf);

        return addr;
    }

    // Scans the address space of this hd path and finds the last used index using the
    // explorer API.
    // static async findAvailableIndexExplorer(wallet: MnemonicWallet, startIndex = 0): Promise<number> {
    //     let upTo = 512;
    //
    //     let addrs = this.getAllDerivedAddresses(startIndex + upTo, startIndex);
    //     let addrChains = await getAddressChains(addrs);
    //
    //     let chainID;
    //     if (this.chainId === 'X') {
    //         chainID = xChain.getBlockchainID();
    //     } else {
    //         chainID = pChain.getBlockchainID();
    //     }
    //
    //     for (var i = 0; i < addrs.length - INDEX_RANGE; i++) {
    //         let gapSize: number = 0;
    //
    //         for (var n = 0; n < INDEX_RANGE; n++) {
    //             let scanIndex = i + n;
    //             let scanAddr = addrs[scanIndex];
    //
    //             let rawAddr = scanAddr.split('-')[1];
    //             let chains: string[] = addrChains[rawAddr];
    //
    //             if (!chains) {
    //                 // If doesnt exist on any chain
    //                 gapSize++;
    //             } else if (!chains.includes(chainID)) {
    //                 // If doesnt exist on this chain
    //                 gapSize++;
    //             } else {
    //                 i = i + n;
    //                 break;
    //             }
    //         }
    //
    //         // If the gap is reached return the index
    //         if (gapSize === INDEX_RANGE) {
    //             return startIndex + i;
    //         }
    //     }
    //
    //     return await this.findAvailableIndexExplorer(startIndex + (upTo - INDEX_RANGE));
    // }

    // Uses the node to find last used HD index
    // Only used when there is no explorer API available
    // static async findAvailableIndexNode(wallet: MnemonicWallet, start: number = 0): Promise<number> {
    //     let addrs: string[] = [];
    //
    //     // Get keys for indexes start to start+scan_size
    //     for (let i: number = start; i < start + SCAN_SIZE; i++) {
    //         let address = this.getAddressForIndex(i);
    //         addrs.push(address);
    //     }
    //
    //     let utxoSet;
    //
    //     if (this.chainId === 'X') {
    //         utxoSet = (await xChain.getUTXOs(addrs)).utxos;
    //     } else {
    //         utxoSet = (await pChain.getUTXOs(addrs)).utxos;
    //     }
    //
    //     // Scan UTXOs of these indexes and try to find a gap of INDEX_RANGE
    //     for (let i: number = 0; i < addrs.length - INDEX_RANGE; i++) {
    //         let gapSize: number = 0;
    //         // console.log(`Scan index: ${this.chainId} ${this.changePath}/${i+start}`);
    //         for (let n: number = 0; n < INDEX_RANGE; n++) {
    //             let scanIndex: number = i + n;
    //             let addr: string = addrs[scanIndex];
    //             let addrBuf = bintools.parseAddress(addr, this.chainId);
    //             let addrUTXOs: string[] = utxoSet.getUTXOIDs([addrBuf]);
    //             if (addrUTXOs.length === 0) {
    //                 gapSize++;
    //             } else {
    //                 // Potential improvement
    //                 i = i + n;
    //                 break;
    //             }
    //         }
    //
    //         // If we found a gap of 20, we can return the last fullIndex+1
    //         if (gapSize === INDEX_RANGE) {
    //             let targetIndex = start + i;
    //             return targetIndex;
    //         }
    //     }
    //     return await this.findAvailableIndexNode(start + SCAN_RANGE);
    // }
}
