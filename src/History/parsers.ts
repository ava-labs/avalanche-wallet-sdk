import {
    HistoryItemType,
    HistoryItemTypeName,
    iHistoryEVMTx,
    iHistoryImportExport,
    iHistoryStaking,
    ITransactionData,
    ITransactionDataEVM,
} from '@/History';
import { findSourceChain, getEvmAssetBalanceFromUTXOs, parseMemo } from '@/History/history_helpers';
import { activeNetwork, xChain } from '@/Network/network';
import { bnToAvaxC, bnToAvaxP, bnToAvaxX } from '@/utils';
import { BN } from 'avalanche';
import { getBaseTxSummary } from '@/History/base_tx_parser';
import { idToChainAlias } from '@/Network/helpers/aliasFromNetworkID';
import { getExportSummary, getImportSummary } from '@/History/importExportParser';
import { getOutputTotals, getOwnedOutputs, getRewardOuts, getStakeAmount } from '@/History/utxo_helpers';

export async function getTransactionSummary(
    tx: ITransactionData,
    walletAddrs: string[],
    evmAddress: string
): Promise<HistoryItemType> {
    let cleanAddressesXP = walletAddrs.map((addr) => addr.split('-')[1]);

    switch (tx.type) {
        case 'import':
        case 'pvm_import':
            return getImportSummary(tx, cleanAddressesXP);
        case 'export':
        case 'pvm_export':
        case 'atomic_export_tx':
            return getExportSummary(tx, cleanAddressesXP);
        case 'add_validator':
        case 'add_delegator':
            return getStakingSummary(tx, cleanAddressesXP);
        case 'atomic_import_tx':
            return getImportSummaryC(tx, evmAddress);
        case 'operation':
        case 'base':
            return await getBaseTxSummary(tx, cleanAddressesXP);
        default:
            throw new Error(`Unsupported history transaction type. (${tx.type})`);
    }
}

function getStakingSummary(tx: ITransactionData, ownerAddrs: string[]): iHistoryStaking {
    let time = new Date(tx.timestamp);

    // let pChainID = activeNetwork.pChainID;
    // let avaxID = activeNetwork.avaxID;
    let ins = tx.inputs?.map((tx) => tx.output) || [];
    let myIns = getOwnedOutputs(ins, ownerAddrs);

    let outs = tx.outputs || [];
    let myOuts = getOwnedOutputs(outs, ownerAddrs);

    let stakeAmount = getStakeAmount(tx);

    // Assign the type
    let type: HistoryItemTypeName = tx.type === 'add_validator' ? 'add_validator' : 'add_delegator';
    // If this wallet only received the fee
    if (myIns.length === 0 && type === 'add_delegator') {
        type = 'delegation_fee';
    } else if (myIns.length === 0 && type === 'add_validator') {
        type = 'validation_fee';
    }

    let rewardAmount;
    let rewardAmountClean;
    if (tx.rewarded) {
        let rewardOuts = getRewardOuts(myOuts);
        rewardAmount = getOutputTotals(rewardOuts);
        rewardAmountClean = bnToAvaxP(rewardAmount);
    }

    return {
        id: tx.id,
        nodeID: tx.validatorNodeID,
        stakeStart: new Date(tx.validatorStart * 1000),
        stakeEnd: new Date(tx.validatorEnd * 1000),
        timestamp: time,
        type: type,
        fee: new BN(0),
        amount: stakeAmount,
        amountDisplayValue: bnToAvaxP(stakeAmount),
        memo: parseMemo(tx.memo),
        isRewarded: tx.rewarded,
        rewardAmount: rewardAmount,
        rewardAmountDisplayValue: rewardAmountClean,
    };
}

// Returns the summary for a C chain import TX
function getImportSummaryC(tx: ITransactionData, ownerAddr: string) {
    let sourceChain = findSourceChain(tx);
    let chainAliasFrom = idToChainAlias(sourceChain);
    let chainAliasTo = idToChainAlias(tx.chainID);

    let avaxID = activeNetwork.avaxID;

    let outs = tx.outputs || [];
    let amtOut = getEvmAssetBalanceFromUTXOs(outs, ownerAddr, avaxID, tx.chainID);

    let time = new Date(tx.timestamp);
    let fee = xChain.getTxFee();

    let res: iHistoryImportExport = {
        id: tx.id,
        source: chainAliasFrom,
        destination: chainAliasTo,
        amount: amtOut,
        amountDisplayValue: bnToAvaxX(amtOut),
        timestamp: time,
        type: 'import',
        fee: fee,
        memo: parseMemo(tx.memo),
    };

    return res;
}

export function getTransactionSummaryEVM(tx: ITransactionDataEVM, walletAddress: string): iHistoryEVMTx {
    let isSender = tx.fromAddr.toUpperCase() === walletAddress.toUpperCase();

    let amt = new BN(tx.value);
    let amtClean = bnToAvaxC(amt);
    let date = new Date(tx.createdAt);

    let gasLimit = new BN(tx.gasLimit);
    let gasPrice = new BN(tx.gasPrice);
    let feeBN = gasLimit.mul(gasPrice); // in gwei

    return {
        id: tx.hash,
        fee: feeBN,
        memo: '',
        hash: tx.hash,
        block: tx.block,
        isSender,
        type: 'transaction_evm',
        amount: amt,
        amountDisplayValue: amtClean,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        from: tx.fromAddr,
        to: tx.toAddr,
        timestamp: date,
    };
}
