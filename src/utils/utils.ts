// Extending Big.js with a helper function
import Big from 'big.js';
import { BN } from 'avalanche';
const axios = require('axios');

/**
 * @param val the amount to parse
 * @param denomination number of decimal places to parse with
 */
export function bnToBig(val: BN, denomination = 0): Big {
    return new Big(val.toString()).div(Math.pow(10, denomination));
}

/**
 * Parses the value using a denomination of 18
 *
 * @param val the amount to parse given in WEI
 *
 * @example
 * ```
 * bnToAvaxC(new BN('22500000000000000000')
 * // will return  22.5
 *```
 *
 */
export function bnToAvaxC(val: BN) {
    return bnToLocaleString(val, 18);
}

/**
 * Parses the value using a denomination of 9
 *
 * @param val the amount to parse given in nAVAX
 */
export function bnToAvaxX(val: BN) {
    return bnToLocaleString(val, 9);
}

/**
 * Parses the value using a denomination of 9
 *
 * @param val the amount to parse given in nAVAX
 */
export function bnToAvaxP(val: BN) {
    return bnToAvaxX(val);
}

/**
 *
 * @param val the number to parse
 * @param decimals number of decimal places used to parse the number
 */
export function numberToBN(val: number | string, decimals: number): BN {
    let valBig = Big(val);
    let tens = Big(10).pow(decimals);
    let valBN = new BN(valBig.times(tens).toString());
    return valBN;
}

/**
 * @Remarks
 * A helper method to convert BN numbers to human readable strings.
 *
 * @param val The amount to convert
 * @param decimals Number of decimal places to parse the amount with
 *
 * @example
 * ```
 * bnToLocaleString(new BN(100095),2)
 * // will return '1,000.95'
 * ```
 */
export function bnToLocaleString(val: BN, decimals = 9) {
    let bigVal = bnToBig(val, decimals);

    let fixedStr = bigVal.toFixed(decimals);
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

        let trimmed = remainderStr.substring(0, decimals);
        if (!trimmed) return wholeStr;
        return `${wholeStr}.${trimmed}`;
    }
}

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd';

/**
 * Fetches the current AVAX price using Coin Gecko.
 * @remarks
 * You might get rate limited if you use this function frequently.
 *
 * @return
 * Current USD price of 1 AVAX
 */
export async function getAvaxPrice(): Promise<number> {
    const res = await axios.get(COINGECKO_URL);
    return res.data['avalanche-2'].usd;
}
