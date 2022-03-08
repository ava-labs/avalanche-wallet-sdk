import axios from 'axios';
import { CoinGeckoPriceHistoryResponse } from '@/Explorer/coingecko/types';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetchAdapter = require('@vespaiach/axios-fetch-adapter').default;

const AVAX_COIN_ID = 'avalanche-2';
const coingeckoApi = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 10000,
    adapter: fetchAdapter,
});

/**
 * Fetches the current AVAX price using Coin Gecko.
 * @remarks
 * You might get rate limited if you use this function frequently.
 *
 * @return
 * Current price of 1 AVAX vs a currency (default USD)
 */
export async function getAvaxPrice(currentCurrency = 'USD'): Promise<number> {
    const res = await coingeckoApi.get(`simple/price?ids=${AVAX_COIN_ID}&vs_currencies=${currentCurrency}`);
    return res.data[AVAX_COIN_ID][currentCurrency.toLowerCase()];
}

/**
 * Gets daily price history using Coin Gecko.
 * @param currency
 */
export async function getAvaxPriceHistory(currency = 'USD') {
    let res = await coingeckoApi.get<CoinGeckoPriceHistoryResponse>(`/coins/${AVAX_COIN_ID}/market_chart`, {
        params: {
            vs_currency: currency.toLowerCase(),
            days: 'max',
            interval: 'daily',
        },
    });
    return res.data.prices;
}
