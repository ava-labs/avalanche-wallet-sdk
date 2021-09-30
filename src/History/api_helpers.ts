import { ITransactionData, ITransactionDataEVM } from '@/History/raw_types';
import { explorer_api } from '@/Network/network';
import { NO_EXPLORER_API } from '@/errors';

/**
 * Returns transactions FROM and TO the address given
 * @param addr The address to get historic transactions for.
 */
export async function getAddressHistoryEVM(addr: string): Promise<ITransactionDataEVM[]> {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    let endpoint = `v2/ctransactions?address=${addr}`;
    let data: ITransactionDataEVM[] = (await explorer_api.get(endpoint)).data.Transactions;

    data.sort((a, b) => {
        let dateA = new Date(a.createdAt);
        let dateB = new Date(b.createdAt);

        return dateB.getTime() - dateA.getTime();
    });

    return data;
}

export async function getAddressHistory(
    addrs: string[],
    limit = 20,
    chainID: string,
    endTime?: string
): Promise<ITransactionData[]> {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    const ADDR_SIZE = 1024;
    let selection = addrs.slice(0, ADDR_SIZE);
    let remaining = addrs.slice(ADDR_SIZE);

    let addrsRaw = selection.map((addr) => {
        return addr.split('-')[1];
    });

    let rootUrl = 'v2/transactions';

    let req = {
        address: addrsRaw,
        sort: ['timestamp-desc'],
        disableCount: ['1'],
        chainID: [chainID],
        disableGenesis: ['false'],
    };

    if (limit > 0) {
        //@ts-ignore
        req.limit = [limit.toString()];
    }

    if (endTime) {
        //@ts-ignore
        req.endTime = [endTime];
    }

    let res = await explorer_api.post(rootUrl, req);
    let txs = res.data.transactions;
    let next: string | undefined = res.data.next;

    if (txs === null) txs = [];

    // If we need to fetch more for this address
    if (next && !limit) {
        let endTime = next.split('&')[0].split('=')[1];
        let nextRes = await getAddressHistory(selection, limit, chainID, endTime);
        txs.push(...nextRes);
    }

    // If there are addresses left, fetch them too
    // TODO: Do this in parallel, not recursive
    if (remaining.length > 0) {
        let nextRes = await getAddressHistory(remaining, limit, chainID);
        txs.push(...nextRes);
    }

    return txs;
}
