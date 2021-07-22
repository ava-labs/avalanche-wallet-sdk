# CHANGELOG

## v0.8.1

#### Added

`getAddressAtIndexExternalX`, `getAddressAtIndexInternalX`, `getAddressAtIndexExternalP` for HD Wallet types.

## v0.8.0

#### Notes

-   Init CHANGELOG

#### Added

-   Created universal helper functions and `UniversalNode` class
-   `sendCustomEvmTx`, `canHaveBalanceOnChain`, `getTransactionsForBalance` in wallet classes

#### Changed

-   `waitTxC` utils function uses getTx status to wait
-   Wallet AVM, EVM/C chain function now wait for confirmation and balance refresh before returning
-   Assets module `getContractData` renamed to `getContractDataErc20`

#### Removed

-   `updateBalanceERC20` from wallet instances
