import axios from 'axios';

const getCoinGeckoURL = (currentCurrency: string) =>
    `https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=${currentCurrency}`;

/**
 * Fetches the current AVAX price using Coin Gecko.
 * @remarks
 * You might get rate limited if you use this function frequently.
 *
 * @return
 * Current price of 1 AVAX vs a currency (default USD)
 */
export async function getAvaxPrice(currentCurrency = 'USD'): Promise<number> {
    const res = await axios.get(getCoinGeckoURL(currentCurrency));
    return res.data['avalanche-2'][currentCurrency.toLowerCase()];
}
