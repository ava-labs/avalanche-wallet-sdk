export type SnowtraceTx = SnowtraceNormalTx | SnowtraceErc20Tx;

export interface SnowtraceErc20Tx {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    from: string;
    contractAddress: string;
    to: string;
    value: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    transactionIndex: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    input: string;
    confirmations: string;
}

export interface SnowtraceNormalTx {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    transactionIndex: string;
    from: string;
    to: string;
    value: string;
    gas: string;
    gasPrice: string;
    isError: string;
    txreceipt_status: string;
    input: string;
    contractAddress: string;
    cumulativeGasUsed: string;
    gasUsed: string;
    confirmations: string;
}

/**
 * Type guard for SnowtraceErc20Tx
 * @param tx
 */
export function isSnowtraceErc20Tx(tx: SnowtraceNormalTx | SnowtraceErc20Tx): tx is SnowtraceErc20Tx {
    return tx.hasOwnProperty('tokenName');
}

/**
 * Type guard for SnowtraceNormalTx
 * @param tx
 */
export function isSnowtraceNormalTx(tx: SnowtraceNormalTx | SnowtraceErc20Tx): tx is SnowtraceNormalTx {
    return !tx.hasOwnProperty('tokenName');
}

export interface SnowtraceResponse<ResponseType> {
    status: string;
    message: string;
    result: ResponseType[];
}
