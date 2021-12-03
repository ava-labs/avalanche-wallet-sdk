import { BN } from 'avalanche';

export type UniversalTxActionExportC = 'export_c_x' | 'export_c_p';
export type UniversalTxActionImportC = 'import_x_c' | 'import_p_c';

export type UniversalTxActionExportX = 'export_x_p' | 'export_x_c';
export type UniversalTxActionImportX = 'import_p_x' | 'import_c_x';

export type UniversalTxActionExportP = 'export_p_x' | 'export_p_c';
export type UniversalTxActionImportP = 'import_x_p' | 'import_c_p';

export type UniversalTxActionExport = UniversalTxActionExportC | UniversalTxActionExportX | UniversalTxActionExportP;

export type UniversalTxActionImport = UniversalTxActionImportC | UniversalTxActionImportX | UniversalTxActionImportP;

export interface UniversalTxExport {
    action: UniversalTxActionExport;
    amount: BN;
    fee: BN;
}

export interface UniversalTxImport {
    action: UniversalTxActionImport;
    fee: BN;
}

type UniversalTxActionTypesX = UniversalTxActionExportX | UniversalTxActionImportX;
type UniversalTxActionTypesC = UniversalTxActionExportC | UniversalTxActionImportC;
type UniversalTxActionTypesP = UniversalTxActionExportP | UniversalTxActionImportP;

export type UniversalTxActionType = UniversalTxActionTypesX | UniversalTxActionTypesC | UniversalTxActionTypesP;

export type UniversalTx = UniversalTxsX | UniversalTxsP | UniversalTxsC;

type UniversalTxsX = UniversalTxExportX | UniversalTxImportX;
type UniversalTxsP = UniversalTxExportP | UniversalTxImportP;
type UniversalTxsC = UniversalTxExportC | UniversalTxImportC;

export interface UniversalTxExportC extends UniversalTxExport {
    action: UniversalTxActionExportC;
}

export interface UniversalTxExportX extends UniversalTxExport {
    action: UniversalTxActionExportX;
}

export interface UniversalTxExportP extends UniversalTxExport {
    action: UniversalTxActionExportP;
}

export interface UniversalTxImportC extends UniversalTxImport {
    action: UniversalTxActionImportC;
    fee: BN;
}

export interface UniversalTxImportX extends UniversalTxImport {
    action: UniversalTxActionImportX;
}

export interface UniversalTxImportP extends UniversalTxImport {
    action: UniversalTxActionImportP;
}
