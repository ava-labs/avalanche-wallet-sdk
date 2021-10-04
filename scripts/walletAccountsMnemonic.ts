import { MnemonicWallet } from '../dist';

const mnemonic = `state usage height lumber ski federal silly axis train sustain pizza try embark giraffe motion account loud actress blood chapter blame network blossom hat`;
// or generate new mnemonic
// const mnemonic = MnemonicWallet.generateMnemonicPhrase()

let account0 = new MnemonicWallet(mnemonic);
let account1 = new MnemonicWallet(mnemonic, 1);
let account2 = new MnemonicWallet(mnemonic, 2);

// Account 0
console.log('Account 0');
console.log('X:', account0.getAddressX());
console.log('C:', account0.getAddressC());
// Account 1
console.log('Account 1');
console.log('X:', account1.getAddressX());
console.log('C:', account1.getAddressC());
// Account 2
console.log('Account 2');
console.log('X:', account2.getAddressX());
console.log('C:', account2.getAddressC());
