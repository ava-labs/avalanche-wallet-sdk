import { Erc20Store } from '@/Erc20/types';

export let erc20Cache: Erc20Store = {};

export function getErc20Cache(): Erc20Store {
    return {
        ...erc20Cache,
    };
}

/**
 * Clears the internal erc20 cache.
 */
export function bustErc20Cache() {
    erc20Cache = {};
}
