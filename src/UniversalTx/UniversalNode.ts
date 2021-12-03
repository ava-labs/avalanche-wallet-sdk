import { BN } from 'avalanche';
import { ChainIdType } from '@/types';
import { xChain } from '@/Network/network';
import {
    UniversalTx,
    UniversalTxActionExport,
    UniversalTxActionImport,
    UniversalTxExport,
    UniversalTxImport,
} from './types';
import { ExportChainsC } from '@/Wallet/types';

export abstract class UniversalNodeAbstract {
    parents: UniversalNodeAbstract[];
    child: UniversalNodeAbstract | null; // can only have 1 child
    balance: BN;
    chain: ChainIdType;
    feeExport: BN;
    feeImport: BN;

    protected constructor(balance: BN, chain: ChainIdType, feeExport: BN, feeImport: BN) {
        this.parents = [];
        this.child = null;
        this.balance = balance;
        this.chain = chain;
        this.feeExport = feeExport;
        this.feeImport = feeImport;
    }

    // Sum of the node's balance + all balance of parents minus the transfer fees
    reduceTotalBalanceFromParents(): BN {
        // If there are no balance return balance of self
        if (this.parents.length === 0) {
            return this.balance;
        }

        let parentBals = this.parents.map((node) => {
            // Subtract transfer fees from parent balance
            // import + export
            let parentBalance = node.reduceTotalBalanceFromParents();
            parentBalance = parentBalance.sub(this.feeImport).sub(node.feeExport);
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
    abstract getExportMethod(to: ChainIdType): UniversalTxActionExport;

    /**
     * Returns the import action type from this node to its child
     * @param from Which chain are we importing from
     */
    abstract getImportMethod(from: ChainIdType): UniversalTxActionImport;

    buildExportTx(destChain: ChainIdType, amount: BN): UniversalTxExport {
        return {
            action: this.getExportMethod(destChain),
            amount: amount,
            fee: this.feeExport,
        };
    }

    buildImportTx(sourceChain: ChainIdType): UniversalTxImport {
        return {
            action: this.getImportMethod(sourceChain),
            fee: this.feeImport,
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
        //TODO: This should be calculated depending on the parent
        // let feeImportExport = fee.add(fee);

        // If not enough balance and no parents
        // return all the balance
        if (this.balance.lt(target) && this.parents.length === 0) {
            // let tx = this.buildExportTx(this.balance.sub(feeImportExport));
            // return [tx];
            return [];
        }

        // If not enough balance

        // Amount needed to collect from parents
        let remaining = target.sub(this.balance);

        // Amount the parent must have

        if (this.parents.length === 1) {
            // Export from parent to this node
            let parent = this.parents[0];
            const feeImportExport = this.feeImport.add(parent.feeExport);
            let parentBalanceNeeded = remaining.add(feeImportExport);
            let txs = parent.getStepsForTargetBalance(parentBalanceNeeded);
            let tx = parent.buildExportTx(this.chain, remaining);
            let importTx = this.buildImportTx(parent.chain);
            return [...txs, tx, importTx];
        } else {
            let transactions = [];
            for (let i = 0; i < this.parents.length; i++) {
                let p = this.parents[i];
                let pBal = p.reduceTotalBalanceFromParents();
                const feeImportExport = this.feeImport.add(p.feeExport);
                let pBalMax = pBal.sub(feeImportExport);
                let parentBalanceNeeded = remaining.add(feeImportExport);

                let exportAmt = BN.min(pBalMax, remaining); // The amount that will cross to the target chain
                let target = BN.min(pBalMax, parentBalanceNeeded);

                if (exportAmt.lte(new BN(0))) continue;

                let pTxs = p.getStepsForTargetBalance(target);
                let pTx = p.buildExportTx(this.chain, exportAmt);
                let importTx = this.buildImportTx(p.chain);
                transactions.push(...pTxs);
                transactions.push(pTx);
                transactions.push(importTx);

                remaining = remaining.sub(exportAmt);
            }

            // If we still have remaining balance, we can not complete this transfer
            if (remaining.gt(new BN(0))) {
                throw new Error('Insufficient AVAX balances.');
            }

            return transactions;
        }
    }

    addParent(node: UniversalNodeAbstract) {
        this.parents.push(node);
    }

    setChild(node: UniversalNodeAbstract) {
        this.child = node;
    }
}
