const Blockchain = require('./3.getLastBlock');
const bitcoin = new Blockchain();

bitcoin.createNewBlock('sgdsgdsgwgwt324', 'gjkvbnkeagl35435klllk', 1000);
bitcoin.createNewBlock('dfhdfdsgbfdgf', 'agwergw4543254', 5000);
bitcoin.createNewBlock('dsfgnhbsbseyt53', 'dbvfeh56jy7667456', 3000);

console.log(bitcoin.getLastBlock());
