import axios from 'axios';

const getCoinGeckoURL = (vsCurrencySymbol: string) =>
    `https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=${vsCurrencySymbol}`;

/**
 * Fetches the current AVAX price using Coin Gecko.
 * @remarks
 * You might get rate limited if you use this function frequently.
 *
 * @return
 * Current price of 1 AVAX vs a currency (default USD)
 */
export async function getAvaxPrice(vsCurrencySymbol = 'USD'): Promise<number> {
    const res = await axios.get(getCoinGeckoURL(vsCurrencySymbol));
    return res.data['avalanche-2'][vsCurrencySymbol.toLowerCase()];
}
