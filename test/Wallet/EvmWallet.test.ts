import { EvmWallet } from '@/Wallet/EVM/EvmWallet';
import { recoverPersonalSignature } from '@metamask/eth-sig-util';

let PK_HEX = `8985df5f35f11ad2b2f5e8bebd28e738fd731949ce43fde88634704b4026366e`;
let keyBuf = Buffer.from(PK_HEX, 'hex');

describe('EVM Wallet', () => {
    it('Can init', () => {
        let wallet = new EvmWallet(keyBuf);
    });

    it('returns correct eth address', () => {
        let addr = '0x32255F101da293a908805B16Af8a4619dC1d3c78';
        let wallet = new EvmWallet(keyBuf);

        expect(wallet.getAddress()).toEqual(addr);
    });

    it('can get private key hex', () => {
        let wallet = new EvmWallet(keyBuf);
        let pk = wallet.getPrivateKeyHex();

        expect(pk).toEqual(PK_HEX);
    });
});

describe('Signing', () => {
    let wallet = new EvmWallet(keyBuf);

    it('personal sign', async () => {
        const testMsg = 'Example `personal_sign` message';
        const msg = Buffer.from(testMsg, 'utf8');
        const msgHex = `0x${msg.toString('hex')}`;
        const sig = wallet.personalSign(msgHex);
        expect(sig).toEqual(
            '0xb27fec6e810c4e4ac497e1a2883babe1ab7db2e5168a57b6a308b0e4fcb7a05e3c78cf8dcf122efdad280bd266fea9723e7d576e220a0d025396cf685c2e03db1c'
        );
        const recover = recoverPersonalSignature({ data: msgHex, signature: sig });
        expect(recover).toEqual(wallet.getAddress().toLowerCase());
    });

    it('typed data V1', async () => {
        const data = [
            {
                type: 'string',
                name: 'Message',
                value: 'Hi, Alice!',
            },
            {
                type: 'uint32',
                name: 'A number',
                value: '1337',
            },
        ];

        const hash = wallet.signTypedData_V1(data);
        expect(hash).toEqual(
            '0x3adca0107419f45f23cd0fd62ebd044885cc7e83dfe654b8c1af96eeb1c4520b1ba3fc76610f6185890844ac92dc97ba73eea63857f2e34c19f5a942319a5f241b'
        );
    });

    it('typed data V3', async () => {
        const data = `{"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Person":[{"name":"name","type":"string"},{"name":"wallet","type":"address"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person"},{"name":"contents","type":"string"}]},"primaryType":"Mail","domain":{"name":"Ether Mail","version":"1","chainId":43114,"verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"},"message":{"sender":{"name":"Cow","wallet":"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826"},"recipient":{"name":"Bob","wallet":"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"},"contents":"Hello, Bob!"}}`;
        const json = JSON.parse(data);
        const hash = wallet.signTypedData_V3(json);
        expect(hash).toEqual(
            '0x49b1ed568f7cdf5a06117793e364b96fcd210e6bdcc870953f20ac3060eb4d3e0cdc512a6aedb482e6019b320630df7b89e491bc4cb18da8bf4ce9df842b00f01c'
        );
    });

    it('typed data V4', async () => {
        const data = `{"domain":{"chainId":"43114","name":"Ether Mail","verifyingContract":"0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC","version":"1"},"message":{"contents":"Hello, Bob!","from":{"name":"Cow","wallets":["0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826","0xDeaDbeefdEAdbeefdEadbEEFdeadbeEFdEaDbeeF"]},"to":[{"name":"Bob","wallets":["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB","0xB0BdaBea57B0BDABeA57b0bdABEA57b0BDabEa57","0xB0B0b0b0b0b0B000000000000000000000000000"]}]},"primaryType":"Mail","types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"}],"Group":[{"name":"name","type":"string"},{"name":"members","type":"Person[]"}],"Mail":[{"name":"from","type":"Person"},{"name":"to","type":"Person[]"},{"name":"contents","type":"string"}],"Person":[{"name":"name","type":"string"},{"name":"wallets","type":"address[]"}]}}`;
        const json = JSON.parse(data);
        const hash = wallet.signTypedData_V4(json);
        expect(hash).toEqual(
            '0x42fca8c9ebf2fd2ff760a47e120b80a91420f6619ff00ba5c8df41c39fb49dcd0faa4f74e1f43b9088ec53d600f581a777d2aad84abdd6a515f2de9b3c8e7f3f1b'
        );
    });
});
