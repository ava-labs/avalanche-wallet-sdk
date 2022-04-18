import { explorer_api } from '@/Network/network';
import { NO_EXPLORER_API } from '@/errors';
import { OrteliusAvalancheTx, OrteliusEvmTx } from '@/Explorer';

/**
 * Returns transactions FROM and TO the address given
 * @param addr The address to get historic transactions for.
 */
export async function getAddressHistoryEVM(addr: string): Promise<OrteliusEvmTx[]> {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    let endpoint = `v2/ctransactions?address=${addr}`;
    let data = (await explorer_api.get<{ Transactions: OrteliusEvmTx[] }>(endpoint)).Transactions;

    data.sort((a, b) => {
        let dateA = new Date(a.createdAt);
        let dateB = new Date(b.createdAt);

        return dateB.getTime() - dateA.getTime();
    });

    return data;
}

/**
 * Returns the ortelius data from the given tx id.
 * @param txID
 */
export async function getTx(txID: string): Promise<OrteliusAvalancheTx> {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    let url = `v2/transactions/${txID}`;
    return await explorer_api.get<OrteliusAvalancheTx>(url);
}

/**
 * Returns ortelius data for a transaction hash on C chain EVM,
 * @param txHash
 */
export async function getTxEvm(txHash: string): Promise<OrteliusEvmTx> {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    let endpoint = `v2/ctransactions?hash=${txHash}`;
    let data = (await explorer_api.get<{ Transactions: OrteliusEvmTx[] }>(endpoint)).Transactions[0];

    return data;
}

/**
 * Returns, X or P chain transactions belonging to the given address array.
 * @param addresses Addresses to check for. Max number of addresses is 1024
 * @param limit
 * @param chainID The blockchain ID of X or P chain
 * @param endTime
 */
async function getTransactionsAvalanche(
    addresses: string[],
    limit = 20,
    chainID: string,
    endTime?: string
): Promise<OrteliusAvalancheTx[]> {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    if (addresses.length > 1024) throw new Error('Number of addresses can not exceed 1024.');

    // Remove the prefix (X- P-) from given addresses
    const addrsRaw = addresses.map((addr) => {
        return addr.split('-')[1];
    });

    const rootUrl = 'v2/transactions';

    const req = {
        address: addrsRaw,
        sort: ['timestamp-desc'],
        disableCount: ['1'],
        chainID: [chainID],
        disableGenesis: ['false'],
    };

    // Add limit if given
    if (limit > 0) {
        //@ts-ignore
        req.limit = [limit.toString()];
    }

    // Add end time if given
    if (endTime) {
        //@ts-ignore
        req.endTime = [endTime];
    }

    const res = await explorer_api.post<{ transactions: OrteliusAvalancheTx[]; next?: string }>(rootUrl, req);
    const resTxs = res.transactions;
    const next: string | undefined = res.next;

    let allTxs = resTxs === null ? [] : resTxs;

    // If we need to fetch more for this address
    if (next && !limit) {
        let endTime = next.split('&')[0].split('=')[1];
        let nextRes = await getAddressHistory(addresses, limit, chainID, endTime);
        allTxs.push(...nextRes);
    }

    return allTxs;
}

/**
 * Returns, X or P chain transactions belonging to the given address array.
 * @param addrs Addresses to check for.
 * @param limit
 * @param chainID The blockchain ID of X or P chain
 * @param endTime
 */
export async function getAddressHistory(
    addrs: string[],
    limit = 20,
    chainID: string,
    endTime?: string
): Promise<OrteliusAvalancheTx[]> {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }
    const ADDR_SIZE = 1024;

    const addrsChunks = [];

    for (let i = 0; i < addrs.length; i += ADDR_SIZE) {
        const chunk = addrs.slice(i, i + ADDR_SIZE);
        addrsChunks.push(chunk);
    }

    // Get histories in parallel
    const promises = addrsChunks.map((chunk) => {
        return getTransactionsAvalanche(chunk, limit, chainID, endTime);
    });

    const results = await Promise.all(promises);
    return results.reduce((acc, txs) => {
        return [...acc, ...txs];
    }, []);
}

/**
 * Given an array of addresses, checks which chain each address was already used on
 * @param addrs
 */
export async function getAddressChains(addrs: string[]) {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    // Strip the prefix
    let rawAddrs = addrs.map((addr) => {
        return addr.split('-')[1];
    });

    let urlRoot = `v2/addressChains`;

    let res = await explorer_api.post<any>(urlRoot, {
        address: rawAddrs,
        disableCount: ['1'],
    });

    return res.addressChains;
}

export async function getAddressDetailX(addr: string) {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    let addrRaw = addr.split('-')[1];
    let url = `x/addresses/${addrRaw}`;

    return await explorer_api.get<any>(url);
}
