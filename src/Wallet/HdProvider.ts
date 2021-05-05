import HDKey from 'hdkey';
import { Buffer } from 'avalanche';
import { getPreferredHRP } from 'avalanche/dist/utils';
import { avalanche, bintools } from '@/network';
import { KeyPair as AVMKeyPair } from 'avalanche/dist/apis/avm/keychain';

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
}
