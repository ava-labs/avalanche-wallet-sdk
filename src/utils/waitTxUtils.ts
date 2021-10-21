import {
    AvmStatusResponseType,
    AvmStatusType,
    ChainStatusResponseTypeC,
    ChainStatusTypeC,
    PlatformStatusResponseType,
    PlatformStatusType,
} from '@/utils/types';
import { cChain, pChain, web3, xChain } from '@/Network/network';

/**
 * Waits until the given tx id is accepted on X chain
 * @param txId Tx ID to wait for
 * @param tryCount Number of attempts until timeout
 */
export async function waitTxX(txId: string, tryCount = 10): Promise<string> {
    if (tryCount <= 0) {
        throw new Error('Timeout');
    }
    let resp: AvmStatusResponseType;

    try {
        resp = (await xChain.getTxStatus(txId)) as AvmStatusResponseType;
    } catch (e) {
        throw new Error('Unable to get transaction status.');
    }

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
    let resp: PlatformStatusResponseType;

    try {
        resp = (await pChain.getTxStatus(txId)) as PlatformStatusResponseType;
    } catch (e) {
        throw new Error('Unable to get transaction status.');
    }

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

    let receipt;

    try {
        receipt = await web3.eth.getTransactionReceipt(txHash);
    } catch (e) {
        throw new Error('Unable to get transaction receipt.');
    }

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

export async function waitTxC(txId: string, tryCount = 10): Promise<string> {
    if (tryCount <= 0) {
        throw new Error('Timeout');
    }

    let resp: ChainStatusResponseTypeC;
    try {
        resp = (await cChain.getAtomicTxStatus(txId)) as ChainStatusResponseTypeC;
    } catch (e) {
        throw new Error('Unable to get transaction status.');
    }

    let status: ChainStatusTypeC;
    let reason;
    if (typeof resp === 'string') {
        status = resp as ChainStatusTypeC;
    } else {
        status = resp.status as ChainStatusTypeC;
        reason = resp.reason;
    }

    if (status === 'Unknown' || status === 'Processing') {
        return await new Promise((resolve) => {
            setTimeout(async () => {
                resolve(await waitTxC(txId, tryCount - 1));
            }, 1000);
        });
        // return await waitTxX(txId, tryCount - 1);
    } else if (status === 'Dropped') {
        throw new Error(reason);
    } else if (status === 'Accepted') {
        return txId;
    } else {
        throw new Error('Unknown status type.');
    }
}
