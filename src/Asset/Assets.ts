import { xChain } from '@/Network/network';

import { iAssetCache, iAssetDescriptionClean } from '@/Asset/types';

let assetCache: iAssetCache = {};

export async function getAssetDescription(assetId: string): Promise<iAssetDescriptionClean> {
    let cache = assetCache[assetId];
    if (cache) {
        return cache;
    }

    let res = await xChain.getAssetDescription(assetId);
    let clean: iAssetDescriptionClean = {
        ...res,
        assetID: assetId,
    };

    assetCache[assetId] = clean;
    return clean;
}
