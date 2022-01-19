// HD WALLET
// m / purpose' / coin_type' / account' / change / address_index

export const AVAX_TOKEN_INDEX: string = '9000';
export const AVAX_TOKEN_PATH = `m/44'/${AVAX_TOKEN_INDEX}'`;
export const AVAX_ACCOUNT_PATH: string = `m/44'/${AVAX_TOKEN_INDEX}'/0'`; // Change and index left out
export const ETH_ACCOUNT_PATH: string = `m/44'/60'/0'`;
export const LEDGER_ETH_ACCOUNT_PATH = ETH_ACCOUNT_PATH + '/0/0';

export const HD_SCAN_GAP_SIZE: number = 20; // a gap of at least 20 indexes is needed to claim an index unused
export const SCAN_SIZE: number = 70; // the total number of utxos to look at initially to calculate last index
export const HD_SCAN_LOOK_UP_WINDOW: number = 64; // Number of addresses to check with the explorer at a single call
export const SCAN_RANGE: number = SCAN_SIZE - HD_SCAN_GAP_SIZE; // How many items are actually scanned

export const LEDGER_EXCHANGE_TIMEOUT = 90_000;
export const MIN_EVM_SUPPORT_V = '0.5.3';
/**
 * In order to free the thread when deriving addresses, the execution will sleep every N address derived
 */
export const DERIVATION_SLEEP_INTERVAL = 200;
