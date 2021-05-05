// HD WALLET
// Accounts are not used and the account index is fixed to 0
// m / purpose' / coin_type' / account' / change / address_index

export const AVAX_TOKEN_INDEX: string = '9000';
export const AVAX_ACCOUNT_PATH: string = `m/44'/${AVAX_TOKEN_INDEX}'/0'`; // Change and index left out
export const ETH_ACCOUNT_PATH: string = `m/44'/60'/0'`;
export const LEDGER_ETH_ACCOUNT_PATH = ETH_ACCOUNT_PATH + '/0/0';
