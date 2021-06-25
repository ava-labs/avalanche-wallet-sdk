import { Erc20Store, Erc20TokenData } from '@/Asset/types';
import { activeNetwork, web3 } from '@/Network/network';
import Erc20Token from '@/Asset/Erc20Token';
import { WalletBalanceERC20 } from '@/Wallet/types';
import { bnToLocaleString } from '@/utils/utils';

const DEFAULT_TOKENS: Erc20TokenData[] = [
    {
        chainId: 43114,
        address: '0x60781C2586D68229fde47564546784ab3fACA982',
        decimals: 18,
        name: 'Pangolin',
        symbol: 'PNG',
    },
    {
        chainId: 43114,
        address: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7',
        decimals: 18,
        name: 'Wrapped AVAX',
        symbol: 'WAVAX',
    },
    {
        chainId: 43114,
        address: '0xf20d962a6c8f70c731bd838a3a388D7d48fA6e15',
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    {
        chainId: 43114,
        address: '0xde3A24028580884448a5397872046a019649b084',
        decimals: 6,
        name: 'Tether USD',
        symbol: 'USDT',
    },
    {
        chainId: 43114,
        address: '0xB3fe5374F67D7a22886A0eE082b2E2f9d2651651',
        decimals: 18,
        name: 'ChainLink Token',
        symbol: 'LINK',
    },
    {
        chainId: 43114,
        address: '0x8cE2Dee54bB9921a2AE0A63dBb2DF8eD88B91dD9',
        decimals: 18,
        name: 'Aave Token',
        symbol: 'AAVE',
    },
    {
        chainId: 43114,
        address: '0xf39f9671906d8630812f9d9863bBEf5D523c84Ab',
        decimals: 18,
        name: 'Uniswap',
        symbol: 'UNI',
    },
    {
        chainId: 43114,
        address: '0x408D4cD0ADb7ceBd1F1A1C33A0Ba2098E1295bAB',
        decimals: 8,
        name: 'Wrapped BTC',
        symbol: 'WBTC',
    },
    {
        chainId: 43114,
        address: '0x8DF92E9C0508aB0030d432DA9F2C65EB1Ee97620',
        decimals: 18,
        name: 'Maker',
        symbol: 'MKR',
    },
    {
        chainId: 43114,
        address: '0x68e44C4619db40ae1a0725e77C02587bC8fBD1c9',
        decimals: 18,
        name: 'Synthetix Network Token',
        symbol: 'SNX',
    },
    {
        chainId: 43114,
        address: '0x53CEedB4f6f277edfDDEdB91373B044FE6AB5958',
        decimals: 18,
        name: 'Compound',
        symbol: 'COMP',
    },
    {
        chainId: 43114,
        address: '0x421b2a69b886BA17a61C7dAd140B9070d5Ef300B',
        decimals: 18,
        name: 'HuobiToken',
        symbol: 'HT',
    },
    {
        chainId: 43114,
        address: '0x39cf1BD5f15fb22eC3D9Ff86b0727aFc203427cc',
        decimals: 18,
        name: 'SushiToken',
        symbol: 'SUSHI',
    },
    {
        chainId: 43114,
        address: '0xC84d7bfF2555955b44BDF6A307180810412D751B',
        decimals: 18,
        name: 'UMA Voting Token v1',
        symbol: 'UMA',
    },
    {
        chainId: 43114,
        address: '0xaEb044650278731Ef3DC244692AB9F64C78FfaEA',
        decimals: 18,
        name: 'Binance USD',
        symbol: 'BUSD',
    },
    {
        chainId: 43114,
        address: '0xbA7dEebBFC5fA1100Fb055a87773e1E99Cd3507a',
        decimals: 18,
        name: 'Dai Stablecoin',
        symbol: 'DAI',
    },
];

export let erc20Store: Erc20Store = {};
export let erc20StoreCustom: Erc20Store = {};

export function getErc20Store(): Erc20Store {
    return {
        ...erc20Store,
    };
}

export function getErc20StoreCustom() {
    return {
        ...erc20StoreCustom,
    };
}

/**
 * Fetches ERC20 data from the given contract address and adds the token to the given store.
 * @param address ERC20 Contract address
 * @param store Which ERC20 store to add to
 */
export async function addErc20Token(address: string, store: Erc20Store = erc20StoreCustom) {
    let existing = erc20Store[address] || erc20StoreCustom[address];
    if (existing) {
        return existing;
    }

    let data: Erc20TokenData = await Erc20Token.getData(address);
    let token = new Erc20Token(data);

    store[address] = token;
    return token;
}

export function addErc20TokenFromData(data: Erc20TokenData, store: Erc20Store = erc20StoreCustom) {
    let address = data.address;
    let existing = erc20Store[address] || erc20StoreCustom[address];
    if (existing) {
        return existing;
        // throw new Error(`${address} ERC20 token is already added.`);
    }

    let token = new Erc20Token(data);
    store[address] = token;
    return token;
}

export async function getContractData(address: string): Promise<Erc20TokenData> {
    let data: Erc20TokenData = await Erc20Token.getData(address);
    return data;
}

export async function getErc20Token(address: string) {
    let storeItem = erc20Store[address] || erc20StoreCustom[address];
    if (storeItem) {
        return storeItem;
    } else {
        return addErc20Token(address);
    }
}

/**
 * Returns the balance of the given address for each ERC20 Token in the SDK.
 * @param address EVM address `0x...`
 */
export async function balanceOf(address: string): Promise<WalletBalanceERC20> {
    let balance: WalletBalanceERC20 = {};

    let store = {
        ...erc20Store,
        ...erc20StoreCustom,
    };

    for (let tokenAddress in store) {
        let token = store[tokenAddress];
        if (token.chainId === activeNetwork?.evmChainID) {
            let bal = await token.balanceOf(address);
            balance[tokenAddress] = {
                name: token.name,
                symbol: token.symbol,
                denomination: token.decimals,
                balance: bal,
                balanceParsed: bnToLocaleString(bal, token.decimals),
                address: tokenAddress,
            };
        }
    }

    return balance;
}

function initStore() {
    DEFAULT_TOKENS.forEach((token) => {
        addErc20TokenFromData(token, erc20Store);
    });
}
initStore();
