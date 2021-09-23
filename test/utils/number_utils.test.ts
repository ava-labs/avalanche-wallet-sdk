import * as Utils from '@/utils';
import { BN } from 'avalanche';

describe('stringToBN', () => {
    it('no decimals', () => {
        let val = Utils.stringToBN('10', 0);
        expect(val).toEqual(new BN(10));
    });

    it('string has decimal point, but value doesnt', () => {
        let val = Utils.stringToBN('10.0', 0);
        expect(val).toEqual(new BN(10));
    });

    it('should be 0', () => {
        let val = Utils.stringToBN('0', 0);
        let valPoint = Utils.stringToBN('0.0', 0);
        expect(val).toEqual(new BN(0));
        expect(valPoint).toEqual(new BN(0));
    });

    it('has decimal values', () => {
        let val = Utils.stringToBN('1.12', 5);
        expect(val).toEqual(new BN(112000));
    });

    it('has decimal values with extra 0s', () => {
        let val = Utils.stringToBN('1.12000', 5);
        expect(val).toEqual(new BN(112000));
    });

    it('decimals has extra 0, higher than the denomination', () => {
        let val = Utils.stringToBN('1.1232', 2);
        expect(val).toEqual(new BN(112));
    });

    it('decimals values are higher than the denomination allows', () => {
        let val = Utils.stringToBN('1.1232', 2);
        expect(val).toEqual(new BN(112));
    });

    it('Million AVAX 9 decimals', () => {
        let val = Utils.stringToBN('360123900', 9);
        expect(val).toEqual(new BN('360123900000000000'));
    });

    it('Million AVAX 18 decimals', () => {
        let val = Utils.stringToBN('360123900', 18);
        expect(val).toEqual(new BN('360123900000000000000000000'));
    });
});
