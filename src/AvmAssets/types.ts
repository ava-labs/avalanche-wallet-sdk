import { Buffer } from 'avalanche';

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
