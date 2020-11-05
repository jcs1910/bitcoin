const Blockchain = require('./6.proofOfWork');
const bitcoin = new Blockchain();

const parentHash = 'hnfjkgrekjgrei34gj2542ilj';
const currentBlockData = [
  {
    amount: 1000,
    sender: 'abglkfdnbkg45423523fdbnm',
    recipient: 'fdagfdkl34l5431323lkdvk',
  },
  {
    amount: 5000,
    sender: 'fhmnbnbfdbdfeg23423',
    recipient: '354lkdfbvhkjfdjvhak435rk43',
  },
  {
    amount: 8000,
    sender: '0000xgfdskjg5k432jl24k',
    recipient: '0xgkmvnsgavklaghl24243lk',
  },
];

const nonce = bitcoin.pow(parentHash, currentBlockData);
console.log(nonce);
