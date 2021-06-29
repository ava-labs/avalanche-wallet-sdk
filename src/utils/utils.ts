// Extending Big.js with a helper function
import Big from 'big.js';
import { BN, Buffer as BufferAvalanche } from 'avalanche';
import { validateAddress } from '@/helpers/address_helper';
import createHash from 'create-hash';
import axios from 'axios';
import { pChain, web3, xChain } from '@/Network/network';
import { AvmStatusResponseType, AvmStatusType, PlatformStatusResponseType, PlatformStatusType } from '@/utils/types';
import { PayloadBase, PayloadTypes } from 'avalanche/dist/utils';

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

/**
 * @param val the amount to parse
 * @param denomination number of decimal places to parse with
 */
export function bnToBig(val: BN, denomination = 0): Big {
    return new Big(val.toString()).div(Math.pow(10, denomination));
}

/**
 * Converts a BN amount of 18 decimals to 9.
 * Used for AVAX C <-> X,P conversions
 * @param amount
 */
export function avaxCtoX(amount: BN) {
    let tens = new BN(10).pow(new BN(9));
    return amount.div(tens);
}

export function bnToBigAvaxX(val: BN): Big {
    return bnToBig(val, 9);
}

export function bnToBigAvaxP(val: BN): Big {
    return bnToBigAvaxX(val);
}

export function bnToBigAvaxC(val: BN): Big {
    return bnToBig(val, 18);
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
export function bnToAvaxC(val: BN): string {
    return bnToLocaleString(val, 18);
}

/**
 * Parses the value using a denomination of 9
 *
 * @param val the amount to parse given in nAVAX
 */
export function bnToAvaxX(val: BN): string {
    return bnToLocaleString(val, 9);
}

/**
 * Parses the value using a denomination of 9
 *
 * @param val the amount to parse given in nAVAX
 */
export function bnToAvaxP(val: BN): string {
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

export function numberToBNAvaxX(val: number | string) {
    return numberToBN(val, 9);
}

export function numberToBNAvaxP(val: number | string) {
    return numberToBNAvaxX(val);
}

export function numberToBNAvaxC(val: number | string) {
    return numberToBN(val, 18);
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
export function bnToLocaleString(val: BN, decimals = 9): string {
    let bigVal = bnToBig(val, decimals);
    return bigToLocaleString(bigVal, decimals);
}

export function bigToLocaleString(bigVal: Big, decimals: number = 9): string {
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

/**
 * Checks if address is valid.
 *
 * @return
 * boolean if address is valid, error message if not valid.
 */
export function isValidAddress(address: string): boolean {
    return validateAddress(address) === true;
}

export function digestMessage(msgStr: string): Buffer {
    let mBuf = Buffer.from(msgStr, 'utf8');
    let msgSize = Buffer.alloc(4);
    msgSize.writeUInt32BE(mBuf.length, 0);
    let msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, 'utf8');
    return createHash('sha256').update(msgBuf).digest();
}

export async function waitTxX(txId: string, tryCount = 10): Promise<string> {
    if (tryCount <= 0) {
        throw new Error('Timeout');
    }
    let resp: AvmStatusResponseType = (await xChain.getTxStatus(txId)) as AvmStatusResponseType;

    let status: AvmStatusType;
    let reason;
    if (typeof resp === 'string') {
        status = resp as AvmStatusType;
    } else {
        status = resp.status as AvmStatusType;
        reason = resp.reason;
    }

    if (status === 'Unknown' || status === 'Processing') {
        return await new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await waitTxX(txId, tryCount - 1));
            }, 1000);
        });
        // return await waitTxX(txId, tryCount - 1);
    } else if (status === 'Rejected') {
        throw new Error(reason);
    } else if (status === 'Accepted') {
        return txId;
    }

    return txId;
}

export async function waitTxP(txId: string, tryCount = 10): Promise<string> {
    if (tryCount <= 0) {
        throw new Error('Timeout');
    }
    let resp: PlatformStatusResponseType = (await pChain.getTxStatus(txId)) as PlatformStatusResponseType;

    let status: PlatformStatusType;
    let reason;
    if (typeof resp === 'string') {
        status = resp as PlatformStatusType;
    } else {
        status = resp.status as PlatformStatusType;
        reason = resp.reason;
    }

    if (status === 'Unknown' || status === 'Processing') {
        return await new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await waitTxP(txId, tryCount - 1));
            }, 1000);
        });
        // return await waitTxX(txId, tryCount - 1);
    } else if (status === 'Dropped') {
        throw new Error(reason);
    } else if (status === 'Committed') {
        return txId;
    } else {
        throw new Error('Unknown status type.');
    }
}

export async function waitTxEvm(txHash: string, tryCount = 10): Promise<string> {
    if (tryCount <= 0) {
        throw new Error('Timeout');
    }

    let receipt = await web3.eth.getTransactionReceipt(txHash);

    if (!receipt) {
        return await new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await waitTxEvm(txHash, tryCount - 1));
            }, 1000);
        });
    } else {
        if (receipt.status) {
            return txHash;
        } else {
            throw new Error('Transaction reverted.');
        }
    }
}

//TODO: There is no getTxStatus on C chain. Switch the current setup once that is ready
export async function waitTxC(cAddress: string, nonce?: number, tryCount = 10): Promise<string> {
    if (tryCount <= 0) {
        throw new Error('Timeout');
    }

    let nonceNow = await web3.eth.getTransactionCount(cAddress);

    if (typeof nonce === 'undefined') {
        nonce = nonceNow;
    }

    if (nonce === nonceNow) {
        return await new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await waitTxC(cAddress, nonce, tryCount - 1));
            }, 1000);
        });
    } else {
        return 'success';
    }
}

let payloadtypes = PayloadTypes.getInstance();

export function parseNftPayload(rawPayload: string): PayloadBase {
    let payload = BufferAvalanche.from(rawPayload, 'base64');
    payload = BufferAvalanche.concat([new BufferAvalanche(4).fill(payload.length), payload]);

    let typeId = payloadtypes.getTypeID(payload);
    let pl: BufferAvalanche = payloadtypes.getContent(payload);
    let payloadbase: PayloadBase = payloadtypes.select(typeId, pl);

    return payloadbase;
}
