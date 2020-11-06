const Blockchain = require('./blockchain');
const { v4: uuidv4 } = require('uuid');

const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const bitcoin = new Blockchain();
const nodeAddress = uuidv4().split('-').join('');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// API Endpoint 로직이 들어 간다.
// 전체 블록체인을 가져오는 코드
app.get('/blockchain', (req, res) => {
  // req = request, res = response
  console.log('hello this is a blockcww');
});

app.get('/transaction', (req, res) => {
  //body == undefined req.body.amount
  res.send(`The amount of the transaction is ${req.body.amount} bitcoin`);
});

app.get('/mine', (req, res) => {
  const lastBlock = bitcoin.getLastBlock();
  const previousBlockHash = lastBlock['hash'];

  const currentBlockData = {
    transactions: bitcoin.pendingTxs,
    index: lastBlock['index'] + 1,
  };

  const nonce = bitcoin.pow(previousBlockHash, currentBlockData);
  const currentHash = bitcoin.hashBlock(
    previousBlockHash,
    currentBlockData,
    nonce
  );

  const newBlock = bitcoin.createNewBlock(
    previousBlockHash,
    currentHash,
    nonce
  );

  bitcoin.createNewTransaction(6.25, '00', nodeAddress);

  res.json({
    message: 'New Block minded successfully',
    block: newBlock,
  });
});

app.listen(3000, () => {
  console.log('Listening on port 3000...');
});
