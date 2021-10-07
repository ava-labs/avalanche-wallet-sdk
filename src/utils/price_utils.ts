import axios from 'axios';

const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price?ids=avalanche-2&vs_currencies=usd';

/**
 * Fetches the current AVAX price using Coin Gecko.
 * @remarks
 * You might get rate limited if you use this function frequently.
 *
 * @return
 * Current USD price of 1 AVAX
 */
export async function getAvaxPrice(): Promise<number> {
    const res = await axios.get(COINGECKO_URL);
    return res.data['avalanche-2'].usd;
}
