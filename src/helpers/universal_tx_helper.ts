import { BN } from 'avalanche';
import { UniversalNode } from '@/helpers/UniversalNode';

type UniversalTxActionTypesX = 'send_x' | 'export_x_c' | 'export_x_p';
type UniversalTxActionTypesC = 'send_c' | 'export_c_x';
type UniversalTxActionTypesP = 'export_p_x';

export type UniversalTxActionType = UniversalTxActionTypesX | UniversalTxActionTypesC | UniversalTxActionTypesP;

export interface UniversalTx {
    action: UniversalTxActionType;
    amount: BN;
}

export function createGraphForP(balX: BN, balP: BN, balC: BN): UniversalNode {
    let xNode = new UniversalNode(balX, 'X');
    let pNode = new UniversalNode(balP, 'P');
    let cNode = new UniversalNode(balC, 'C');

    pNode.addParent(xNode);
    xNode.addParent(cNode);

    cNode.setChild(xNode);
    xNode.setChild(pNode);
    return pNode;
}

export function createGraphForC(balX: BN, balP: BN, balC: BN): UniversalNode {
    let xNode = new UniversalNode(balX, 'X');
    let pNode = new UniversalNode(balP, 'P');
    let cNode = new UniversalNode(balC, 'C');

    cNode.addParent(xNode);
    xNode.addParent(pNode);

    pNode.setChild(xNode);
    xNode.setChild(cNode);

    return cNode;
}

export function createGraphForX(balX: BN, balP: BN, balC: BN): UniversalNode {
    let xNode = new UniversalNode(balX, 'X');
    let pNode = new UniversalNode(balP, 'P');
    let cNode = new UniversalNode(balC, 'C');

    xNode.addParent(pNode);
    xNode.addParent(cNode);

    cNode.setChild(xNode);
    pNode.setChild(xNode);

    return xNode;
}

export function canHaveBalanceOnX(balX: BN, balP: BN, balC: BN, targetAmount: BN): boolean {
    let startNode = createGraphForX(balX, balP, balC);
    return startNode.reduceTotalBalanceFromParents().gte(targetAmount);
}

export function canHaveBalanceOnP(balX: BN, balP: BN, balC: BN, targetAmount: BN): boolean {
    let startNode = createGraphForP(balX, balP, balC);
    return startNode.reduceTotalBalanceFromParents().gte(targetAmount);
}

/**
 * Will return true if `targetAmount` can exist on C chain
 */
export function canHaveBalanceOnC(balX: BN, balP: BN, balC: BN, targetAmount: BN): boolean {
    let startNode = createGraphForC(balX, balP, balC);
    return startNode.reduceTotalBalanceFromParents().gte(targetAmount);
}

export function getStepsForBalanceP(balX: BN, balP: BN, balC: BN, targetAmount: BN): UniversalTx[] {
    let startNode = createGraphForP(balX, balP, balC);

    if (startNode.reduceTotalBalanceFromParents().lt(targetAmount)) {
        throw new Error('Insufficient AVAX.');
    }

    return startNode.getStepsForTargetBalance(targetAmount);
}

export function getStepsForBalanceC(balX: BN, balP: BN, balC: BN, targetAmount: BN): UniversalTx[] {
    let startNode = createGraphForC(balX, balP, balC);

    if (startNode.reduceTotalBalanceFromParents().lt(targetAmount)) {
        throw new Error('Insufficient AVAX.');
    }

    return startNode.getStepsForTargetBalance(targetAmount);
}

export function getStepsForBalanceX(balX: BN, balP: BN, balC: BN, targetAmount: BN): UniversalTx[] {
    let startNode = createGraphForX(balX, balP, balC);

    if (startNode.reduceTotalBalanceFromParents().lt(targetAmount)) {
        throw new Error('Insufficient AVAX.');
    }

    return startNode.getStepsForTargetBalance(targetAmount);
}
