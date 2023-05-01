import { isFujiNetworkId, isMainnetNetworkId } from '@/Network';
import { ListStakingParams } from './models';
import { splitToParts } from './utils';
import { filterDuplicateGlacierTxs } from './filterDuplicateGlacierTxs';
import Glacier from './Glacier';
import { Network, PChainId, PChainTransaction, SortOrder } from '@avalabs/glacier-sdk';

export async function listStakingForAddresses(addrs: string[], netID: number) {
    if (!addrs.length) return [];

    const network = isMainnetNetworkId(netID) ? Network.MAINNET : Network.FUJI;

    // Cannot use glacier for other networks
    if (!isMainnetNetworkId(netID) && !isFujiNetworkId(netID)) return [];

    const addressLimit = 64;
    const addrParts = splitToParts<string>(addrs, addressLimit);

    async function fetchAll(config: ListStakingParams): Promise<PChainTransaction[]> {
        // const res = await GlacierService.listStaking(config)
        const res = await Glacier.primaryNetwork.listActivePrimaryNetworkStakingTransactions({
            ...config,
            addresses: config.addresses.join(','),
        });

        if (res.nextPageToken) {
            const next = await fetchAll({
                ...config,
                pageToken: res.nextPageToken,
            });
            return [...res.transactions, ...next];
        }
        return res.transactions ?? [];
    }

    const promises = addrParts.map((addrs) => {
        return fetchAll({
            addresses: addrs,
            pageSize: 100,
            sortOrder: SortOrder.DESC,
            blockchainId: PChainId.P_CHAIN,
            network,
        });
    });

    const results = (await Promise.all(promises)).flat();

    return filterDuplicateGlacierTxs(results) as PChainTransaction[];
}
