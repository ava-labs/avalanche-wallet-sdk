import { Erc20Store, Erc20TokenData } from '@/Asset/types';
import { Erc20Token } from '@/Asset/Erc20Token';

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

/**
 * Fetches ERC20 data from the given contract address and adds the token to the given store.
 * @param address ERC20 Contract address
 */
async function addErc20Token(address: string): Promise<Erc20Token> {
    let existing = erc20Cache[address];
    if (existing) {
        return existing;
    }

    try {
        let data: Erc20TokenData = await Erc20Token.getData(address);
        let token = new Erc20Token(data);

        erc20Cache[address] = token;
        return token;
    } catch (e) {
        throw new Error('Unable to add ERC20 contract.');
    }
}

/**
 * Initates and caches an erc20 token from the given data.
 * @param data Information such as name, symbol, and address about the ERC20 token.
 */
export function addErc20TokenFromData(data: Erc20TokenData): Erc20Token {
    let address = data.address;
    let existing = erc20Cache[address];
    if (existing) {
        return existing;
    }

    let token = new Erc20Token(data);
    erc20Cache[address] = token;
    return token;
}

export async function getContractDataErc20(address: string): Promise<Erc20TokenData> {
    try {
        let data: Erc20TokenData = await Erc20Token.getData(address);
        return data;
    } catch (e) {
        throw new Error(`ERC20 contract ${address} does not exist.`);
    }
}

export async function getErc20Token(address: string): Promise<Erc20Token> {
    let storeItem = erc20Cache[address];
    if (storeItem) {
        return storeItem;
    } else {
        return await addErc20Token(address);
    }
}
