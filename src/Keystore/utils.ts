import { KeyFileKeyDecryptedV2, KeyFileKeyV2, KeyFileV2 } from '@/Keystore/types';
import { Buffer } from 'buffer';

export async function readV2(data: KeyFileV2, pass: string) {
    const version: string = data.version;
    cryptoHelpers.keygenIterations = ITERATIONS_V2;

    let salt: Buffer = bintools.cb58Decode(data.salt);
    let pass_hash: string = data.pass_hash;

    let checkHashString: string;
    let checkHash: Buffer = await cryptoHelpers._pwcleaner(pass, salt);
    checkHashString = bintools.cb58Encode(checkHash);

    if (checkHashString !== pass_hash) {
        throw 'INVALID_PASS';
    }

    let keys: KeyFileKeyV2[] = data.keys;
    let keysDecrypt: KeyFileKeyDecryptedV2[] = [];

    for (let i = 0; i < keys.length; i++) {
        let key_data: KeyFileKeyV2 = keys[i];

        let key: Buffer = bintools.cb58Decode(key_data.key);
        let nonce: Buffer = bintools.cb58Decode(key_data.iv);

        let key_decrypt: Buffer = await cryptoHelpers.decrypt(pass, key, salt, nonce);
        let key_string = bintools.cb58Encode(key_decrypt);

        keysDecrypt.push({
            key: key_string,
        });
    }

    return {
        version,
        activeIndex: 0,
        keys: keysDecrypt,
    };
}
