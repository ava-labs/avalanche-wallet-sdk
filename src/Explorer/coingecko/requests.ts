import { CoinGeckoPriceHistoryResponse } from '@/Explorer/coingecko/types';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const AVAX_COIN_ID = 'avalanche-2';

/**
 * Fetches the current AVAX price using Coin Gecko.
 * @remarks
 * You might get rate limited if you use this function frequently.
 *
 * @return
 * Current price of 1 AVAX vs a currency (default USD)
 */
export async function getAvaxPrice(currentCurrency = 'USD'): Promise<number> {
    const res = await fetch(`${COINGECKO_BASE_URL}/simple/price?ids=${AVAX_COIN_ID}&vs_currencies=${currentCurrency}`);
    const data = await res.json();
    return data[AVAX_COIN_ID][currentCurrency.toLowerCase()];
}

/**
 * Gets daily price history using Coin Gecko.
 * @param currency
 */
export async function getAvaxPriceHistory(currency = 'USD') {
    const params = new URLSearchParams({
        vs_currency: currency.toLowerCase(),
        days: 'max',
        interval: 'daily',
    });
    const res = await fetch(`${COINGECKO_BASE_URL}/coins/${AVAX_COIN_ID}/market_chart?${params.toString()}`);
    const data: CoinGeckoPriceHistoryResponse = await res.json();

    return data.prices;
}
