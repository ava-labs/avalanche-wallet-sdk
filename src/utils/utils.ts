import { Buffer as BufferAvalanche } from 'avalanche';
import { validateAddress } from '@/helpers/address_helper';
import createHash from 'create-hash';
import { PayloadBase, PayloadTypes } from 'avalanche/dist/utils';

/**
 * Checks if address is valid.
 *
 * @return
 * boolean if address is valid, error message if not valid.
 */
export function isValidAddress(address: string): boolean {
    return validateAddress(address) === true;
}

export function digestMessage(msgStr: string): Buffer {
    let mBuf = Buffer.from(msgStr, 'utf8');
    let msgSize = Buffer.alloc(4);
    msgSize.writeUInt32BE(mBuf.length, 0);
    let msgBuf = Buffer.from(`\x1AAvalanche Signed Message:\n${msgSize}${msgStr}`, 'utf8');
    return createHash('sha256').update(msgBuf).digest();
}

let payloadtypes = PayloadTypes.getInstance();

export function parseNftPayload(rawPayload: string): PayloadBase {
    let payload = BufferAvalanche.from(rawPayload, 'base64');
    payload = BufferAvalanche.concat([new BufferAvalanche(4).fill(payload.length), payload]);

    let typeId = payloadtypes.getTypeID(payload);
    let pl: BufferAvalanche = payloadtypes.getContent(payload);
    let payloadbase: PayloadBase = payloadtypes.select(typeId, pl);

    return payloadbase;
}
