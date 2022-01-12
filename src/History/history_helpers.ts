import { OrteliusUTXO } from '@/Explorer';
import { iHistoryNftFamilyBalance } from '@/History/types';
import { AVMConstants } from 'avalanche/dist/apis/avm';
import { parseNftPayload } from '@/utils';
import { isOutputOwner } from '@/Explorer/ortelius/utxoUtils';

/**
 * Parse the raw memo field to readable text.
 * @param raw
 */
export function parseMemo(raw: string): string {
    const memoText = new Buffer(raw, 'base64').toString('utf8');

    // Bug that sets memo to empty string (AAAAAA==) for some tx types
    if (!memoText.length || raw === 'AAAAAA==') return '';
    return memoText;
}

export function getNFTBalanceFromUTXOs(
    utxos: OrteliusUTXO[],
    addresses: string[],
    assetID: string
): iHistoryNftFamilyBalance {
    let nftUTXOs = utxos.filter((utxo) => {
        if (
            utxo.outputType === AVMConstants.NFTXFEROUTPUTID &&
            utxo.assetID === assetID &&
            isOutputOwner(addresses, utxo)
        ) {
            return true;
        }
        return false;
    });

    let res: iHistoryNftFamilyBalance = {};
    for (let i = 0; i < nftUTXOs.length; i++) {
        let utxo = nftUTXOs[i];
        let groupID = utxo.groupID;

        let content;
        if (utxo.payload) {
            let parsedPayload = parseNftPayload(utxo.payload);
            content = parsedPayload.getContent().toString();
        }

        if (res[groupID]) {
            res[groupID].amount++;
        } else {
            res[groupID] = {
                payload: content || '',
                amount: 1,
            };
        }
    }
    return res;
}
