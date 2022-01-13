import { activeNetwork, web3 } from '@/Network/network';
import ERC20Abi from '@openzeppelin/contracts/build/contracts/ERC20.json';
import { Erc20TokenData } from '@/Asset/types';
import { NO_NETWORK } from '@/errors';
import { BN } from 'avalanche';
import { Contract } from 'web3-eth-contract';
import xss from 'xss';
export class Erc20Token {
    contract: Contract;
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    chainId: number;
    data: Erc20TokenData;

    constructor(data: Erc20TokenData) {
        this.name = xss(data.name);
        this.symbol = xss(data.symbol);
        this.address = data.address;
        this.decimals = data.decimals;
        this.chainId = data.chainId;
        this.data = data;

        //@ts-ignore
        this.contract = new web3.eth.Contract(ERC20Abi.abi, data.address);
    }

    toData(): Erc20TokenData {
        return this.data;
    }

    static async getData(address: string): Promise<Erc20TokenData> {
        //@ts-ignore
        let contract = new web3.eth.Contract(ERC20Abi.abi, address);

        let contractCalls = await Promise.all([
            contract.methods.name().call(),
            contract.methods.symbol().call(),
            contract.methods.decimals().call(),
        ]);
        // Purify the values for XSS protection
        let name = xss(contractCalls[0]);
        let symbol = xss(contractCalls[1]);
        let decimals = parseInt(contractCalls[2]);

        if (!activeNetwork) {
            throw NO_NETWORK;
        }

        return {
            name,
            symbol,
            decimals,
            address,
            chainId: activeNetwork.evmChainID,
        };
    }

    async balanceOf(address: string): Promise<BN> {
        let bal = await this.contract.methods.balanceOf(address).call();
        return new BN(bal);
    }
}
