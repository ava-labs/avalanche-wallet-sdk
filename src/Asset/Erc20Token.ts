import { activeNetwork, web3 } from '@/Network/network';
import ERC20Abi from '@openzeppelin/contracts/build/contracts/ERC20.json';
import { Erc20TokenData } from '@/Asset/types';
import { NO_NETWORK } from '@/errors';
import { BN } from 'avalanche';

export default class Erc20Token {
    contract: any;
    address: any;
    name: string;
    symbol: string;
    decimals: number;
    chainId: number;

    constructor(data: Erc20TokenData) {
        this.name = data.name;
        this.symbol = data.symbol;
        this.address = data.address;
        this.decimals = data.decimals;
        this.chainId = data.chainId;

        //@ts-ignore
        this.contract = new web3.eth.Contract(ERC20Abi.abi, data.address);
    }

    static async getData(address: string): Promise<Erc20TokenData> {
        //@ts-ignore
        let contract = new web3.eth.Contract(ERC20Abi.abi, address);

        let name = await contract.methods.name().call();
        let symbol = await contract.methods.symbol().call();
        let decimals = await contract.methods.decimals().call();

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
