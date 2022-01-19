import { ChainIdType } from '@/common';
import { activeNetwork } from '@/Network/network';

/**
 * Given the chain ID returns the chain alias
 * @param id Chain id
 */
export function idToChainAlias(id: string): ChainIdType {
    if (id === activeNetwork.xChainID) {
        return 'X';
    } else if (id === activeNetwork.pChainID) {
        return 'P';
    } else if (id === activeNetwork.cChainID) {
        return 'C';
    }
    throw new Error('Unknown chain ID.');
}
