import { CypherAES } from '@/utils';
import randomstring from 'randomstring';
import * as bip39 from 'bip39';

describe('CypherAES', function () {
    it('can init', () => {
        const val = 'test';
        const cypher = new CypherAES(val);
        expect(cypher.getValue()).toEqual(val);
    });

    it('series of random strings', () => {
        for (let i = 0; i < 100; i++) {
            const randomStr = randomstring.generate();
            const cypher = new CypherAES(randomStr);
            expect(cypher.getValue()).toEqual(randomStr);
        }
    });

    it('string with spaces', () => {
        const val = 'string with spaces are getting stored';
        const cypher = new CypherAES(val);
        expect(cypher.getValue()).toEqual(val);
    });

    it('empty space at the end', () => {
        const val = 'test ';
        const cypher = new CypherAES(val);
        expect(cypher.getValue()).toEqual(val);
    });

    it('empty space at the beginning', () => {
        const val = ' test';
        const cypher = new CypherAES(val);
        expect(cypher.getValue()).toEqual(val);
    });

    it('empty space at both ends', () => {
        const val = ' test ';
        const cypher = new CypherAES(val);
        expect(cypher.getValue()).toEqual(val);
    });

    it('series of mnemonics', () => {
        const amt = 5000;
        for (let i = 0; i < amt; i++) {
            const mnemonic = bip39.generateMnemonic(256);
            const cypher = new CypherAES(mnemonic);
            expect(cypher.getValue()).toEqual(mnemonic);
        }
    });
});
