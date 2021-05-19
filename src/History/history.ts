import { iHistoryAddDelegator, iHistoryExport, iHistoryImport, ITransactionData, UTXO } from '@/History/types';
import { activeNetwork, avalanche, explorer_api, xChain } from '@/Network/network';
import { BN } from 'avalanche';
import { ChainIdType } from '@/types';
import { AVMConstants } from 'avalanche/dist/apis/avm';
import { bnToAvaxP, bnToAvaxX } from '@/utils/utils';

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
): Promise<any> {
    let sum;
    let addrsXP = walletAddrs;

    let cleanAddressesXP = walletAddrs.map((addr) => addr.split('-')[1]);
    switch (tx.type) {
        case 'import':
        case 'pvm_import':
            sum = getImportSummary(tx, cleanAddressesXP);
            break;
        case 'export':
        case 'pvm_export':
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
    let outs = tx.outputs;

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

// function getInputAssetBalance(tx: ITransactionData, addresses: string[], assetID: string){
//     let utxos = tx.inputs.map(input => input.output)
//     return getAssetBalanceFromUTXOs(utxos, addresses, assetID)
// }

function getImportSummary(tx: ITransactionData, addresses: string[]): any {
    let sourceChain = findSourceChain(tx);
    let chainAliasFrom = idToChainAlias(sourceChain);
    let chainAliasTo = idToChainAlias(tx.chainID);

    // console.log('import from: ', chainAliasFrom);
    // console.log('import to: ', chainAliasTo);
    //
    // console.log(tx);
    let avaxID = activeNetwork.avaxID;

    let inUtxos = tx.inputs.map((input) => input.output);

    let amtOut = getAssetBalanceFromUTXOs(tx.outputs, addresses, avaxID, tx.chainID);
    // let amtIn = getAssetBalanceFromUTXOs(inUtxos, addresses, avaxID, chainAliasFrom);

    // console.log(`${bnToAvaxX(amtIn)} -> ${bnToAvaxX(amtOut)}`);

    // let amtAbs = amtIn.sub(amtOut);

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
    };

    // console.log(res);
    return res;
}
function getExportSummary(tx: ITransactionData, addresses: string[]): any {
    let inputs = tx.inputs;
    let sourceChain = inputs[0].output.chainID;
    let chainAliasFrom = idToChainAlias(sourceChain);

    let outs = tx.outputs;
    let destinationChain = findDestinationChain(tx);
    let chainAliasTo = idToChainAlias(destinationChain);

    // console.log('export from:', chainAliasFrom);
    // console.log('export to:', chainAliasTo);
    //
    // console.log(tx);
    let avaxID = activeNetwork.avaxID;
    let inUtxos = tx.inputs.map((input) => input.output);

    let amtOut = getAssetBalanceFromUTXOs(tx.outputs, addresses, avaxID, destinationChain);
    // let amtIn = getAssetBalanceFromUTXOs(inUtxos, addresses, avaxID);

    let time = new Date(tx.timestamp);
    let fee = xChain.getTxFee();

    // let amtExported = amtIn.sub(amtOut);

    let res: iHistoryExport = {
        id: tx.id,
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
    console.log('VALIDATOR');
    console.log(tx);

    let time = new Date(tx.timestamp);

    let pChainID = activeNetwork.pChainID;
    let avaxID = activeNetwork.avaxID;
    let stakeAmt = getAssetBalanceFromUTXOs(tx.outputs, ownerAddrs, avaxID, pChainID, true);

    return {
        id: tx.id,
        source: 'P',
        destination: 'P',
        nodeID: tx.validatorNodeID,
        stakeStart: new Date(tx.validatorStart * 1000),
        stakeEnd: new Date(tx.validatorEnd * 1000),
        timestamp: time,
        type: tx.type,
        fee: new BN(0),
        amount: stakeAmt,
        amountClean: bnToAvaxP(stakeAmt),
    };
}

// Returns the summary for a C chain import TX
function getImportSummaryC(tx: ITransactionData, ownerAddr: string) {
    console.log('C IMPORT');
    console.log(tx);
    console.log(ownerAddr);
}
