# CHANGELOG

## v0.9.8

#### Added

-   Mnemonic Wallets can be initialized as different accounts
-   Network changes emit an event, wallets subscribe to these events
-   Wallet `destroy` method to clean memory

#### Changed

-   Switch to `isomorphic-dompurify`
-   History module rewritten and refactored.

## v0.9.7

#### Added

-   `Utils.stringToBN` convert string to BN directly

#### Changed

-   Max gas price increased to 1000 nAVAX

## v0.9.5

#### Added

-   GasHelper module with `getGasPrice` and `getAdjustedGasPrice`

## v0.9.1

#### Added

-   SDK Audit report
-   `UtxoHelper.evmGetAtomicUtxos` exported properly now

## v0.9.0

#### Added

-   Network configs now have the raw rpc endpoints
-   Token meta data is now cleaned for XSS attacks
-   `Network.setNetworkAsync` for connecting networks asynchronously, and checks conenction before connecting
-   `Network.getActiveNetworkConfig` to return the active connection
-   `getConfigFromUrl` returns a network config object from the base url
-   Wallet `issueUniversalTx` function for issuing universal transactions

#### Fixed

-   `validateAddress`

#### Changed

-   Network configs now have the RPC endpoint
-   Wallet `getStake` now returns the total amount staked, and the related outputs
-   Universal transaction now separate import and export txs.

## v0.8.3

#### Added

-   `hd_ready` event fired for HD wallets.

## v0.8.2

#### Changed

-   Minimum required node version is `>=15`. `crypto.subtle` support got added on this version.

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
