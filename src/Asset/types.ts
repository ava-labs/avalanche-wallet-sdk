import { Buffer } from 'avalanche';
import { Erc20Token } from '@/Asset/Erc20Token';

export interface iAssetCache {
    [assetId: string]: iAssetDescriptionClean;
}

export interface iAssetDescriptionRaw {
    name: string;
    symbol: string;
    assetID: Buffer;
    denomination: number;
}

export interface iAssetDescriptionClean {
    name: string;
    symbol: string;
    assetID: string;
    denomination: number;
}

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
