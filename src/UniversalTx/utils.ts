import { BN } from 'avalanche';
import { UniversalTx } from '@/UniversalTx/types';
import UniversalNodeX from '@/UniversalTx/UniversalNodeX';
import UniversalNodeP from '@/UniversalTx/UniversalNodeP';
import UniversalNodeC from '@/UniversalTx/UniversalNodeC';

export function createGraphForP(balX: BN, balP: BN, balC: BN, atomicFeeXP: BN, atomicFeeC: BN): UniversalNodeP {
    let xNode = new UniversalNodeX(balX, atomicFeeXP, atomicFeeXP);
    let pNode = new UniversalNodeP(balP, atomicFeeXP, atomicFeeXP);
    let cNode = new UniversalNodeC(balC, atomicFeeC, atomicFeeC);

    pNode.addParent(xNode);
    pNode.addParent(cNode);

    cNode.setChild(pNode);
    xNode.setChild(pNode);
    return pNode;
}

export function createGraphForC(balX: BN, balP: BN, balC: BN, atomicFeeXP: BN, atomicFeeC: BN): UniversalNodeC {
    let xNode = new UniversalNodeX(balX, atomicFeeXP, atomicFeeXP);
    let pNode = new UniversalNodeP(balP, atomicFeeXP, atomicFeeXP);
    let cNode = new UniversalNodeC(balC, atomicFeeC, atomicFeeC);

    cNode.addParent(xNode);
    cNode.addParent(pNode);

    pNode.setChild(cNode);
    xNode.setChild(cNode);

    return cNode;
}

export function createGraphForX(balX: BN, balP: BN, balC: BN, atomicFeeXP: BN, atomicFeeC: BN): UniversalNodeX {
    let xNode = new UniversalNodeX(balX, atomicFeeXP, atomicFeeXP);
    let pNode = new UniversalNodeP(balP, atomicFeeXP, atomicFeeXP);
    let cNode = new UniversalNodeC(balC, atomicFeeC, atomicFeeC);

    xNode.addParent(pNode);
    xNode.addParent(cNode);

    cNode.setChild(xNode);
    pNode.setChild(xNode);

    return xNode;
}

export function canHaveBalanceOnX(
    balX: BN,
    balP: BN,
    balC: BN,
    targetAmount: BN,
    atomicFeeXP: BN,
    atomicFeeC: BN
): boolean {
    let startNode = createGraphForX(balX, balP, balC, atomicFeeXP, atomicFeeC);
    return startNode.reduceTotalBalanceFromParents().gte(targetAmount);
}

export function canHaveBalanceOnP(
    balX: BN,
    balP: BN,
    balC: BN,
    targetAmount: BN,
    atomicFeeXP: BN,
    atomicFeeC: BN
): boolean {
    let startNode = createGraphForP(balX, balP, balC, atomicFeeXP, atomicFeeC);
    return startNode.reduceTotalBalanceFromParents().gte(targetAmount);
}

/**
 * Will return true if `targetAmount` can exist on C chain
 */
export function canHaveBalanceOnC(
    balX: BN,
    balP: BN,
    balC: BN,
    targetAmount: BN,
    atomicFeeXP: BN,
    atomicFeeC: BN
): boolean {
    let startNode = createGraphForC(balX, balP, balC, atomicFeeXP, atomicFeeC);
    return startNode.reduceTotalBalanceFromParents().gte(targetAmount);
}

export function getStepsForBalanceP(
    balX: BN,
    balP: BN,
    balC: BN,
    targetAmount: BN,
    atomicFeeXP: BN,
    atomicFeeC: BN
): UniversalTx[] {
    let startNode = createGraphForP(balX, balP, balC, atomicFeeXP, atomicFeeC);

    if (startNode.reduceTotalBalanceFromParents().lt(targetAmount)) {
        throw new Error('Insufficient AVAX.');
    }

    return startNode.getStepsForTargetBalance(targetAmount);
}

export function getStepsForBalanceC(
    balX: BN,
    balP: BN,
    balC: BN,
    targetAmount: BN,
    atomicFeeXP: BN,
    atomicFeeC: BN
): UniversalTx[] {
    let startNode = createGraphForC(balX, balP, balC, atomicFeeXP, atomicFeeC);

    if (startNode.reduceTotalBalanceFromParents().lt(targetAmount)) {
        throw new Error('Insufficient AVAX.');
    }

    return startNode.getStepsForTargetBalance(targetAmount);
}

export function getStepsForBalanceX(
    balX: BN,
    balP: BN,
    balC: BN,
    targetAmount: BN,
    atomicFeeXP: BN,
    atomicFeeC: BN
): UniversalTx[] {
    let startNode = createGraphForX(balX, balP, balC, atomicFeeXP, atomicFeeC);

    if (startNode.reduceTotalBalanceFromParents().lt(targetAmount)) {
        throw new Error('Insufficient AVAX.');
    }

    return startNode.getStepsForTargetBalance(targetAmount);
}
