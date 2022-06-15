import { filterDuplicateOrtelius, getAddressHistory, getAddressHistoryEVM, OrteliusAvalancheTx } from '@/Explorer';
import { getTransactionSummary } from '@/History/parsers';
import { getTransactionSummaryEVM } from '@/History/evmParser';
import { cChain, pChain, xChain } from '@/Network';

export async function getHistoryX(addrs: string[], limit = 0) {
    return await getAddressHistory(addrs, limit, xChain.getBlockchainID());
}

export async function getHistoryP(addrs: string[], limit = 0) {
    return await getAddressHistory(addrs, limit, pChain.getBlockchainID());
}

/**
 * Returns atomic history for this wallet on the C chain.
 * @remarks Excludes EVM transactions.
 * @param limit
 */
export async function getHistoryC(addrC: string, addrsX: string[], limit = 0): Promise<OrteliusAvalancheTx[]> {
    let addrs = [addrC, ...addrsX];
    return await getAddressHistory(addrs, limit, cChain.getBlockchainID());
}

/**
 * Returns history for this wallet on the C chain.
 * @remarks Excludes atomic C chain import/export transactions.
 */
export async function getHistoryEVM(addr: string) {
    return await getAddressHistoryEVM(addr);
}

/**
 *
 * @param xAddresses A list of owned X chain addresses
 * @param pAddresses A list of owned P chain addresses
 * @param cAddress Bech32 C chain address
 * @param evmAddress Hex C chain address
 * @param limit
 */
export async function getHistoryForOwnedAddresses(
    xAddresses: string[],
    pAddresses: string[],
    cAddress: string,
    evmAddress: string,
    limit = 0
) {
    let [txsX, txsP, txsC] = await Promise.all([
        getHistoryX(xAddresses, limit),
        getHistoryP(pAddresses, limit),
        getHistoryC(cAddress, xAddresses, limit),
    ]);

    let txsXPC = filterDuplicateOrtelius(txsX.concat(txsP, txsC));
    let txsEVM = await getHistoryEVM(evmAddress);

    let addrs = [...xAddresses, cAddress];

    // Parse X,P,C transactions
    // Have to loop because of the asynchronous call
    let parsedXPC = [];
    for (let i = 0; i < txsXPC.length; i++) {
        let tx = txsXPC[i];
        try {
            let summary = await getTransactionSummary(tx, addrs, evmAddress);
            parsedXPC.push(summary);
        } catch (err) {
            console.error(err);
        }
    }

    // Parse EVM Transactions
    let parsedEVM = txsEVM.map((tx) => getTransactionSummaryEVM(tx, evmAddress));

    // Sort and join X,P,C transactions
    let parsedAll = [...parsedXPC, ...parsedEVM];
    let txsSorted = parsedAll.sort((x, y) => (x.timestamp.getTime() < y.timestamp.getTime() ? 1 : -1));

    // If there is a limit only return that much
    if (limit > 0) {
        return txsSorted.slice(0, limit);
    }
    return txsSorted;
}
