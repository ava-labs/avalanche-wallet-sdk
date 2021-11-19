import { explorer_api } from '@/Network/network';
import { NO_EXPLORER_API } from '@/errors';

export async function isAddressUsedX(addr: string) {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    let addrRaw = addr.split('-')[1];
    let url = `/x/transactions?address=${addrRaw}&limit=1&disableCount=1`;

    let res = await explorer_api.get(url);
    if (res.data.transactions.length > 0) return true;
    else return false;
}

export async function getAddressDetailX(addr: string) {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    let addrRaw = addr.split('-')[1];
    let url = `/x/addresses/${addrRaw}`;

    let res = await explorer_api.get(url);
    return res.data;
}

// Given an array of addresses, checks which chain each address was already used on
export async function getAddressChains(addrs: string[]) {
    if (!explorer_api) {
        throw NO_EXPLORER_API;
    }

    // Strip the prefix
    let rawAddrs = addrs.map((addr) => {
        return addr.split('-')[1];
    });

    let urlRoot = `/v2/addressChains`;

    let res = await explorer_api.post(urlRoot, {
        address: rawAddrs,
        disableCount: ['1'],
    });

    return res.data.addressChains;
}
