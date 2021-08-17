import { createGraphForP, createGraphForX, UniversalTx } from '@/helpers/universal_tx_helper';
import { BN, utils } from 'avalanche';
import { AVMConstants } from 'avalanche/dist/apis/avm';
import { pChain, xChain } from '@/Network/network';

jest.mock('@/Network/network', () => {
    return {
        web3: {
            utils: {
                isAddress: jest.fn().mockReturnValue(true),
            },
        },
        pChain: {
            getTxFee: jest.fn(),
        },
        xChain: {
            getTxFee: jest.fn(),
        },
    };
});

const addrC = '0x6a23c16777a3A194b2773df90FEB8753A8e619Ee';
const addrP = 'P-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';
const addrX = 'X-avax19v8flm9qt2gv2tctztjjerlgs4k3vgjsfw8udh';

const FEE = new BN(1000000);

function compareSteps(steps: UniversalTx[], expected: UniversalTx[]) {
    expect(steps.length).toEqual(expected.length);

    for (let i = 0; i < steps.length; i++) {
        let step = steps[i];
        let exp = expected[i];
        expect(step).toEqual(exp);
    }
}

describe('Reduce parent balance of UniversalNode P', () => {
    beforeEach(() => {
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE);
        (xChain.getTxFee as jest.Mock).mockReturnValue(FEE);
    });

    it('all parents have balance of 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(1000000000);
        let balC = new BN(1000000000);

        let expected = new BN(2996000000);
        let startNode = createGraphForP(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('middle child empty', () => {
        let balP = new BN(1000000000);
        let balX = new BN(0);
        let balC = new BN(1000000000);

        let expected = new BN(1996000000);
        let startNode = createGraphForP(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('only top parent has balance', () => {
        let balP = new BN(0);
        let balX = new BN(0);
        let balC = new BN(1000000000);

        let expected = new BN(996000000);
        let startNode = createGraphForP(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('starting node has balance', () => {
        let balP = new BN(1000000000);
        let balX = new BN(0);
        let balC = new BN(0);

        let expected = new BN(1000000000);
        let startNode = createGraphForP(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });
});

describe('Reduce parent balance of UniversalNode X', () => {
    beforeEach(() => {
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE);
        (xChain.getTxFee as jest.Mock).mockReturnValue(FEE);
    });

    it('all nodes have balance of 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(1000000000);
        let balC = new BN(1000000000);

        let expected = new BN(2996000000);
        let startNode = createGraphForX(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('both parents have balance of 1 AVAX', () => {
        let balX = new BN(0);
        let balP = new BN(1000000000);
        let balC = new BN(1000000000);

        let expected = new BN(1996000000);
        let startNode = createGraphForX(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('one parent has balance of 1 AVAX', () => {
        let balX = new BN(0);
        let balP = new BN(1000000000);
        let balC = new BN(0);

        let expected = new BN(998000000);
        let startNode = createGraphForX(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('other parent has balance of 1 AVAX', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(1000000000);

        let expected = new BN(998000000);
        let startNode = createGraphForX(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('no balance', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(0);

        let expected = new BN(0);
        let startNode = createGraphForX(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('starting node has 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(0);
        let balC = new BN(0);

        let expected = new BN(1000000000);
        let startNode = createGraphForX(balX, balP, balC);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });
});

describe('Get transactions for balance on UniversalNode P', () => {
    beforeEach(() => {
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE);
        (xChain.getTxFee as jest.Mock).mockReturnValue(FEE);
    });

    it('node has enough balance, return empty array', () => {
        let balP = new BN(1000000000);
        let balX = new BN(0);
        let balC = new BN(0);

        let nodeP = createGraphForP(balX, balP, balC);
        let target = new BN(1000000000);

        let steps = nodeP.getStepsForTargetBalance(target);

        expect(steps.length).toEqual(0);
    });

    it('node needs balance from parent', () => {
        let balP = new BN(1000000000);
        let balX = new BN(2000000000);
        let balC = new BN(0);

        let nodeP = createGraphForP(balX, balP, balC);
        let target = new BN(2000000000);

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_x_p',
                amount: new BN(1000000000),
            },
            {
                action: 'import_x_p',
            },
        ];

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from top parent', () => {
        let balP = new BN(1000000000);
        let balX = new BN(0);
        let balC = new BN(2000000000);

        let nodeP = createGraphForP(balX, balP, balC);
        let target = new BN(2000000000);

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_c_x',
                amount: new BN(1002000000),
            },
            {
                action: 'import_c_x',
            },
            {
                action: 'export_x_p',
                amount: new BN(1000000000),
            },
            {
                action: 'import_x_p',
            },
        ];

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from both parents and self', () => {
        let balP = new BN(1000000000); // 1 AVAX
        let balX = new BN(500000000); // 0.5 AVAX
        let balC = new BN(2000000000); // 2 AVAX

        let nodeP = createGraphForP(balX, balP, balC);
        let target = new BN(2000000000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_c_x',
                amount: new BN(502000000),
            },
            {
                action: 'import_c_x',
            },
            {
                action: 'export_x_p',
                amount: new BN(1000000000),
            },
            {
                action: 'import_x_p',
            },
        ];

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from both parents', () => {
        let balP = new BN(0); // 0 AVAX
        let balX = new BN(1000000000); // 1 AVAX
        let balC = new BN(2000000000); // 2 AVAX

        let nodeP = createGraphForP(balX, balP, balC);
        let target = new BN(2000000000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_c_x',
                amount: new BN(1002000000),
            },
            {
                action: 'import_c_x',
            },
            {
                action: 'export_x_p',
                amount: new BN(2000000000),
            },
            {
                action: 'import_x_p',
            },
        ];

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });
});

describe('Get transactions for balance on UniversalNode X', () => {
    beforeEach(() => {
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE);
        (xChain.getTxFee as jest.Mock).mockReturnValue(FEE);
    });

    it('node has enough balance return empty array', () => {
        let balX = new BN(1000000000);
        let balP = new BN(0);
        let balC = new BN(0);

        let nodeP = createGraphForX(balX, balP, balC);
        let target = new BN(1000000000);

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, []);
    });

    it('node needs balance from P', () => {
        let balX = new BN(0);
        let balP = new BN(5000000000); // 5 AVAX
        let balC = new BN(0);

        let nodeX = createGraphForX(balX, balP, balC);
        let target = new BN(2000000000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_x',
                amount: new BN(2000000000),
            },
            {
                action: 'import_p_x',
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from P, both parent have balance', () => {
        let balX = new BN(0);
        let balP = new BN(5000000000); // 5 AVAX
        let balC = new BN(5000000000); // 5 AVAX

        let nodeX = createGraphForX(balX, balP, balC);
        let target = new BN(2000000000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_x',
                amount: new BN(2000000000),
            },
            {
                action: 'import_p_x',
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from C', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(5000000000); // 5 AVAX

        let nodeX = createGraphForX(balX, balP, balC);
        let target = new BN(2000000000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_c_x',
                amount: new BN(2000000000),
            },
            {
                action: 'import_c_x',
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from both parents', () => {
        let balX = new BN(0);
        let balP = new BN(700000000);
        let balC = new BN(700000000);

        let nodeX = createGraphForX(balX, balP, balC);
        let target = new BN(1000000000); // 1 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_x',
                amount: new BN(698000000),
            },
            {
                action: 'import_p_x',
            },
            {
                action: 'export_c_x',
                amount: new BN(302000000),
            },
            {
                action: 'import_c_x',
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });
});
