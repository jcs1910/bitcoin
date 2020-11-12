const Blockchain = require('./blockchain');

const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser'); // 파싱

const rp = require('request-promise'); // 비동기 네트워크 async & await도 비동기 네트워크 연결 방법이지만 보기에는 동기적으로 보인다.

const express = require('express');
const request = require('request');
const app = express();

const bitcoin = new Blockchain();

const nodeAddress = uuidv4().split('-').join('');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// 1. 제일 먼저 포트(port)를 3000으로 고정시키지 않고 여러 노드(3001~3005)를 실행시키기 위해서 포트를 유동적으로 만드는 작업을 진행 하였음
// package.json 파일을 열어보면 노드 5개가 추가 되었음
// process.argv[2]는 package.json에 이미 만들어 놓은 5개의 노드 포트 번호 3001부터 3005까지를 의미한다.

const port = process.argv[2];

// API Endpoint 로직이 들어 간다.
// 전체 블록체인을 가져오는 코드
app.get('/blockchain', (req, res) => {
  // req = request, res = response
  res.send(bitcoin);
});

app.post('/transaction', (req, res) => {
  const newTransaction = req.body;

  // 만약 body에 아무런 데이터도 없는 경우, 에러 응답을 보내줘야 한다.
  if (Object.entries(newTransaction).length >= 3) {
    const blockIndex = bitcoin.addNewTxToPendingTxs(newTransaction);
    res.json({
      msg: `The new transaction will be added in block ${blockIndex}`,
    });
  } else if (0 < Object.entries(newTransaction).length < 3) {
    res.json({
      msg: 'Not enough Transaction Data',
    });
  } else {
    res.json({
      msg: 'No Transaction data',
    });
  }
});

app.post('/transaction/broadcast', (req, res) => {
  const transaction = req.body;

  const newTransaction = bitcoin.createNewTransaction(
    transaction.amount,
    transaction.sender,
    transaction.recipient
  );

  bitcoin.addNewTxToPendingTxs(newTransaction);

  const requestPromises = [];
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/transaction',
      method: 'POST',
      body: newTransaction,
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then((data) => {
    res.json({
      msg: 'Transaction created and broadcast successfully',
    });
  });
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

  const requestPromises = [];
  // 네트워크에 존재하는 모든 다른 노드들을 순회하면서 요청을 보낸다. 그리고 새로운 블록과 함께 있는 데이터를 그들에게 전송한다.
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/receive-new-block',
      method: 'POST',
      body: { newBlock: newBlock },
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  // 새로운 블록을 채굴 하는 것에 대한 블록 보상을 전파(broadcast)
  Promise.all(requestPromises)
    .then((data) => {
      const requestOptions = {
        uri: bitcoin.currentNodeUrl + '/transaction/broadcast',
        method: 'POST',
        body: {
          amount: 6.25,
          sender: '00',
          recipient: nodeAddress,
        },
        json: true,
      };
      return rp(requestOptions);
    })
    .then((data) => {
      res.json({
        msg: 'New block mined and broadcast successfully',
        block: newBlock,
      });
    });
});

app.post('/receive-new-block', (req, res) => {
  // 유효한 블록인지 검증을 한다. 첫 번째, 해시를 검증 두 번째, 블록의 인덱스(번호)
  const newBlock = req.body.newBlock;
  const lastBlock = bitcoin.getLastBlock();

  const validHash = lastBlock['hash'] === newBlock['parentHash'];
  const validIndex = lastBlock['index'] + 1 === newBlock['index'];

  if (validHash && validIndex) {
    bitcoin.chain.push(newBlock);
    bitcoin.pendingTxs = [];
    res.json({
      msg: 'New Block received and accepted',
      newBlock: newBlock,
    });
  } else {
    res.json({
      msg: 'New Block rejected',
      newBlock: newBlock,
    });
  }
});

// 4. 노드 간의 서로 연결되어 분산 네트워크 구축을 위한 API 엔드포인트다.
app.post('/node/registration-broadcasting', (req, res) => {
  // 5. 한 노드에서 새로운 노드를 바디(body, 정보)에 실어서 보내는 코드
  const newNodeUrl = req.body.newNodeUrl; // localhost:3002

  // 6. 현재 네트워크 노드 공간(어레이)안에서 새로운 노드 url이 만약 포함되어 있지 않을 경우,
  // 새로운 노드 url을 networkNodes 어레이에 푸쉬(추가) 한다.
  if (!bitcoin.networkNodes.includes(newNodeUrl)) {
    //include는 포함하다 라는 뜻
    bitcoin.networkNodes.push(newNodeUrl);
  }

  const nodeRegCompleted = [];
  // 7. networkNodes에 포함된 모든 노드에게 새로운 노드가 등록 됬다는 사실을 전달하기 위해서
  // 네트워크 노드에 있는 노드 하나 하나를 for문으로 순회하면서 /node/registration 엔드포인트에
  // 접근하도록 한다. 그럼 /node/registration 코드를 한 번 살펴보자..

  // networkNodes에 포함된 모든 노드에게 새로운 노드가 등록 되었다는 사실을 전파하는 코드
  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/node/registration',
      method: 'POST',
      body: { newNodeUrl: newNodeUrl },
      json: true,
    };
    // 9. requestOption를 rp(reqeust-promise인데, 요청을 보냈을 때 그에 대한 응답이 모두 성공적으로 오는 걸 의미함)로 보내는 데 여기서
    // rp는 request-promise로 promise 비동기 전송 방식이다.
    // 네트워크에 여러 곳에 퍼져 있는 노드에게 새로운 노드 정보를 전송 할 때 언제 도착하는지 알 수가 없기 때문에
    // 비동기 방식인 rp로 처리하고 이 결과를 nodeRegCompleted(nodeRegistrationCompleted, 노드가 성공적으로 등록됨) 라는 배열에 푸쉬한다.
    nodeRegCompleted.push(rp(requestOptions));
  });

  // 10. 마지막으로 nodeRegCompleted 배열을 promise then을 통해서 모든 node 등록 정보를
  // 한 꺼번에 담는 코드이다. /node/registration/all 코드를 잠깐 살펴 본다.
  Promise.all(nodeRegCompleted)
    .then((data) => {
      const allRegistrationOpt = {
        uri: newNodeUrl + '/node/registration/all',
        method: 'POST',
        body: {
          allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl],
        },
        json: true,
      };
      return rp(allRegistrationOpt);
    })
    // 12. 결과적으로 모든 노드가 서로 싱크(동기화)를 맞추는 데 성공하면, 새로운 노드가 성공적으로 등록되었다는 메시지를 반환한다.
    // 마찬가지로 여기서도 then catch를 통해서 노드가 도착하지 않았을 경우 발생할 수 있는
    // 에러 코드를 만들 수 있지만 현재는 없는 상태이다.
    .then((data) => {
      res.json({ msg: 'New node is registered successfully' });
    })
    .catch((error) => {
      throw new Error(error);
    });
});

// 8. 새로운 노드를 네트워크 전체에 퍼져있는 노드에게 등록하는 코드이다.
// 바디(body)로 들어온 새로운 노드 url을 8.1 networkNodes에 이미 있는지 파악을 하고
// 8.2 그리고 현재 노드 url과 다르면 networkNodes 어레이(공간)에 새로운 노드를 푸쉬(추가)해서 등록한다.
app.post('/node/registration', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl; // newNodeUrl = localhost:3002
  const nodeNotInNetwork = !bitcoin.networkNodes.includes(newNodeUrl); // true
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl; // true

  if (nodeNotInNetwork && notCurrentNode) {
    bitcoin.networkNodes.push(newNodeUrl);
  }
  res.json({
    msg: 'New node is successfully registrated',
  });
});

// 11. body에 모든 네트워크 노드를 담아와서 새로 등록된 노드에게 현재 노드들의 정보를 모두 담아서 전달하는 코드이다.
// 12번으로 이동
app.post('/node/registration/all', (req, res) => {
  const allNetworkNodes = req.body.allNetworkNodes;
  allNetworkNodes.forEach((networkNodeUrl) => {
    const nodeNotInNetwork = !bitcoin.networkNodes.includes(networkNodeUrl);
    const notCurrentNode = bitcoin.currentNodeUrl !== networkNodeUrl;

    if (nodeNotInNetwork && notCurrentNode) {
      // && == and
      bitcoin.networkNodes.push(networkNodeUrl);
    }
  });
  res.json({ msg: 'All nodes are successfully synchronized' });
});

// Get 합의 과정(Consensus)에 관한 API
app.get('/consensus', (req, res) => {
  const requestPromises = [];

  bitcoin.networkNodes.forEach((networkNodeUrl) => {
    const requestOptions = {
      uri: networkNodeUrl + '/blockchain',
      method: 'GET',
      json: true,
    };
    requestPromises.push(rp(requestOptions));
  });

  Promise.all(requestPromises).then((blockchains) => {
    const currentChainLength = bitcoin.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain = null;
    let newPendingTxs = null;

    // 모든 블록체인을 순회하면서 어떤 체인이 가장 긴 체인인지 확인을 한다.
    blockchains.forEach((blockchain) => {
      // 다른 노드의 블록체인이 더 긴 체인인지 확인을 한다
      if (blockchain.chain.length > maxChainLength) {
        maxChainLength = blockchain.chain.length;
        newLongestChain = blockchain.chain;
        newPendingTxs = blockchain.pendingTxs;
      }
    });
    if (
      !newLongestChain ||
      (newLongestChain && !bitcoin.chainIsValid(newLongestChain))
    ) {
      res.json({
        msg: 'Current chain is the longest so it is not replaced(changed)',
        chain: bitcoin.chain,
      });
    } else if (newLongestChain && bitcoin.chainIsValid(newLongestChain)) {
      // 다른 어떤 노드가 가진 체인이 가장 긴 블록체인으로 판명 됬으니, 현재 노드의 블록체인을 바꿈
      bitcoin.chain = newLongestChain;
      bitcoin.pendingTxs = newPendingTxs;

      res.json({
        msg: 'The chain has been replaced(changed)',
        chain: bitcoin.chain,
      });
    }
  });
});

app.get('/block/:blockHash', (req, res) => {
  const blockHash = req.params.blockHash;
  const correctBlock = bitcoin.getBlockByHash(blockHash);
  res.json({
    block: correctBlock,
  });
});

app.get('/block-number/:blockNumber', (req, res) => {
  const blockNumber = req.params.blockNumber;
  const correctBlock = bitcoin.getBlockByNumber(blockNumber);
  res.json({
    block: correctBlock,
  });
});

app.get('/address/:address', (req, res) => {
  const address = req.params.address;
  const addressData = bitcoin.getAddressData(address);
  res.json({
    addressData: addressData,
  });
});

app.get('/transaction/:transactionId', (req, res) => {
  const transactionId = req.params.transactionId; // transactionId = 30e23a32ff314fe28ac15a54ba7c2de4
  const transactionData = bitcoin.getTransaction(transactionId);
  res.json({
    block: transactionData.block,
  });
});

app.get('/block-explorer', (req, res) => {
  res.sendFile('./block-explorer/index.html', { root: __dirname });
});

// 2. 고정 포트 3000을 지우고 변수 포트(port)를 대입한다.
// 터미널 5개를 만들어서 각 터미널에서 노드가 제대로 동작이 되는지 확인한다
// 노드간 서로 연결을 위해서 필요한 작업을 blockchain.js에서 다시 진행한다.
app.listen(port, () => {
  // callback => 다시 알려줌/ 다시 응답 해줌
  console.log(`Listening on port ${port}......changed`);
});
