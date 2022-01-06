import { UniversalNodeAbstract } from '@/UniversalTx/UniversalNode';
import { ExportChainsC } from '@/Wallet/types';
import {
    UniversalTxActionExportC,
    UniversalTxActionImportC,
    UniversalTxExportC,
    UniversalTxImportC,
} from '@/UniversalTx/types';
import { BN } from 'avalanche';

export default class UniversalNodeC extends UniversalNodeAbstract {
    constructor(balance: BN, feeExport: BN, feeImport: BN) {
        super(balance, 'C', feeExport, feeImport);
    }

    buildExportTx(destChain: ExportChainsC, amount: BN): UniversalTxExportC {
        return super.buildExportTx(destChain, amount) as UniversalTxExportC;
    }

    buildImportTx(sourceChain: ExportChainsC): UniversalTxImportC {
        return super.buildImportTx(sourceChain) as UniversalTxImportC;
    }

    getExportMethod(to: ExportChainsC): UniversalTxActionExportC {
        if (to === 'X') {
            return 'export_c_x';
        } else {
            return 'export_c_p';
        }
    }

    getImportMethod(from: ExportChainsC): UniversalTxActionImportC {
        if (from === 'X') {
            return 'import_x_c';
        } else {
            return 'import_p_c';
        }
    }
}
