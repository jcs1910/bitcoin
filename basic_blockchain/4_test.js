const Blockchain = require('./4.createNewTransaction');
const bitcoin = new Blockchain();

bitcoin.createNewBlock('sgdsgdsgwgwt324', 'gjkvbnkeagl35435klllk', 1000);
bitcoin.createNewBlock('dfhdfdsgbfdgf', 'agwergw4543254', 5000);

bitcoin.createNewTransaction(
  1000,
  'ahbgefebegba35t43543fd',
  '674576y54dfg3rq4trsd'
);
bitcoin.createNewBlock('dsfgnhbsbseyt53', 'dbvfeh56jy7667456', 3000);

console.log('bitcoin =>', bitcoin);
console.log('bitcoin chain 세 번째를 찍은 출력 값 => ', bitcoin.chain[3]);
