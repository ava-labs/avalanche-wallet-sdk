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
    targetChain: ChainIdType,
    useChains: ChainIdType[] = ['X', 'P', 'C']
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

// export function buildUniversalAvaxTransferTxs(balX: BN, balP: BN, balC: BN, to: string, amount: BN): UniversalTx[] {
// // Verify destination address and chain
// let destinationChain = getAddressChain(to);
// console.log(to, amount.toString(), destinationChain);
//
// // Compute destination chain
// let balances = {
//     X: balX,
//     P: balP,
//     C: balC,
// };
//
// console.log(balances.X.toString());
// console.log(balances.P.toString());
// console.log(balances.C.toString());
//
// let txs: UniversalTx[] = [];
//
// // Check if we have enough balance on destination chain
// // Total sum is ALL AVAX - ()
//
// let balDestination = balances[destinationChain];
//
// let gasLimit = 21000;
// let gasPrice = new BN(225);
//
// // If we have enough balance on the destination chain
// // TODO: Add fee to the calculation?
// if (balDestination.lte(amount)) {
//     switch (destinationChain) {
//         case 'X':
//             txs.push({
//                 action: 'send_x',
//                 amount: amount,
//             });
//             break;
//         case 'C':
//             txs.push({
//                 action: 'send_c',
//                 amount: amount,
//             });
//     }
//     return txs;
// }
//
// // If we dont have enough balance on the destination chain
// let remaining = amount.sub(balDestination);
// let importExportFee = xChain.getTxFee().mul(new BN(2));
//
// if (destinationChain === 'C') {
//     // Check if X balance can finish the transaction
//     // Take the 2 tx fees (import,export) into consideration
//     let xAmtRequired = remaining.add(importExportFee);
//     if (xAmtRequired.lte(balX)) {
//         // Export From X to C
//         txs.push({
//             action: 'export_x_c',
//             amount: remaining,
//         });
//
//         txs.push({
//             action: 'send_c',
//             amount,
//         });
//     }
// } else if (destinationChain === 'X') {
//     // Check if C chain balance can finish the transaction
//     let cAmtRequired = remaining.add(importExportFee);
//     if (cAmtRequired.lte(balC)) {
//         // Export From X to C
//         txs.push({
//             action: 'export_c_x',
//             amount: remaining,
//         });
//
//         txs.push({
//             action: 'send_x',
//             amount,
//         });
//     }
// }
//
// return txs;
// }
