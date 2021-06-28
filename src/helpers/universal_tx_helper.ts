// import { WalletType } from '@/Wallet/types';
import { BN } from 'avalanche';
// import { getAddressChain, validateAddress } from '@/helpers/address_helper';
import { ChainIdType } from '@/types';
import { pChain, web3, xChain } from '@/Network/network';
// import { Utils } from '@/index';
// import { WalletProvider } from '@/Wallet/Wallet';
// import { PlatformVMConstants } from 'avalanche/dist/apis/platformvm';
// import Common from '@ethereumjs/common';

type UniversalTxActionTypesX = 'send_x' | 'export_x_c' | 'export_x_P';
type UniversalTxActionTypesC = 'send_c' | 'export_c_x';
type UniversalTxActionTypesP = 'export_p_x';

type UniversalTxActionType = UniversalTxActionTypesX | UniversalTxActionTypesC | UniversalTxActionTypesP;

interface UniversalTx {
    action: UniversalTxActionType;
    amount: BN;
}

/**
 * Returns what transactions are needed to have the given AVAX balance on the given chain.
 * @param balX current balance of the X chain in nAVAX
 * @param balP current balance of the P chain in nAVAX
 * @param balC current balance of the C chain in nAVAX
 * @param targetChain One of the primary chain.
 * @param targetAmount Desired amount on the `targetChain`
 */
export function getStepsForTargetAvaxBalance(
    balX: BN,
    balP: BN,
    balC: BN,
    targetAmount: BN,
    targetChain: ChainIdType
): UniversalTx[] {
    // Compute destination chain
    let balances = {
        X: balX,
        P: balP,
        C: balC,
    };

    let balDestination = balances[targetChain];

    // Current chain has enough balance
    if (balDestination.gte(targetAmount)) {
        return [];
    }

    let targetRemaining = targetAmount.sub(balDestination);

    if (targetChain === 'X') {
        // Use chain with bigger balance first
        // if (balP.gt(balC)) {
        // }

        // Check if P has enough
        let exportImportCost = pChain.getTxFee().mul(new BN(2));
        let tot = targetRemaining.add(exportImportCost);
        if (balP.gte(tot)) {
            return [];
        }
    }
    return [];
}
