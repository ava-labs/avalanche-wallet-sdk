import {
    HistoryItemType,
    iHistoryAddDelegator,
    iHistoryBaseTx,
    iHistoryBaseTxNFTsReceived,
    iHistoryBaseTxNFTsReceivedRaw,
    iHistoryBaseTxNFTsSent,
    iHistoryBaseTxNFTsSentRaw,
    iHistoryBaseTxTokens,
    iHistoryBaseTxTokensReceived,
    iHistoryBaseTxTokensReceivedRaw,
    iHistoryBaseTxTokensSent,
    iHistoryBaseTxTokensSentRaw,
    iHistoryExport,
    iHistoryImport,
    iHistoryItem,
    iHistoryNftFamilyBalance,
    ITransactionData,
    UTXO,
} from '@/History/types';
import { activeNetwork, avalanche, explorer_api, xChain } from '@/Network/network';
import { BN } from 'avalanche';
import { ChainIdType } from '@/types';
import { AVMConstants } from 'avalanche/dist/apis/avm';
import { bnToAvaxP, bnToAvaxX, bnToLocaleString, parseNftPayload } from '@/utils/utils';
import { Assets } from '@/index';

export async function getAddressHistory(
    addrs: string[],
    limit = 20,
    chainID: string,
    endTime?: string
): Promise<ITransactionData[]> {
    const ADDR_SIZE = 1024;
    let selection = addrs.slice(0, ADDR_SIZE);
    let remaining = addrs.slice(ADDR_SIZE);

    let addrsRaw = selection.map((addr) => {
        return addr.split('-')[1];
    });

    let rootUrl = 'v2/transactions';

    let req = {
        address: addrsRaw,
        sort: ['timestamp-desc'],
        disableCount: ['1'],
        chainID: [chainID],
        disableGenesis: ['false'],
    };

    if (limit > 0) {
        //@ts-ignore
        req.limit = [limit.toString()];
    }

    if (endTime) {
        console.log('Setting endtime');
        //@ts-ignore
        req.endTime = [endTime];
    }

    let res = await explorer_api.post(rootUrl, req);
    let txs = res.data.transactions;
    let next: string | undefined = res.data.next;

    if (txs === null) txs = [];

    // If we need to fetch more for this address
    if (next && !limit) {
        let endTime = next.split('&')[0].split('=')[1];
        let nextRes = await getAddressHistory(selection, limit, chainID, endTime);
        txs.push(...nextRes);
    }

    // If there are addresses left, fetch them too
    if (remaining.length > 0) {
        let nextRes = await getAddressHistory(remaining, limit, chainID);
        txs.push(...nextRes);
    }

    return txs;
}

export async function getTransactionSummary(
    tx: ITransactionData,
    walletAddrs: string[],
    evmAddress: string
): Promise<HistoryItemType> {
    let sum;

    let cleanAddressesXP = walletAddrs.map((addr) => addr.split('-')[1]);

    switch (tx.type) {
        case 'import':
        case 'pvm_import':
            sum = getImportSummary(tx, cleanAddressesXP);
            break;
        case 'export':
        case 'pvm_export':
        case 'atomic_export_tx':
            sum = getExportSummary(tx, cleanAddressesXP);
            break;
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
            throw new Error('Unsupported history transaction type.');
            break;
    }
    return sum;
}

function idToChainAlias(id: string): ChainIdType {
    if (id === activeNetwork.xChainID) {
        return 'X';
    } else if (id === activeNetwork.pChainID) {
        return 'P';
    } else if (id === activeNetwork.cChainID) {
        return 'C';
    }
    throw new Error('Unknown chain ID.');
}

// If any of the outputs has a different chain ID, thats the destination chain
// else return current chain
function findDestinationChain(tx: ITransactionData): string {
    let baseChain = tx.chainID;
    let outs = tx.outputs || [];

    for (let i = 0; i < outs.length; i++) {
        let outChainId = outs[i].chainID;

        if (outChainId !== baseChain) return outChainId;
    }
    return baseChain;
}

// If any of the inputs has a different chain ID, thats the source chain
// else return current chain
function findSourceChain(tx: ITransactionData): string {
    let baseChain = tx.chainID;
    let ins = tx.inputs;

    for (let i = 0; i < ins.length; i++) {
        let inChainId = ins[i].output.chainID;
        if (inChainId !== baseChain) return inChainId;
    }
    return baseChain;
}

function isOutputOwner(ownerAddrs: string[], output: UTXO): boolean {
    let outAddrs = output.addresses;
    if (!outAddrs) return false;

    let totAddrs = outAddrs.filter((addr) => {
        return ownerAddrs.includes(addr);
    });

    return totAddrs.length > 0;
}

function isOutputOwnerC(ownerAddr: string, output: UTXO): boolean {
    let outAddrs = output.caddresses;
    if (!outAddrs) return false;
    return outAddrs.includes(ownerAddr);
}

/**
 * Returns the total amount of `assetID` in the given `utxos` owned by `address`. Checks for X/P addresses.
 * @param utxos UTXOs to calculate balance from.
 * @param addresses The wallet's  addresses.
 * @param assetID Only count outputs of this asset ID.
 * @param chainID Only count the outputs on this chain.
 * @param isStake Set to `true` if looking for staking utxos.
 */
function getAssetBalanceFromUTXOs(
    utxos: UTXO[],
    addresses: string[],
    assetID: string,
    chainID: string,
    isStake = false
) {
    let myOuts = utxos.filter((utxo) => {
        if (
            assetID === utxo.assetID &&
            isOutputOwner(addresses, utxo) &&
            chainID === utxo.chainID &&
            utxo.stake === isStake
        ) {
            return true;
        }
        return false;
    });

    let tot = myOuts.reduce((acc, utxo) => {
        return acc.add(new BN(utxo.amount));
    }, new BN(0));

    return tot;
}

function getNFTBalanceFromUTXOs(utxos: UTXO[], addresses: string[], assetID: string): iHistoryNftFamilyBalance {
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

        if (res[groupID]) {
            res[groupID].amount++;
        } else {
            res[groupID] = {
                payload: utxo.payload || '',
                amount: 1,
            };
        }
    }
    return res;
}

/**
 * Returns the total amount of `assetID` in the given `utxos` owned by `address`. Checks for EVM address.
 * @param utxos UTXOs to calculate balance from.
 * @param address The wallet's  evm address `0x...`.
 * @param assetID Only count outputs of this asset ID.
 * @param chainID Only count the outputs on this chain.
 * @param isStake Set to `true` if looking for staking utxos.
 */
function getEvmAssetBalanceFromUTXOs(
    utxos: UTXO[],
    address: string,
    assetID: string,
    chainID: string,
    isStake = false
) {
    let myOuts = utxos.filter((utxo) => {
        if (
            assetID === utxo.assetID &&
            isOutputOwnerC(address, utxo) &&
            chainID === utxo.chainID &&
            utxo.stake === isStake
        ) {
            return true;
        }
        return false;
    });

    let tot = myOuts.reduce((acc, utxo) => {
        return acc.add(new BN(utxo.amount));
    }, new BN(0));

    return tot;
}

function getImportSummary(tx: ITransactionData, addresses: string[]): iHistoryImport {
    let sourceChain = findSourceChain(tx);
    let chainAliasFrom = idToChainAlias(sourceChain);
    let chainAliasTo = idToChainAlias(tx.chainID);

    let avaxID = activeNetwork.avaxID;

    let outs = tx.outputs || [];
    let amtOut = getAssetBalanceFromUTXOs(outs, addresses, avaxID, tx.chainID);

    let time = new Date(tx.timestamp);
    let fee = xChain.getTxFee();

    let res: iHistoryImport = {
        id: tx.id,
        memo: parseMemo(tx.memo),
        source: chainAliasFrom,
        destination: chainAliasTo,
        amount: amtOut,
        amountClean: bnToAvaxX(amtOut),
        timestamp: time,
        type: tx.type,
        fee: fee,
    };

    return res;
}

function getExportSummary(tx: ITransactionData, addresses: string[]): iHistoryExport {
    let inputs = tx.inputs;
    let sourceChain = inputs[0].output.chainID;
    let chainAliasFrom = idToChainAlias(sourceChain);

    let destinationChain = findDestinationChain(tx);
    let chainAliasTo = idToChainAlias(destinationChain);

    let avaxID = activeNetwork.avaxID;

    let outs = tx.outputs || [];
    let amtOut = getAssetBalanceFromUTXOs(outs, addresses, avaxID, destinationChain);
    // let amtIn = getAssetBalanceFromUTXOs(inUtxos, addresses, avaxID);

    let time = new Date(tx.timestamp);
    let fee = xChain.getTxFee();

    let res: iHistoryExport = {
        id: tx.id,
        memo: parseMemo(tx.memo),
        source: chainAliasFrom,
        destination: chainAliasTo,
        amount: amtOut,
        amountClean: bnToAvaxX(amtOut),
        timestamp: time,
        type: tx.type,
        fee: fee,
    };

    return res;
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
        type: tx.type,
        fee: new BN(0),
        amount: stakeAmt,
        amountClean: bnToAvaxP(stakeAmt),
        memo: parseMemo(tx.memo),
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

    let res: iHistoryImport = {
        id: tx.id,
        source: chainAliasFrom,
        destination: chainAliasTo,
        amount: amtOut,
        amountClean: bnToAvaxX(amtOut),
        timestamp: time,
        type: tx.type,
        fee: fee,
        memo: parseMemo(tx.memo),
    };

    return res;
}

async function getBaseTxSummary(tx: ITransactionData, ownerAddrs: string[]): Promise<iHistoryBaseTx> {
    console.log('Base tx');
    console.log(tx);

    // Calculate losses from inputs
    let losses = getBaseTxTokenLosses(tx, ownerAddrs);
    let lossesNFT = getBaseTxNFTLosses(tx, ownerAddrs);

    // Calculate gains from inputs
    let gains = getBaseTxTokenGains(tx, ownerAddrs);
    let gainsNFT = getBaseTxNFTGains(tx, ownerAddrs);

    let received: iHistoryBaseTxTokensReceived = {};
    let receivedNFTs: iHistoryBaseTxNFTsReceived = {};

    // Process Received Tokens
    for (let assetID in gains) {
        let fromAddrs = getBaseTxSenders(tx, assetID);
        let tokenDesc = await Assets.getAssetDescription(assetID);
        let amtBN = gains[assetID];
        received[assetID] = {
            amount: amtBN,
            amountClean: bnToLocaleString(amtBN, tokenDesc.denomination),
            from: fromAddrs,
            token: tokenDesc,
        };
    }

    // Process Received NFTs
    for (let assetID in gainsNFT) {
        let fromAddrs = getBaseTxSenders(tx, assetID);
        let tokenDesc = await Assets.getAssetDescription(assetID);
        let groups = gainsNFT[assetID];
        receivedNFTs[assetID] = {
            groups: groups,
            from: fromAddrs,
            token: tokenDesc,
        };
    }

    // Process Sent Tokens
    let sent: iHistoryBaseTxTokensSent = {};
    let sentNFTs: iHistoryBaseTxNFTsSent = {};

    // Process sent tokens
    for (let assetID in losses) {
        let toAddrs = getBaseTxReceivers(tx, assetID);
        let tokenDesc = await Assets.getAssetDescription(assetID);
        let amtBN = losses[assetID];

        sent[assetID] = {
            amount: amtBN,
            amountClean: bnToLocaleString(amtBN, tokenDesc.denomination),
            to: toAddrs,
            token: tokenDesc,
        };
    }

    // Process Received NFTs
    for (let assetID in lossesNFT) {
        let fromAddrs = getBaseTxSenders(tx, assetID);
        let tokenDesc = await Assets.getAssetDescription(assetID);
        let groups = lossesNFT[assetID];
        sentNFTs[assetID] = {
            groups: groups,
            to: fromAddrs,
            token: tokenDesc,
        };
    }

    return {
        id: tx.id,
        fee: xChain.getTxFee(),
        type: tx.type,
        timestamp: new Date(tx.timestamp),
        memo: parseMemo(tx.memo),
        tokens: {
            sent,
            received,
        },
        nfts: {
            sent: sentNFTs,
            received: receivedNFTs,
        },
    };
}

function getBaseTxNFTLosses(tx: ITransactionData, ownerAddrs: string[]): iHistoryBaseTxNFTsSentRaw {
    let inUTXOs = tx.inputs.map((input) => input.output);
    let nftUTXOs = inUTXOs.filter((utxo) => {
        return utxo.outputType === AVMConstants.NFTXFEROUTPUTID;
    });

    let res: iHistoryBaseTxNFTsSentRaw = {};
    for (let assetID in tx.inputTotals) {
        let nftBal = getNFTBalanceFromUTXOs(nftUTXOs, ownerAddrs, assetID);

        // If empty dictionary pass
        if (Object.keys(nftBal).length === 0) continue;

        res[assetID] = nftBal;
    }
    return res;
}

function getBaseTxNFTGains(tx: ITransactionData, ownerAddrs: string[]): iHistoryBaseTxNFTsReceivedRaw {
    let outs = tx.outputs || [];
    let nftUTXOs = outs.filter((utxo) => {
        return utxo.outputType === AVMConstants.NFTXFEROUTPUTID;
    });
    let res: iHistoryBaseTxNFTsReceivedRaw = {};

    for (let assetID in tx.inputTotals) {
        let nftBal = getNFTBalanceFromUTXOs(nftUTXOs, ownerAddrs, assetID);
        // If empty dictionary pass
        if (Object.keys(nftBal).length === 0) continue;

        res[assetID] = nftBal;
    }
    return res;
}

function getBaseTxTokenLosses(tx: ITransactionData, ownerAddrs: string[]): iHistoryBaseTxTokensSentRaw {
    let inUTXOs = tx.inputs.map((input) => input.output);
    let tokenUTXOs = inUTXOs.filter((utxo) => {
        return utxo.outputType === AVMConstants.SECPXFEROUTPUTID;
    });

    let chainID = xChain.getBlockchainID();
    let res: any = {};
    for (let assetID in tx.inputTotals) {
        let bal = getAssetBalanceFromUTXOs(tokenUTXOs, ownerAddrs, assetID, chainID);
        if (bal.isZero()) continue;
        res[assetID] = bal;
    }
    return res;
}

function getBaseTxTokenGains(tx: ITransactionData, ownerAddrs: string[]): iHistoryBaseTxTokensReceivedRaw {
    let chainID = xChain.getBlockchainID();
    let outs = tx.outputs || [];
    let tokenUTXOs = outs.filter((utxo) => {
        return utxo.outputType === AVMConstants.SECPXFEROUTPUTID;
    });

    let res: any = {};
    for (let assetID in tx.outputTotals) {
        let bal = getAssetBalanceFromUTXOs(tokenUTXOs, ownerAddrs, assetID, chainID);
        if (bal.isZero()) continue;
        res[assetID] = bal;
    }
    return res;
}

// Look at the inputs and check where the assetID came from.
function getBaseTxSenders(tx: ITransactionData, assetID: string): string[] {
    let inUTXOs = tx.inputs.map((input) => input.output);
    let res: string[] = [];
    for (let i = 0; i < inUTXOs.length; i++) {
        let utxo = inUTXOs[i];
        if (utxo.assetID === assetID && utxo.addresses) {
            res.push(...utxo.addresses);
        }
    }
    // Eliminate Duplicates
    return res.filter((addr, i) => {
        return res.indexOf(addr) === i;
    });
}

// Look at the inputs and check where the assetID came from.
function getBaseTxReceivers(tx: ITransactionData, assetID: string): string[] {
    let res: string[] = [];
    let outs = tx.outputs || [];
    for (let i = 0; i < outs.length; i++) {
        let utxo = outs[i];
        if (utxo.assetID === assetID && utxo.addresses) {
            res.push(...utxo.addresses);
        }
    }
    // Eliminate Duplicates
    return res.filter((addr, i) => {
        return res.indexOf(addr) === i;
    });
}

function parseMemo(raw: string): string {
    const memoText = new Buffer(raw, 'base64').toString('utf8');

    // Bug that sets memo to empty string (AAAAAA==) for some
    // tx types
    if (!memoText.length || raw === 'AAAAAA==') return '';
    return memoText;
}
