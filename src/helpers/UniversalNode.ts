import { BN } from 'avalanche';
import { ChainIdType } from '@/types';
import { xChain } from '@/Network/network';
import { UniversalTx, UniversalTxActionType } from '@/helpers/universal_tx_helper';

export class UniversalNode {
    parents: UniversalNode[];
    child: UniversalNode | null; // can only have 1 child
    balance: BN;
    chain: ChainIdType;
    constructor(balance: BN, chain: ChainIdType, parents: UniversalNode[] = [], child: UniversalNode | null = null) {
        this.parents = parents;
        this.child = child;
        this.balance = balance;
        this.chain = chain;
    }

    // Sum of the node's balance + all balance of parents minus the transfer fees
    reduceTotalBalanceFromParents(): BN {
        // If there are no balance return balance of self
        if (this.parents.length === 0) {
            return this.balance;
        }

        let fee = xChain.getTxFee();

        let parentBals = this.parents.map((node) => {
            // Subtract transfer fees from parent balance
            // import + export
            let parentBalance = node.reduceTotalBalanceFromParents();
            parentBalance = parentBalance.sub(fee).sub(fee);
            let zero = new BN(0);
            return BN.max(parentBalance, zero);
        });

        let tot = parentBals.reduce((prev, current) => {
            return prev.add(current);
        }, new BN(0));

        return tot.add(this.balance);
    }

    /**
     * Returns the export action type from this node to its child
     * @param to
     */
    getExportMethod(to?: ChainIdType): UniversalTxActionType {
        switch (this.chain) {
            case 'X':
                if (to === 'P') {
                    return 'export_x_p';
                } else {
                    return 'export_x_c';
                }
            case 'C':
                return 'export_c_x';
            case 'P':
                return 'export_p_x';
        }
    }

    buildExportTx(amount: BN): UniversalTx {
        return {
            action: this.getExportMethod(this.child?.chain),
            amount: amount,
        };
    }

    /***
     * Assumes there is enough balance on node tree
     * Returns empty array even if transaction not possible!
     * What steps to take to have the target balance on this node.
     * @param target Amount of nAVAX needed on this node.
     */
    getStepsForTargetBalance(target: BN): UniversalTx[] {
        // If the node has enough balance no transaction needed
        // If target is negative or zero no transaction needed
        if (this.balance.gte(target) || target.lte(new BN(0))) {
            return [];
        }

        let fee = xChain.getTxFee();
        let feeImportExport = fee.add(fee);

        // If not enough balance and no parents
        // return all the balance
        if (this.balance.lt(target) && this.parents.length === 0) {
            let tx = this.buildExportTx(this.balance.sub(feeImportExport));
            return [tx];
        }

        // If not enough balance

        // Amount needed to collect from parents
        let remaining = target.sub(this.balance);

        // Amount the parent must have

        if (this.parents.length === 1) {
            // Export from parent to this node
            let parent = this.parents[0];
            let parentBalanceNeeded = remaining.add(feeImportExport);
            let txs = parent.getStepsForTargetBalance(parentBalanceNeeded);
            let tx = parent.buildExportTx(remaining);
            return [...txs, tx];
        } else {
            let transactions = [];
            for (let i = 0; i < this.parents.length; i++) {
                let p = this.parents[i];
                let pBal = p.reduceTotalBalanceFromParents();
                let pBalMax = pBal.sub(feeImportExport);
                let parentBalanceNeeded = remaining.add(feeImportExport);

                let exportAmt = BN.min(pBalMax, remaining); // The amount that will cross to the target chain
                let target = BN.min(pBalMax, parentBalanceNeeded);

                if (exportAmt.lte(new BN(0))) continue;

                let pTxs = p.getStepsForTargetBalance(target);
                let pTx = p.buildExportTx(exportAmt);

                transactions.push(...pTxs);
                transactions.push(pTx);

                remaining = remaining.sub(exportAmt);
            }

            // If we still have remaining balance, we can not complete this transfer
            if (remaining.gt(new BN(0))) {
                throw new Error('Insufficient AVAX balances.');
            }

            return transactions;
        }
    }

    addParent(node: UniversalNode) {
        this.parents.push(node);
    }

    setChild(node: UniversalNode) {
        this.child = node;
    }
}
