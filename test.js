const Blockchain = require('./5.hashBlock');
const bitcoin = new Blockchain();

const parentHash = 'dsrahsrfagh3245321';
const currentBlockData = [
  {
    amount: 100,
    sender: 'jarryadshreastt4324',
    recipient: 'luniverse2wreagr3q543',
  },
  {
    amount: 500,
    sender: 'jarryadshreastt4324',
    recipient: 'upbitdfgafdswreagr3q543',
  },
  {
    amount: 1000,
    sender: 'jarryadsngfnhreastt4324',
    recipient: 'lambdngaaesdg2wreagr3q5431',
  },
];

const nonce = bitcoin.pow(parentHash, currentBlockData);
console.log(nonce);
