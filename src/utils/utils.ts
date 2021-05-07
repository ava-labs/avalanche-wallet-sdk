// Extending Big.js with a helper function
import Big from 'big.js';
import { BN } from 'avalanche';
const axios = require('axios');

export function bnToBig(val: BN, denomination = 0): Big {
    return new Big(val.toString()).div(Math.pow(10, denomination));
}

export function bnToAvaxC(val: BN) {
    return bnToLocaleString(val, 18);
}

export function bnToAvaxX(val: BN) {
    return bnToLocaleString(val, 9);
}

export function bnToAvaxP(val: BN) {
    return bnToAvaxX(val);
}

export function numberToBN(val: number | string, decimals: number): BN {
    let valBig = Big(val);
    let tens = Big(10).pow(decimals);
    let valBN = new BN(valBig.times(tens).toString());
    return valBN;
}

export function bnToLocaleString(val: BN, toFixed = 9) {
    let bigVal = bnToBig(val, toFixed);

    let fixedStr = bigVal.toFixed(toFixed);
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
}

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd';
export async function getAvaxPrice(): Promise<number> {
    const res = await axios.get(COINGECKO_URL);
    return res.data['avalanche-2'].usd;
}
