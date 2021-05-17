export type AvmStatusType = 'Accepted' | 'Processing' | 'Rejected' | 'Unknown';
export type PlatformStatusType = 'Committed' | 'Processing' | 'Rejected' | 'Unknown';

export type AvmStatusResponseType = AvmStatusType | iAvmStatusResponse;
export type PlatformStatusResponseType = PlatformStatusType | iPlatformStatusResponse;

export interface iAvmStatusResponse {
    status: AvmStatusType;
    reason: string;
}

export interface iPlatformStatusResponse {
    status: PlatformStatusType;
    reason: string;
}
