import MnemonicWallet from '@/Wallet/MnemonicWallet';
import SingletonWallet from '@/Wallet/SingletonWallet';
import { KeyFileKeyV6, KeyFileV6, KeystoreFileKeyType, PKCrypt } from '@/Keystore/types';
import { cryptoHelpers } from '@/Keystore/CryptoHelpers';
import { Buffer } from 'buffer/';
import { bintools } from '@/utils';
import { ITERATIONS_V3, KEYSTORE_VERSION } from '@/Keystore/constants';

/**
 * Given an array of wallets, the active index, and a password, return an encrypted JSON object that is the keystore file
 * @param wallets An array of wallet to encrypt
 * @param pass Password used in encryption
 * @param activeIndex Index of the active wallet in the `wallets` array
 * @return Returns a JSON object that can later be decrypted with `readKeyfile` and the given password
 */
export async function makeKeyfile(
    wallets: (MnemonicWallet | SingletonWallet)[],
    pass: string,
    activeIndex: number
): Promise<KeyFileV6> {
    // 3.0 and above uses 200,000
    cryptoHelpers.keygenIterations = ITERATIONS_V3;

    let salt: Buffer = await cryptoHelpers.makeSalt();

    let keys: KeyFileKeyV6[] = [];

    for (let i = 0; i < wallets.length; i++) {
        let wallet = wallets[i];
        let key;
        let type: KeystoreFileKeyType;
        if (wallet.type === 'singleton') {
            key = (wallet as SingletonWallet).key;
            type = 'singleton';
        } else {
            key = (wallet as MnemonicWallet).mnemonic;
            type = 'mnemonic';
        }
        let pk_crypt: PKCrypt = await cryptoHelpers.encrypt(pass, key, salt);

        let key_data: KeyFileKeyV6 = {
            key: bintools.cb58Encode(pk_crypt.ciphertext),
            iv: bintools.cb58Encode(pk_crypt.iv),
            type: type,
        };
        keys.push(key_data);
    }

    let file_data: KeyFileV6 = {
        version: KEYSTORE_VERSION,
        salt: bintools.cb58Encode(salt),
        activeIndex,
        keys: keys,
    };
    return file_data;
}
