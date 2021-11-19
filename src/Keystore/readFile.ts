import {
    AllKeyFileDecryptedTypes,
    AllKeyFileTypes,
    IHash,
    KeyFileDecryptedV5,
    KeyFileDecryptedV6,
    KeyFileKeyDecryptedV2,
    KeyFileKeyDecryptedV3,
    KeyFileKeyDecryptedV4,
    KeyFileKeyDecryptedV5,
    KeyFileKeyDecryptedV6,
    KeyFileKeyV2,
    KeyFileKeyV3,
    KeyFileKeyV4,
    KeyFileKeyV5,
    KeyFileKeyV6,
    KeyFileV2,
    KeyFileV3,
    KeyFileV4,
    KeyFileV5,
    KeyFileV6,
    KeystoreFileKeyType,
} from '@/Keystore/types';
import { Buffer } from 'buffer/';
import { bintools } from '@/utils';
import { cryptoHelpers } from '@/Keystore/CryptoHelpers';
import { ITERATIONS_V2, ITERATIONS_V3 } from '@/Keystore/constants';

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

async function readV3(data: KeyFileV3, pass: string) {
    const version: string = data.version;
    cryptoHelpers.keygenIterations = ITERATIONS_V3;

    let salt: Buffer = bintools.cb58Decode(data.salt);
    let pass_hash: string = data.pass_hash;

    let checkHashString: string;
    let checkHash: IHash = await cryptoHelpers.pwhash(pass, salt);
    checkHashString = bintools.cb58Encode(checkHash.hash);

    if (checkHashString !== pass_hash) {
        throw 'INVALID_PASS';
    }

    let keys: KeyFileKeyV3[] = data.keys;
    let keysDecrypt: KeyFileKeyDecryptedV3[] = [];

    for (let i = 0; i < keys.length; i++) {
        let key_data: KeyFileKeyV3 = keys[i];

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
async function readV4(data: KeyFileV4, pass: string): Promise<KeyFileDecryptedV5> {
    const version = data.version;
    cryptoHelpers.keygenIterations = ITERATIONS_V3;

    let salt: Buffer = bintools.cb58Decode(data.salt);
    let pass_hash: string = data.pass_hash;

    let checkHashString: string;
    let checkHash: IHash = await cryptoHelpers.pwhash(pass, salt);
    checkHashString = bintools.cb58Encode(checkHash.hash);

    if (checkHashString !== pass_hash) {
        throw 'INVALID_PASS';
    }

    let keys: KeyFileKeyV4[] = data.keys;
    let keysDecrypt: KeyFileKeyDecryptedV4[] = [];

    for (let i = 0; i < keys.length; i++) {
        let key_data: KeyFileKeyV4 = keys[i];

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

async function readV5(data: KeyFileV5, pass: string): Promise<KeyFileDecryptedV5> {
    const version: string = data.version;
    cryptoHelpers.keygenIterations = ITERATIONS_V3;

    let salt: Buffer = bintools.cb58Decode(data.salt);
    let pass_hash = data.pass_hash;

    let checkHashString: string;
    let checkHash: IHash = await cryptoHelpers.pwhash(pass, salt);
    checkHashString = bintools.cb58Encode(checkHash.hash);

    if (checkHashString !== pass_hash) {
        throw 'INVALID_PASS';
    }

    let keys: KeyFileKeyV5[] = data.keys;
    let keysDecrypt: KeyFileKeyDecryptedV5[] = [];

    for (let i = 0; i < keys.length; i++) {
        let key_data: KeyFileKeyV5 = keys[i];

        let key: Buffer = bintools.cb58Decode(key_data.key);
        let nonce: Buffer = bintools.cb58Decode(key_data.iv);

        let key_decrypt: Buffer = await cryptoHelpers.decrypt(pass, key, salt, nonce);
        let key_string = key_decrypt.toString();

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

async function readV6(data: KeyFileV6, pass: string): Promise<KeyFileDecryptedV6> {
    const version: string = data.version;
    const activeIndex = data.activeIndex;
    cryptoHelpers.keygenIterations = ITERATIONS_V3;

    let salt: Buffer = bintools.cb58Decode(data.salt);

    let keys: KeyFileKeyV6[] = data.keys;
    let keysDecrypt: KeyFileKeyDecryptedV6[] = [];

    for (let i = 0; i < keys.length; i++) {
        let key_data: KeyFileKeyV6 = keys[i];

        let key: Buffer = bintools.cb58Decode(key_data.key);
        let type: KeystoreFileKeyType = key_data.type;
        let nonce: Buffer = bintools.cb58Decode(key_data.iv);

        let key_decrypt: Buffer;
        try {
            key_decrypt = await cryptoHelpers.decrypt(pass, key, salt, nonce);
        } catch (e) {
            throw 'INVALID_PASS';
        }

        const key_string = key_decrypt.toString();

        keysDecrypt.push({
            key: key_string,
            type: type,
        });
    }

    return {
        version,
        activeIndex: activeIndex || 0,
        keys: keysDecrypt,
    };
}

/**
 * Will decrypt and return the keys of the encrypted wallets in the given json file
 * @param data A JSON file of encrypted wallet keys
 * @param pass The password to decrypt the keys
 */
export async function readKeyFile(data: AllKeyFileTypes, pass: string): Promise<AllKeyFileDecryptedTypes> {
    switch (data.version) {
        case '6.0':
            return await readV6(data as KeyFileV6, pass);
        case '5.0':
            return await readV5(data as KeyFileV5, pass);
        case '4.0':
            return await readV4(data as KeyFileV4, pass);
        case '3.0':
            return await readV3(data as KeyFileV3, pass);
        case '2.0':
            return await readV2(data as KeyFileV2, pass);
        default:
            throw 'INVALID_VERSION';
    }
}
