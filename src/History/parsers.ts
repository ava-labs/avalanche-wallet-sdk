import {
    AVMHistoryItemType,
    iHistoryAddDelegator,
    iHistoryEVMTx,
    iHistoryImportExport,
    ITransactionData,
    ITransactionDataEVM,
} from '@/History';
import {
    findSourceChain,
    getAssetBalanceFromUTXOs,
    getEvmAssetBalanceFromUTXOs,
    parseMemo,
} from '@/History/history_helpers';
import { activeNetwork, xChain } from '@/Network/network';
import { bnToAvaxC, bnToAvaxP, bnToAvaxX } from '@/utils';
import { BN } from 'avalanche';
import { getBaseTxSummary } from '@/History/base_tx_parser';
import { idToChainAlias } from '@/Network/helpers/aliasFromNetworkID';
import { getExportSummary, getImportSummary } from '@/History/importExportParser';

export async function getTransactionSummary(
    tx: ITransactionData,
    walletAddrs: string[],
    evmAddress: string
): Promise<AVMHistoryItemType> {
    let sum;

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
            sum = getValidatorSummary(tx, cleanAddressesXP);
            break;
        case 'add_delegator':
            sum = getValidatorSummary(tx, cleanAddressesXP);
            break;
        case 'atomic_import_tx':
            sum = getImportSummaryC(tx, evmAddress);
            break;
        case 'operation':
        case 'base':
            sum = await getBaseTxSummary(tx, cleanAddressesXP);
            break;
        default:
            throw new Error(`Unsupported history transaction type. (${tx.type})`);
    }
    return sum;
}

function getValidatorSummary(tx: ITransactionData, ownerAddrs: string[]): iHistoryAddDelegator {
    let time = new Date(tx.timestamp);

    let pChainID = activeNetwork.pChainID;
    let avaxID = activeNetwork.avaxID;

    let outs = tx.outputs || [];
    let stakeAmt = getAssetBalanceFromUTXOs(outs, ownerAddrs, avaxID, pChainID, true);

    return {
        id: tx.id,
        nodeID: tx.validatorNodeID,
        stakeStart: new Date(tx.validatorStart * 1000),
        stakeEnd: new Date(tx.validatorEnd * 1000),
        timestamp: time,
        type: 'add_validator',
        fee: new BN(0),
        amount: stakeAmt,
        amountClean: bnToAvaxP(stakeAmt),
        memo: parseMemo(tx.memo),
        isRewarded: tx.rewarded,
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
        amountClean: bnToAvaxX(amtOut),
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
        amountClean: amtClean,
        gasLimit: tx.gasLimit,
        gasPrice: tx.gasPrice,
        from: tx.fromAddr,
        to: tx.toAddr,
        timestamp: date,
    };
}
