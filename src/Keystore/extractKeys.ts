import {
    AccessWalletMultipleInput,
    AllKeyFileDecryptedTypes,
    KeyFileDecryptedV2,
    KeyFileDecryptedV3,
    KeyFileDecryptedV4,
    KeyFileDecryptedV5,
    KeyFileDecryptedV6,
} from '@/Keystore/types';
import { xChain } from '@/Network/network';
import * as bip39 from 'bip39';

function extractKeysV2(
    file: KeyFileDecryptedV2 | KeyFileDecryptedV3 | KeyFileDecryptedV4
): AccessWalletMultipleInput[] {
    let chainID = xChain.getBlockchainAlias();
    let keys = (file as KeyFileDecryptedV2 | KeyFileDecryptedV3 | KeyFileDecryptedV4).keys;

    return keys.map((key) => {
        // Private keys from the keystore file do not have the PrivateKey- prefix
        let pk = 'PrivateKey-' + key.key;
        // let keypair = keyToKeypair(pk, chainID)
        let keypair = xChain.newKeyChain().importKey(pk);

        let keyBuf = keypair.getPrivateKey();
        let keyHex: string = keyBuf.toString('hex');
        let paddedKeyHex = keyHex.padStart(64, '0');
        let mnemonic: string = bip39.entropyToMnemonic(paddedKeyHex);

        return {
            key: mnemonic,
            type: 'mnemonic',
        };
    });
}

function extractKeysV5(file: KeyFileDecryptedV5): AccessWalletMultipleInput[] {
    return file.keys.map((key) => ({
        key: key.key,
        type: 'mnemonic',
    }));
}

function extractKeysV6(file: KeyFileDecryptedV6): AccessWalletMultipleInput[] {
    return file.keys.map((key) => ({
        type: key.type,
        key: key.key,
    }));
}

export function extractKeysFromDecryptedFile(file: AllKeyFileDecryptedTypes): AccessWalletMultipleInput[] {
    switch (file.version) {
        case '6.0':
            return extractKeysV6(file as KeyFileDecryptedV6);
        case '5.0':
            return extractKeysV5(file as KeyFileDecryptedV5);
        case '4.0':
            return extractKeysV2(file as KeyFileDecryptedV4);
        case '3.0':
            return extractKeysV2(file as KeyFileDecryptedV3);
        case '2.0':
            return extractKeysV2(file as KeyFileDecryptedV2);
        default:
            throw 'INVALID_VERSION';
    }
}
