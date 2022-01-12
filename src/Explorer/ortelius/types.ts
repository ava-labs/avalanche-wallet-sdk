/**
 * Data coming from explorer for C chain
 */
export interface OrteliusEvmTx {
    block: string;
    hash: string;
    createdAt: string;
    nonce: number;
    gasPrice: string;
    gasLimit: number;
    blockGasUsed: number;
    blockGasLimit: number;
    blockNonce: number;
    blockHash: string;
    recipient: string;
    value: string;
    toAddr: string;
    fromAddr: string;
    input?: string;
    v: string;
    r: string;
    s: string;
    traces: [
        {
            callType: string;
            to: string;
            from: string;
            type: string;
            gasUsed: string;
            gas: string;
            value: string;
        }
    ];
}

/**
 * Data coming from the explorer for X,P chain
 */
export interface OrteliusAvalancheTx {
    chainID: string;
    id: string;
    inputTotals: {
        [key: string]: string;
    };
    inputs: OrteliusTxInput[] | null;
    memo: string;
    outputTotals: {
        [key: string]: string;
    };
    outputs: OrteliusUTXO[] | null;

    reusedAddressTotals: null;
    rewarded: boolean;
    rewardedTime: string;
    timestamp: string;
    txFee: number;
    type: OrteliusTransactionType;
    validatorStart: number;
    validatorEnd: number;
    validatorNodeID: string;
}

interface OrteliusTxInput {
    credentials: OrteliusTxCredential[];
    output: OrteliusUTXO;
}

interface OrteliusTxCredential {
    address: string;
    public_key: string;
    signature: string;
}

export interface OrteliusUTXO {
    addresses: string[] | null;
    caddresses?: string[];
    amount: string;
    assetID: string;
    chainID: string;
    groupID: number;
    id: string;
    locktime: number;
    payload?: string;
    outputIndex: number;
    outputType: number;
    redeemingTransactionID: string;
    stake?: boolean;
    inChainID: string;
    outChainID: string;
    threshold: number;
    timestamp: string;
    transactionID: string;
    rewardUtxo: boolean;
}

export type OrteliusTransactionType =
    | 'base'
    | 'create_asset'
    | 'operation'
    | 'import'
    | 'export'
    | 'add_validator'
    | 'add_subnet_validator'
    | 'add_delegator'
    | 'create_chain'
    | 'create_subnet'
    | 'pvm_import'
    | 'pvm_export'
    | 'atomic_import_tx' // for c chain imports?
    | 'atomic_export_tx' // for c chain exports?
    | 'advance_time'
    | 'reward_validator';
