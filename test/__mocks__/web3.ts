/* Mock web3 as __tests__/__mocks__/web3.js */
// const web3 = jest.genMockFromModule('web3')

/* Mock web3-eth-contract */
let mockWeb3EthContract = function () {};
function __setMockContract(mock: jest.Mock) {
    mockWeb3EthContract = mock;
}

let blockNumber = 0;
function __setBlockNumber(number: any) {
    blockNumber = number;
}
let eth = {
    Contract: jest.fn().mockImplementation(() => mockWeb3EthContract),
    getBlockNumber: () => blockNumber,
};

let web3 = function (provider: any) {
    return {
        provider: provider,
        eth: eth,
    };
};
//@ts-ignore
web3.providers = {
    HttpProvider: function () {
        return {
            //@ts-ignore
            send: (payload: any, cb: any) => {
                cb(null, '{}');
            },
        };
    },
};
//@ts-ignore
web3.__setMockContract = __setMockContract;
//@ts-ignore
web3.__setBlockNumber = __setBlockNumber;

export default web3;
