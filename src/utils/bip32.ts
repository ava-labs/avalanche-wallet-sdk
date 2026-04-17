import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
// You must wrap a tiny-secp256k1 compatible implementation
const bip32 = BIP32Factory(ecc);
export default bip32;
