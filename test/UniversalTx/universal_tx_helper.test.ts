import { createGraphForC, createGraphForP, createGraphForX, UniversalTx } from '@/UniversalTx';
import { BN } from 'avalanche';
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

// Assume constant import export fee for all chains
const FEE_XP = new BN(1_000_000);
const FEE_C = new BN(100_000);

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
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE_XP);
        (xChain.getTxFee as jest.Mock).mockReturnValue(FEE_XP);
    });

    it('all parents have balance of 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(1000000000);
        let balC = new BN(1000000000);

        let expected = balP.add(balX.sub(FEE_XP.add(FEE_XP)).add(balC.sub(FEE_C.add(FEE_XP))));
        let startNode = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('Only self and parent C has balance', () => {
        let balP = new BN(1000000000);
        let balX = new BN(0);
        let balC = new BN(1000000000);

        let expected = balP.add(balC.sub(FEE_C).sub(FEE_XP));
        let startNode = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('only parent C has balance', () => {
        let balP = new BN(0);
        let balX = new BN(0);
        let balC = new BN(1000000000);

        let expected = balC.sub(FEE_XP).sub(FEE_C);
        let startNode = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('starting node has balance', () => {
        let balP = new BN(1000000000);
        let balX = new BN(0);
        let balC = new BN(0);

        let expected = balP;
        let startNode = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });
});

describe('Reduce parent balance of UniversalNode X', () => {
    beforeEach(() => {
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE_XP);
        (xChain.getTxFee as jest.Mock).mockReturnValue(FEE_XP);
    });

    it('all nodes have balance of 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(1000000000);
        let balC = new BN(1000000000);

        let expected = balX.add(balP.sub(FEE_XP).sub(FEE_XP)).add(balC.sub(FEE_C).sub(FEE_XP));
        let startNode = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('both parents have balance of 1 AVAX', () => {
        let balX = new BN(0);
        let balP = new BN(1000000000);
        let balC = new BN(1000000000);

        let expected = balP.sub(FEE_XP).sub(FEE_XP).add(balC.sub(FEE_C).sub(FEE_XP));
        let startNode = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('parent P has balance of 1 AVAX', () => {
        let balX = new BN(0);
        let balP = new BN(1000000000);
        let balC = new BN(0);

        let expected = balP.sub(FEE_XP).sub(FEE_XP);
        let startNode = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('parent C has balance of 1 AVAX', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(1000000000);

        let expected = balC.sub(FEE_C).sub(FEE_XP);
        let startNode = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('no balance', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(0);

        let expected = new BN(0);
        let startNode = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('starting node has 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(0);
        let balC = new BN(0);

        let expected = balX;
        let startNode = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });
});

describe('Reduce parent balance of UniversalNode C', () => {
    beforeEach(() => {
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE_XP);
        (xChain.getTxFee as jest.Mock).mockReturnValue(FEE_XP);
    });

    it('all nodes have balance of 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(1000000000);
        let balC = new BN(1000000000);

        let expected = balC.add(balX.sub(FEE_XP).sub(FEE_C)).add(balP.sub(FEE_XP).sub(FEE_C));
        let startNode = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('both parents have balance of 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(1000000000);
        let balC = new BN(0);

        let expected = balX.sub(FEE_XP).sub(FEE_C).add(balP.sub(FEE_XP).sub(FEE_C));
        let startNode = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('parent P has balance of 1 AVAX', () => {
        let balX = new BN(0);
        let balP = new BN(1000000000);
        let balC = new BN(0);

        let expected = balP.sub(FEE_XP).sub(FEE_C);
        let startNode = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('parent X has balance of 1 AVAX', () => {
        let balX = new BN(1000000000);
        let balP = new BN(0);
        let balC = new BN(0);

        let expected = balX.sub(FEE_XP).sub(FEE_C);
        let startNode = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('no balance', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(0);

        let expected = new BN(0);
        let startNode = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });

    it('starting node has 1 AVAX', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(1000000000);

        let expected = balC;
        let startNode = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let tot = startNode.reduceTotalBalanceFromParents();
        expect(tot).toEqual(expected);
    });
});

describe('Get transactions for balance on UniversalNode P', () => {
    beforeEach(() => {
        (pChain.getTxFee as jest.Mock).mockReturnValue(FEE_XP);
        (xChain.getTxFee as jest.Mock).mockReturnValue(FEE_XP);
    });

    it('node has enough balance, return empty array', () => {
        let balP = new BN(1_000_000_000);
        let balX = new BN(0);
        let balC = new BN(0);

        let nodeP = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(1_000_000_000);

        let steps = nodeP.getStepsForTargetBalance(target);

        expect(steps.length).toEqual(0);
    });

    it('node needs balance from parent X', () => {
        let balP = new BN(1_000_000_000);
        let balX = new BN(2_000_000_000);
        let balC = new BN(0);

        let nodeP = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000);

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_x_p',
                amount: target.sub(balP).add(FEE_XP),
                fee: FEE_XP,
            },
            {
                action: 'import_x_p',
                fee: FEE_XP,
            },
        ];

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from 2nd parent', () => {
        let balP = new BN(1_000_000_000);
        let balX = new BN(0);
        let balC = new BN(2_000_000_000);

        let nodeP = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000);

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_c_p',
                amount: target.sub(balP).add(FEE_XP),
                fee: FEE_C,
            },
            {
                action: 'import_c_p',
                fee: FEE_XP,
            },
        ];

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from both parents and self', () => {
        let balP = new BN(1_000_000_000); // 1 AVAX
        let balX = new BN(500_000_000); // 0.5 AVAX
        let balC = new BN(2_000_000_000); // 2 AVAX

        let nodeP = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_x_p',
                amount: balX.sub(FEE_XP),
                fee: FEE_XP,
            },
            {
                action: 'import_x_p',
                fee: FEE_XP,
            },
            {
                action: 'export_c_p',
                amount: target.sub(balP).sub(balX.sub(FEE_XP).sub(FEE_XP)).add(FEE_XP),
                fee: FEE_C,
            },
            {
                action: 'import_c_p',
                fee: FEE_XP,
            },
        ];

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from both parents', () => {
        let balP = new BN(0); // 0 AVAX
        let balX = new BN(1_000_000_000); // 1 AVAX
        let balC = new BN(2_000_000_000); // 2 AVAX

        let nodeP = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_x_p',
                amount: balX.sub(FEE_XP), // All of the balance minus export fee
                fee: FEE_XP,
            },
            {
                action: 'import_x_p',
                fee: FEE_XP,
            },
            {
                action: 'export_c_p',
                amount: target.sub(balX.sub(FEE_XP).sub(FEE_XP)).add(FEE_XP),
                fee: FEE_C,
            },
            {
                action: 'import_c_p',
                fee: FEE_XP,
            },
        ];

        let steps = nodeP.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('not enough balance', () => {
        let balP = new BN(0); // 0 AVAX
        let balX = new BN(1_000_000_000); // 1 AVAX
        let balC = new BN(2_000_000_000); // 2 AVAX

        let nodeP = createGraphForP(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(20_000_000_000); // 2 AVAX

        expect(() => {
            nodeP.getStepsForTargetBalance(target);
        }).toThrow();
    });
});

describe('Get transactions for balance on UniversalNode X', () => {
    it('node has enough balance return empty array', () => {
        let balX = new BN(1_000_000_000);
        let balP = new BN(0);
        let balC = new BN(0);

        let nodeX = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(1_000_000_000);

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, []);
    });

    it('node needs balance from parent P', () => {
        let balX = new BN(0);
        let balP = new BN(5_000_000_000); // 5 AVAX
        let balC = new BN(0);

        let nodeX = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_x',
                amount: target.add(FEE_XP),
                fee: FEE_XP,
            },
            {
                action: 'import_p_x',
                fee: FEE_XP,
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node has partial balance, needs rest from parent P', () => {
        let balX = new BN(1_000_000_000);
        let balP = new BN(5_000_000_000); // 5 AVAX
        let balC = new BN(0);

        let nodeX = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_x',
                amount: target.sub(balX).add(FEE_XP),
                fee: FEE_XP,
            },
            {
                action: 'import_p_x',
                fee: FEE_XP,
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from P, both parent have balance', () => {
        let balX = new BN(0);
        let balP = new BN(5_000_000_000); // 5 AVAX
        let balC = new BN(5_000_000_000); // 5 AVAX

        let nodeX = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_x',
                amount: target.add(FEE_XP),
                fee: FEE_XP,
            },
            {
                action: 'import_p_x',
                fee: FEE_XP,
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from C', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(5_000_000_000); // 5 AVAX

        let nodeX = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_c_x',
                amount: target.add(FEE_XP),
                fee: FEE_C,
            },
            {
                action: 'import_c_x',
                fee: FEE_XP,
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from both parents', () => {
        let balX = new BN(0);
        let balP = new BN(700_000_000);
        let balC = new BN(700_000_000);

        let nodeX = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(1_000_000_000); // 1 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_x',
                amount: balP.sub(FEE_XP),
                fee: FEE_XP,
            },
            {
                action: 'import_p_x',
                fee: FEE_XP,
            },
            {
                action: 'export_c_x',
                amount: target.sub(balP.sub(FEE_XP).sub(FEE_XP)).add(FEE_XP),
                fee: FEE_C,
            },
            {
                action: 'import_c_x',
                fee: FEE_XP,
            },
        ];

        let steps = nodeX.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('not enough balance', () => {
        let balP = new BN(1_000_000_000); // 0 AVAX
        let balX = new BN(1_000_000); // 1 AVAX
        let balC = new BN(2_000_000_000); // 2 AVAX

        let nodeX = createGraphForX(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(20_000_000_000); // 2 AVAX

        expect(() => {
            nodeX.getStepsForTargetBalance(target);
        }).toThrow();
    });
});

describe('Get transactions for balance on UniversalNode C', () => {
    it('node has enough balance return empty array', () => {
        let balX = new BN(0);
        let balP = new BN(0);
        let balC = new BN(1_000_000_000);

        let nodeC = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(1_000_000_000);

        let steps = nodeC.getStepsForTargetBalance(target);

        compareSteps(steps, []);
    });

    it('node needs balance from parent P', () => {
        let balX = new BN(0);
        let balP = new BN(5_000_000_000); // 5 AVAX
        let balC = new BN(0);

        let nodeC = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_c',
                amount: target.add(FEE_C),
                fee: FEE_XP,
            },
            {
                action: 'import_p_c',
                fee: FEE_C,
            },
        ];

        let steps = nodeC.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node has partial balance, needs rest from parent P', () => {
        let balX = new BN(0);
        let balP = new BN(5_000_000_000); // 5 AVAX
        let balC = new BN(1_000_000_000);

        let nodeC = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_c',
                amount: target.sub(balC).add(FEE_C),
                fee: FEE_XP,
            },
            {
                action: 'import_p_c',
                fee: FEE_C,
            },
        ];

        let steps = nodeC.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from X, both parent have balance', () => {
        let balX = new BN(5_000_000_000);
        let balP = new BN(5_000_000_000);
        let balC = new BN(0);

        let nodeC = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_x_c',
                amount: target.add(FEE_C),
                fee: FEE_XP,
            },
            {
                action: 'import_x_c',
                fee: FEE_C,
            },
        ];

        let steps = nodeC.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from P', () => {
        let balX = new BN(0);
        let balP = new BN(5_000_000_000);
        let balC = new BN(0);

        let nodeC = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(2_000_000_000); // 2 AVAX

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_p_c',
                amount: target.add(FEE_C),
                fee: FEE_XP,
            },
            {
                action: 'import_p_c',
                fee: FEE_C,
            },
        ];

        let steps = nodeC.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });

    it('node needs balance from both parents', () => {
        let balX = new BN(700_000_000);
        let balP = new BN(700_000_000);
        let balC = new BN(0);

        let nodeC = createGraphForC(balX, balP, balC, FEE_XP, FEE_C);
        let target = new BN(1_000_000_000);

        let stepsExpected: UniversalTx[] = [
            {
                action: 'export_x_c',
                amount: balX.sub(FEE_XP),
                fee: FEE_XP,
            },
            {
                action: 'import_x_c',
                fee: FEE_C,
            },
            {
                action: 'export_p_c',
                amount: target.sub(balX.sub(FEE_XP).sub(FEE_C)).add(FEE_C),
                fee: FEE_XP,
            },
            {
                action: 'import_p_c',
                fee: FEE_C,
            },
        ];

        let steps = nodeC.getStepsForTargetBalance(target);

        compareSteps(steps, stepsExpected);
    });
});
