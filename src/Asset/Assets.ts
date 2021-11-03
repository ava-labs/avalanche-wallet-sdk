import { xChain } from '@/Network/network';

import { iAssetCache, iAssetDescriptionClean } from '@/Asset/types';
import xss from 'xss';
let assetCache: iAssetCache = {};

export function getAssetDescriptionSync(assetId: string): iAssetDescriptionClean {
    if (typeof assetCache[assetId] === 'undefined') throw new Error(`Asset ID ${assetId} is not known.`);
    return assetCache[assetId];
}

/**
 * Uses the node api to get meta data given an asset ID. Saves the result to cache.
 * @param assetId
 */
export async function getAssetDescription(assetId: string): Promise<iAssetDescriptionClean> {
    let cache = assetCache[assetId];
    if (cache) {
        return cache;
    }

    try {
        let res = await xChain.getAssetDescription(assetId);
        let clean: iAssetDescriptionClean = {
            ...res,
            assetID: assetId,
            name: xss(res.name),
            symbol: xss(res.symbol),
        };

        assetCache[assetId] = clean;
        return clean;
    } catch (e) {
        throw new Error(`Asset ${assetId} does not exist.`);
    }
}
