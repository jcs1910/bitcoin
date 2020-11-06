const Blockchain = require('./5.hashBlock');
const bitcoin = new Blockchain();

const parentHash = 'ghasgghrrtr4326534faeg';

const currentBlockData = [
  {
    amount: 1000,
    sender: 'hfsdabhfsgheatg32242',
    recipient: 'hfsdhbsfdghegret45634',
  },
  {
    amount: 5000,
    sender: 'abfdbfdbfet4325r',
    recipient: 'qgtergrtqgf3534354',
  },
  {
    amount: 3000,
    sender: 'avbefdasvreg3t354ewa2',
    recipient: 'gasdbvbafsdbvaef35454325',
  },
];

const nonce = 5000;

const hashBlock = bitcoin.hashBlock(parentHash, currentBlockData, nonce);
console.log(hashBlock);
