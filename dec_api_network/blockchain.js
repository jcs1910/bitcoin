const { v4: uuidv4 } = require('uuid');
// 해싱을 하기 위해 다운로드 받은 sha256을 불러와보자
const sha256 = require('sha256');
const currentNodeUrl = process.argv[3];

class Blockchain {
  constructor() {
    this.chain = [];
    this.pendingTxs = []; // 멤풀이라고 한다. 멤풀은 트랜잭션이 머무르는 대기 공간이다.

    // 3. 현재 노드 URl 정보를 constructor에 넣었고 네트워크에서 노드가 서로 연결되어 있는지
    // 확인할 수 있는 networkNodes 라는 빈 배열(어레이, 공간)를 만들었다.
    this.currentNodeUrl = currentNodeUrl;
    this.networkNodes = [];

    // Genesis Block(블록체인의 가장 첫 번째 블록)을 생성하는 코드
    this.createNewBlock('', '', 0);
  }
  // 블록체인이 유효한지 아닌지를 검증하는 단계
  chainIsValid(blockchain) {
    let validChain = true;

    for (let i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i]; // 1번째 블록
      const previousBlock = blockchain[i - 1]; // 0번째 블록

      // 2. 각 블록이 연속해서 4개의 0 (0000) 으로 시작 되는지 확인
      const blockHash = this.hashBlock(
        previousBlock['hash'],
        {
          transactions: currentBlock['transactions'],
          index: currentBlock['index'],
        },
        currentBlock['nonce']
      );

      if (blockHash.substring(0, 4) !== '0000') {
        validChain = false;
      }

      // 1. 이전 블록의 해쉬 값과 현재 블록의 해쉬 값을 비교
      if (currentBlock['parentHash'] !== previousBlock['hash']) {
        //해당 체인은 유효하지 않음
        validChain = false;
      }
    }
    // Genesis Block을 검증한다.
    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock['nonce'] === 0;
    const correctParentHash = genesisBlock['parentHash'] === '';
    const correctHash = genesisBlock['hash'] === '';
    const correctTxs = genesisBlock['transaction'].length === 0;

    if (!correctNonce || !correctParentHash || !correctHash || !correctTxs) {
      validChain = false;
    }
    return validChain;
  }

  // 새로운 블록을 만드는 코드
  createNewBlock(parentHash, hash, nonce) {
    const newBlock = {
      index: this.chain.length,
      timestamp: Date.now(),
      parentHash: parentHash,
      hash: hash,
      nonce: nonce,
      transactions: this.pendingTxs,
    };
    this.chain.push(newBlock);
    this.pendingTxs = [];

    return newBlock;
  }

  // 마지막 블록을 가져오는 코드
  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  // 리팩토링 된 후의 코드
  createNewTransaction(amount, sender, recipient) {
    const newTransaction = {
      transactionId: uuidv4().split('-').join(''),
      amount: amount,
      sender: sender,
      recipient: recipient,
    };
    return newTransaction;
  }

  // Transaction === Tx
  addNewTxToPendingTxs(newTransaction) {
    this.pendingTxs.push(newTransaction);
    return this.getLastBlock()['index'] + 1;
  }

  // 이전 블록의 해시 값 + 현재 블록의 데이터(트랜잭션) + 논스를 사용해서 현재 블록의 해시 값을 만드는 코드
  hashBlock(parentHash, currentBlockData, nonce) {
    const stringData =
      parentHash + JSON.stringify(currentBlockData) + nonce.toString();
    const hashedData = sha256(stringData);

    return hashedData;
  }

  pow(parentHash, currentBlockData) {
    let nonce = 0;
    let hashValue = this.hashBlock(parentHash, currentBlockData, nonce);
    while (hashValue.substring(0, 4) !== '0000') {
      nonce++;
      hashValue = this.hashBlock(parentHash, currentBlockData, nonce);
      console.log('hashValue 는 : ', hashValue);
    }
    return nonce;
  }
}

module.exports = Blockchain;
