import {
    getTransactionSummary,
    iHistoryImportExport,
    iHistoryBaseTx,
    iHistoryStaking,
    isHistoryImportExportTx,
} from '@/History';
import { ImportTransaction, ImportTx1 } from './import_dumps';
import { ExportTx, ExportTx1, ExportTx2, ExportTx3 } from './export_dumps';
import { BaseTx, BaseTx1, BaseTx2, BaseTxSend0, BaseTxSend1, BaseTxSend2 } from './base_tx_dumps';
import { StakeTx0, StakeTx1, StakeTx2, StakeTx3 } from './staking_dumps';
import { OrteliusAvalancheTx } from '@/Explorer/ortelius/types';

jest.mock('@/Network/setNetwork', () => {
    return {
        setNetwork: jest.fn(),
    };
});

jest.mock('@/Network/utils', () => {
    return {
        getAvaxAssetID: jest.fn().mockImplementation(() => {
            return 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK';
        }),
    };
});

jest.mock('@/Network/helpers/aliasFromNetworkID', () => {
    return {
        idToChainAlias: jest.fn().mockImplementation((id: string) => {
            switch (id) {
                case '2JVSBoinj9C2J33VntvzYtVJNZdN2NKiwwKjcumHUWEb5DbBrm':
                    return 'X';
                case '11111111111111111111111111111111LpoYY':
                    return 'P';
                case 'yH8D7ThNJkxmtkuv2jgBa4P1Rn3Qpr4pPr7QYNfcdoS6k6HWp':
                    return 'C';
            }
            throw new Error('Unknown chain id.');
        }),
    };
});

jest.mock('@/Asset/Assets', () => {
    return {
        getAssetDescription: jest.fn().mockImplementation((id: string) => {
            switch (id) {
                // AVAX
                case 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK':
                    return {
                        assetID: 'U8iRqJoiJm8xZHAacmvYyZVwqQx6uDNtQeP3CQ6fcgQk3JqnK',
                        name: 'Avalanche',
                        symbol: 'AVAX',
                        denomination: 9,
                    };
                case 'wxTqKYimwaGNsvnk7WBRq3FyattSuYfoWwrwXvHsEw7QnHhjK':
                    return {
                        assetID: 'wxTqKYimwaGNsvnk7WBRq3FyattSuYfoWwrwXvHsEw7QnHhjK',
                        name: 'Wrapped Ethereum XETH',
                        symbol: 'XETH',
                        denomination: 9,
                    };
                case '6h9wgJto7fTCPSbbMxcaSb47pJUQmELiNfB6iAJGHDng93m8t':
                    return {
                        assetID: '6h9wgJto7fTCPSbbMxcaSb47pJUQmELiNfB6iAJGHDng93m8t',
                        name: 'Wrapped Bitcoin XBTC',
                        symbol: 'XBTC',
                        denomination: 8,
                    };
                case 'LqfL9CxJxSkKS5Ci2zWxs76i3mVYaeUDvwJgxAenVjXYkhZ9W':
                    return {
                        assetID: 'LqfL9CxJxSkKS5Ci2zWxs76i3mVYaeUDvwJgxAenVjXYkhZ9W',
                        name: 'Wrapped Bitcoin',
                        symbol: 'WBTC',
                        denomination: 8,
                    };
            }

            throw new Error('Unknown asset id.');
        }),
    };
});

describe('Import Tx', () => {
    it('single utxo import, all belong to wallet. P to X', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(ImportTransaction);
        const myAddresses = ['X-fuji1nqz4gndscpdp6yr326sz0afdlylcj0g6mf0q46'];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = await getTransactionSummary(data, myAddresses, cAddr);

        if (isHistoryImportExportTx(summary)) {
            expect(summary.id).toEqual('2KL4TfCKyHYMxGfWSZkXpurYiDzwk9sASAH47RMikk53cZNNuY');
            expect(summary.type).toEqual('import');
            expect(summary.source).toEqual('P');
            expect(summary.destination).toEqual('X');
            expect(summary.fee.toString()).toEqual('1000000');
            expect(summary.amount.toString()).toEqual('10000000000000');
        } else {
            throw new Error('Type guard failed.');
        }
    });

    it('multiple import utxos, P to X', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(ImportTx1);
        const myAddresses = [
            'X-fuji1mj2x9eecn68weljg3tfaszem6hfx8yyq2kve2a',
            'X-fuji16spahfywxkm2jw0nmag8wdaymg76cccw3hpr5g',
            'X-fuji170mcu46k2rctpzrpe5vgk6nchhzfxt40kgcd2s',
            'X-fuji1kh2tklylfqg3fg2audd53kf2zdnrhamcac0hjk',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryImportExport;

        expect(summary.id).toEqual('Gnvid4y5ZMW3FFW4r46i9F9tGW81p3q3c4WL6sy3223fRXbM3');
        expect(summary.type).toEqual('import');
        expect(summary.source).toEqual('P');
        expect(summary.destination).toEqual('X');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.amount.toString()).toEqual('3002000000');
    });
});

describe('Export Tx', () => {
    it('multiple utxo export to C chain, all belong to wallet', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(ExportTx);
        const myAddresses = [
            'X-fuji1y7704g80palshkd97sz67ggjmvmd55y8mpalrk',
            'C-fuji1wukmzzjqn5hwsp4uaswc4c53gc0xz5asvxcujf',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryImportExport;

        expect(summary.id).toEqual('sgX4P3HuZnNYZvaQFTrhCM1CUjDyzhJeDEhsMVi4JZ1YPjkJn');
        expect(summary.type).toEqual('export');
        expect(summary.source).toEqual('X');
        expect(summary.destination).toEqual('C');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.amount.toString()).toEqual('10000001000000');
    });

    it('multiple utxos, P to X, with change utxo', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(ExportTx1);
        const myAddresses = [
            'X-fuji15l87xul3ewrevmkcstyn3sed8nxf2y38sjau75',
            'P-fuji1kh5aznz5axhew258mjulrx3ne6t2qudnewqfen',
            'P-fuji1ur873jhz9qnaqv5qthk5sn3e8nj3e0kmafyxut',
            'P-fuji1up8efmcantt63mwkvfe888qegxdpepfu6dpr9p',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryImportExport;

        expect(summary.id).toEqual('2m1z8gQoJfUcRHdrRTAJxnqZ1M1WiavFhvYUjjkUceywVt2mNW');
        expect(summary.type).toEqual('export');
        expect(summary.source).toEqual('P');
        expect(summary.destination).toEqual('X');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.amount.toString()).toEqual('9201000000');
    });

    it('single utxo, X to C', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(ExportTx2);
        const myAddresses = [
            'X-fuji1zenmzsrswjd6fd2f5a76c5gkzhnrwfxezemkgz',
            'C-fuji138lyu5lw7uln54lnjec25e9wacm8q6xw752zyr',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryImportExport;

        expect(summary.id).toEqual('2Ruvbqg9F4T5yv4gC4Y4FU6zecETbmHHqfNUFDv1JU5cqCzDqh');
        expect(summary.type).toEqual('export');
        expect(summary.source).toEqual('X');
        expect(summary.destination).toEqual('C');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.amount.toString()).toEqual('1000000000');
    });

    it('export C to X, single utxo', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(ExportTx3);
        const myAddresses = ['X-fuji1mnnsf9zftcud4cky8f2ctxaapnr9hfchnw9zjv'];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryImportExport;

        expect(summary.id).toEqual('iKVmtwcNSHtJxXzMNsiDZEsJKh6eB63fzkkTBH6e4nVetYQgn');
        expect(summary.type).toEqual('export');
        expect(summary.source).toEqual('C');
        expect(summary.destination).toEqual('X');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.amount.toString()).toEqual('2001000000');
    });
});

describe('Base Transaction Receive', () => {
    it('Simple receive AVAX, faucet drip', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(BaseTx);
        const myAddresses = ['X-fuji1ur873jhz9qnaqv5qthk5sn3e8nj3e0kmafyxut'];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryBaseTx;

        expect(summary.id).toEqual('2u6YndP8MRPtrk1AaVS1JoN9iEBuQxZoHxufk6vSz2bni6nxow');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.type).toEqual('transaction');
        expect(summary.tokens.length).toEqual(1);
        // expect(summary.tokens[0].isSent).toEqual(false)
        expect(summary.tokens[0].amount.toString()).toEqual('2000000000');
        expect(summary.tokens[0].amountDisplayValue).toEqual('2');
        expect(summary.tokens[0].addresses).toEqual(['fuji1xpmx0ljrpvqexrvrj26fnggvr0ax9wm32gaxmx']);
    });

    it('Receive single ANT token', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(BaseTx1);
        const myAddresses = ['X-fuji1j4l8kt4jpcnua00m09uv4tssjwj5efv02lm04h'];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryBaseTx;

        expect(summary.id).toEqual('evrKDCGkkxVFBhA2u7eL1h91EpjePfW2ynQigSThjSoD9Q2CC');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.type).toEqual('transaction');
        expect(summary.tokens.length).toEqual(1);
        // expect(summary.tokens[0].isSent).toEqual(false)
        expect(summary.tokens[0].amount.toString()).toEqual('10000000');
        expect(summary.tokens[0].amountDisplayValue).toEqual('0.01');
        expect(summary.tokens[0].addresses).toEqual(['fuji1jq7trjflynjghlc8fv4hktn0f3y4u23shy4cwg']);
    });

    it('Receive 2 ANT tokens', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(BaseTx2);
        const myAddresses = ['X-fuji1qrpc4fdyupsc3jqytxdecw44skuggr4qq2vlpn'];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryBaseTx;

        expect(summary.id).toEqual('s27VDftrJ1zq5oit9yqPqcxkPY5hvvCmpDQmU6usGLdjGAqo5');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.type).toEqual('transaction');
        expect(summary.tokens.length).toEqual(2);
        // For asset 1
        // expect(summary.tokens[0].isSent).toEqual(false)
        expect(summary.tokens[0].amount.toString()).toEqual('1');
        expect(summary.tokens[0].amountDisplayValue).toEqual('0.00000001');
        expect(summary.tokens[0].addresses).toEqual(['fuji1gzyk29gqdq95muwlfkllg5ncdwjafrg9att3gp']);
        // For asset 2
        // expect(summary.tokens[1].isSent).toEqual(false)
        expect(summary.tokens[1].amount.toString()).toEqual('10100000');
        expect(summary.tokens[1].amountDisplayValue).toEqual('0.0101');
        expect(summary.tokens[1].addresses).toEqual(['fuji1gzyk29gqdq95muwlfkllg5ncdwjafrg9att3gp']);
    });
});

describe('Base Transaction Send', () => {
    it('Simple send AVAX', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(BaseTxSend0);
        const myAddresses = ['X-fuji1euwa0uxz7fcm8edj5fy490fvdj6e3s2mnmxh6p'];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryBaseTx;

        expect(summary.id).toEqual('2Ac5CkA7AMYQ8JQve4Wcczppn17LSqfftjLwqxbdNpJiKHXDT2');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.type).toEqual('transaction');
        expect(summary.tokens.length).toEqual(1);
        expect(summary.tokens[0].amount.toString()).toEqual('-1000000000');
        expect(summary.tokens[0].amountDisplayValue).toEqual('-1');
        expect(summary.tokens[0].addresses).toEqual(['fuji1n8vmuvxudfkr7u6vy307jlyuk84nke0nr769zd']);
    });

    it('Send 1000 AVAX', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(BaseTxSend1);
        const myAddresses = [
            'X-fuji1ysxw3923qapq43pukde9vud4wn84exyzdqletm',
            'X-fuji1lcx7plqaajp6730hh7pvyk9l3urjm6auxc3fx5',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryBaseTx;

        expect(summary.id).toEqual('UGWnqJQqeyZXEYthEeRgcwVrvMLyPgN6uxMY2cE3eU1YQy6ie');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.type).toEqual('transaction');
        expect(summary.memo).toEqual('here you go!');
        expect(summary.tokens.length).toEqual(1);
        expect(summary.tokens[0].amount.toString()).toEqual('-1000000000000');
        expect(summary.tokens[0].amountDisplayValue).toEqual('-1,000');
        expect(summary.tokens[0].addresses).toEqual(['fuji17mqelzf3w2l64pmqpxr84na9wmkknn3p3yf0kk']);
    });

    it('Send 2 ANTs', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(BaseTxSend2);
        const myAddresses = [
            'X-fuji1lcx7plqaajp6730hh7pvyk9l3urjm6auxc3fx5',
            'X-fuji1ysxw3923qapq43pukde9vud4wn84exyzdqletm',
            'X-fuji19p54jf6y50yn3e8c5lvuuwkumx3yjx762q6t6w',
            'X-fuji17g00lgxz4a0s8z5jn9t36pqapmrqnkn9f8hjh5',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryBaseTx;

        expect(summary.id).toEqual('ynz91L9CdEfQgeoBYXfNiGtWN8AXmgzXHXSRCUNsucd5he5fV');
        expect(summary.fee.toString()).toEqual('1000000');
        expect(summary.type).toEqual('transaction');
        expect(summary.tokens.length).toEqual(2);
        // Asset 1
        expect(summary.tokens[0].amount.toString()).toEqual('-1000');
        expect(summary.tokens[0].amountDisplayValue).toEqual('-0.00001');
        expect(summary.tokens[0].addresses).toEqual(['fuji1x2qdqnkq5tt2j23c3569zffula30h5e0qxklu6']);
        // Asset 2
        expect(summary.tokens[1].amount.toString()).toEqual('-1000000');
        expect(summary.tokens[1].amountDisplayValue).toEqual('-0.001');
        expect(summary.tokens[1].addresses).toEqual(['fuji1x2qdqnkq5tt2j23c3569zffula30h5e0qxklu6']);
    });
});

describe('Staking TX', () => {
    it('Add validator 100 AVAX, staking finished, not rewarded', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(StakeTx0);
        const myAddresses = [
            'P-fuji1ur873jhz9qnaqv5qthk5sn3e8nj3e0kmafyxut',
            'P-fuji1lzrmf3crp62ayj2kqwh9mzc5es9xv7q6cm00vl',
            'P-fuji1spfpak2gtw87jaex2hqgz842s4xfp2xrjxyrt2',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryStaking;

        expect(summary.type).toEqual('add_validator');
        expect(summary.isRewarded).toEqual(false);
        expect(summary.amount.toString()).toEqual('100000000000');
        expect(summary.amountDisplayValue).toEqual('100');
        expect(summary.rewardAmount?.toString()).toEqual(undefined);
        expect(summary.rewardAmountDisplayValue).toEqual(undefined);
    });

    it('Add delegator 100 AVAX, uses lockedstakeable UTXOs, stake finished, rewarded', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(StakeTx1);
        const myAddresses = [
            'P-fuji1ur873jhz9qnaqv5qthk5sn3e8nj3e0kmafyxut',
            'P-fuji1qhu9lz4aqtp0xzywxz8z42curluwm4y9yj2wgf',
            'P-fuji1w4fjr3ds5rne4d3jm9uhgjn75z2z42fk0k2p74',
            'P-fuji1afe8kypsetchzcz6fwlx2kdgaykevtru694ev8',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryStaking;

        expect(summary.type).toEqual('add_delegator');
        expect(summary.isRewarded).toEqual(true);
        expect(summary.amount.toString()).toEqual('100000000000');
        expect(summary.amountDisplayValue).toEqual('100');
        expect(summary.rewardAmount?.toString()).toEqual('555946308');
        expect(summary.rewardAmountDisplayValue).toEqual('0.555946308');
    });

    it('Fee received from delegator 0.000225438 AVAX', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(StakeTx2);
        const myAddresses = ['P-fuji1wvtapgjhf90p6hhsnvran54u9wy7gadkvy5j3p'];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryStaking;

        expect(summary.type).toEqual('delegation_fee');
        expect(summary.rewardAmount?.toString()).toEqual('225438');
        expect(summary.rewardAmountDisplayValue).toEqual('0.000225438');
    });

    it('Add validator, stake finished, rewarded', async () => {
        let data: OrteliusAvalancheTx = JSON.parse(StakeTx3);
        const myAddresses = [
            'P-fuji1lzrmf3crp62ayj2kqwh9mzc5es9xv7q6cm00vl',
            'P-fuji1ur873jhz9qnaqv5qthk5sn3e8nj3e0kmafyxut',
            'P-fuji16vhgs3grfegzt23uzp9sxy9r0jy4s8uts5zz5s',
        ];
        const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077';
        let summary = (await getTransactionSummary(data, myAddresses, cAddr)) as iHistoryStaking;

        expect(summary.type).toEqual('add_validator');
        expect(summary.amountDisplayValue).toEqual('250');
        expect(summary.isRewarded).toEqual(true);
        expect(summary.rewardAmount?.toString()).toEqual('4995764528');
        expect(summary.rewardAmountDisplayValue).toEqual('4.995764528');
    });
});

// describe('Operation Receive', ()=>{
//     it('Mint single NFT', async ()=>{
//         let data: ITransactionData = JSON.parse(OperationTx0)
//         const myAddresses = ['X-fuji13jva03qs5lrs32eye85nrwxrq86sjpynguzcgp','X-fuji1as66nrj7n7ckqwmsyfj955tn5spmemsl9rtze0', 'X-fuji1u25fmwqnsyt0qttwht6rfm7dgp8wlydtsyv3y7', 'X-fuji12puq6z9lptfjkh4q7d3y986kwx4gsagp3525t9']
//         const cAddr = '0x5f658A6d1928c39B286b48192FEA8d46D87AD077'
//         let summary = await getTransactionSummary(data,myAddresses,cAddr) as iHistoryBaseTx
//
//         console.log(summary)
//         expect(summary.id).toEqual('2gJbPfNaX4kWuSJSZwrKsJ3nB9NnAihWBKQy2mQda2GxA3iasJ')
//         expect(summary.fee.toString()).toEqual('1000000')
//         expect(summary.type).toEqual('transaction')
//         expect(summary.tokens.length).toEqual(0)
//         // expect(summary.tokens[0].isSent).toEqual(false)
//         // expect(summary.tokens[0].amount.toString()).toEqual('10000000')
//         // expect(summary.tokens[0].addresses).toEqual(['fuji1jq7trjflynjghlc8fv4hktn0f3y4u23shy4cwg'])
//     })
// })
