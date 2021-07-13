export type AvmStatusType = 'Accepted' | 'Processing' | 'Rejected' | 'Unknown';
export type PlatformStatusType = 'Committed' | 'Processing' | 'Dropped' | 'Unknown';
export type ChainStatusTypeC = 'Accepted' | 'Processing' | 'Dropped' | 'Unknown';

export type AvmStatusResponseType = AvmStatusType | iAvmStatusResponse;
export type PlatformStatusResponseType = PlatformStatusType | iPlatformStatusResponse;
export type ChainStatusResponseTypeC = ChainStatusTypeC | iChainStatusResponseC;

export interface iAvmStatusResponse {
    status: AvmStatusType;
    reason: string;
}

export interface iPlatformStatusResponse {
    status: PlatformStatusType;
    reason: string;
}

export interface iChainStatusResponseC {
    status: PlatformStatusType;
    reason: string;
}
