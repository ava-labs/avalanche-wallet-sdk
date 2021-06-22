export * as Network from '@/Network/index';
export * as Assets from '@/Asset/index';
export * as Common from './common';

import MnemonicWallet from '@/Wallet/MnemonicWallet';
import SingletonWallet from '@/Wallet/SingletonWallet';
import LedgerWallet from '@/Wallet/LedgerWallet';
import * as NetworkConstants from '@/Network/constants';
import * as Utils from '@/utils/utils';
import Keystore from '@/Keystore/keystore';
import { BN } from 'avalanche';
import Big from 'big.js';

declare module 'big.js' {
    interface Big {
        toLocaleString(toFixed?: number): string;
    }
}

Big.prototype.toLocaleString = function (toFixed: number = 9) {
    let fixedStr = this.toFixed(toFixed);
    let split = fixedStr.split('.');
    let wholeStr = parseInt(split[0]).toLocaleString('en-US');

    if (split.length === 1) {
        return wholeStr;
    } else {
        let remainderStr = split[1];

        // remove trailing 0s
        let lastChar = remainderStr.charAt(remainderStr.length - 1);
        while (lastChar === '0') {
            remainderStr = remainderStr.substring(0, remainderStr.length - 1);
            lastChar = remainderStr.charAt(remainderStr.length - 1);
        }

        let trimmed = remainderStr.substring(0, toFixed);
        if (!trimmed) return wholeStr;
        return `${wholeStr}.${trimmed}`;
    }
};

export { MnemonicWallet, SingletonWallet, NetworkConstants, Utils, BN, Keystore, LedgerWallet, Big };
