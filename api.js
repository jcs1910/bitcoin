const Blockchain = require('./blockchain');

const express = require('express');
const app = express();

const bitcoin = new Blockchain();

// 전체 블록체인을 가져오는 코드
app.get('/blockchain', (req, res) => {
  console.log('hello this is a blockchain');
});

app.listen(3000, () => {
  console.log('Listening on port 3000...');
});
