import { Erc20Store, Erc20TokenData } from '@/Asset/types';
import { activeNetwork } from '@/Network/network';
import Erc20Token from '@/Asset/Erc20Token';
import { WalletBalanceERC20 } from '@/Wallet/types';
import { bnToLocaleString } from '@/utils/utils';

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

    let data: Erc20TokenData = await Erc20Token.getData(address);
    let token = new Erc20Token(data);

    erc20Cache[address] = token;
    return token;
}

function addErc20TokenFromData(data: Erc20TokenData): Erc20Token {
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
    let data: Erc20TokenData = await Erc20Token.getData(address);
    return data;
}

export async function getErc20Token(address: string): Promise<Erc20Token> {
    let storeItem = erc20Cache[address];
    if (storeItem) {
        return storeItem;
    } else {
        return await addErc20Token(address);
    }
}

/**
 * Returns the balance of the given address for each ERC20 Token in the SDK.
 * @param address EVM address `0x...`
 */
// export async function balanceOf(address: string): Promise<WalletBalanceERC20> {
//     let balance: WalletBalanceERC20 = {};
//
//     let store = {
//         ...erc20Store,
//         ...erc20StoreCustom,
//     };
//
//     for (let tokenAddress in store) {
//         let token = store[tokenAddress];
//         if (token.chainId === activeNetwork?.evmChainID) {
//             let bal = await token.balanceOf(address);
//             balance[tokenAddress] = {
//                 name: token.name,
//                 symbol: token.symbol,
//                 denomination: token.decimals,
//                 balance: bal,
//                 balanceParsed: bnToLocaleString(bal, token.decimals),
//                 address: tokenAddress,
//             };
//         }
//     }
//
//     return balance;
// }

// function initStore() {
//     DEFAULT_TOKENS.forEach((token) => {
//         addErc20TokenFromData(token, erc20Store);
//     });
// }
// initStore();
