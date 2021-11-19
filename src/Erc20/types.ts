import Erc20Token from '@/Erc20/Erc20Token';

export interface Erc20TokenData {
    chainId: number;
    address: string;
    decimals: number;
    name: string;
    symbol: string;
}

export interface Erc20Store {
    [address: string]: Erc20Token;
}
