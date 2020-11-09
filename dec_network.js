const Blockchain = require('./blockchain');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const rp = require('request-promise'); // 비동기 네트워크
const express = require('express');
const app = express();

const bitcoin = new Blockchain();

const nodeAddress = uuidv4().split('-').join('');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const port = process.argv[2];

// API Endpoint 로직이 들어 간다.
// 전체 블록체인을 가져오는 코드
app.get('/blockchain', (req, res) => {
  // req = request, res = response
  res.send(bitcoin);
});

// 모든 노드에게 새로운 트랜잭션을 전송한다
app.post('/transaction', (req, res) => {});

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

// 노드 간의 서로 연결되어 분산 네트워크 구축을 위한 API 엔드포인트다.
app.post('/node/registration-broadcasting', (req, res) => {
  // 한 노드에서 새로운 노드를 바디(body, 정보)에 실어서 보내는 코드
  const newNodeUrl = req.body.newNodeUrl;

  // 현재 네트워크 노드 공간(어레이)안에서 새로운 노드 url이 만약 포함되어 있지 않을 경우,
  // 새로운 노드 url을 networkNodes 어레이에 푸쉬(추가) 한다.
  if (!bitcoin.networkNodes.include(newNodeUrl)) {
    //include는 포함하다 라는 뜻
    bitcoin.networkNodes.push(newNodeUrl);
  }

  const nodeRegCompleted = [];
  // networkNodes에 포함된 모든 노드에게 새로운 노드가 등록 됬다는 사실을 전달하기 위해서
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
    // requestOption를 rp(reqeust-promise인데, 요청을 보냈을 때 그에 대한 응답이 모두 성공적으로 오는 걸 의미함)로 보내는 데 여기서
    // rp는 request-promise로 promise 비동기 전송 방식이다.
    // 네트워크에 여러 곳에 퍼져 있는 노드에게 새로운 노드 정보를 전송 할 때 언제 도착하는지 알 수가 없기 때문에
    // 비동기 방식인 rp로 처리하고 이 결과를 nodeRegCompleted(nodeRegistrationCompleted, 노드가 성공적으로 등록됨) 라는 배열에 푸쉬한다.
    nodeRegCompleted.push(rp(requestOptions));
  });

  // 마지막으로 nodeRegCompleted 배열을 promise then을 통해서 모든 node 등록 정보를
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
    // 결과적으로 모든 노드가 서로 싱크(동기화)를 맞추는 데 성공하면, 새로운 노드가 성공적으로 등록되었다는 메시지를 반환한다.
    // 마찬가지로 여기서도 then catch를 통해서 노드가 도착하지 않았을 경우 발생할 수 있는
    // 에러 코드를 만들 수 있지만 현재는 없는 상태이다.
    .then((data) => {
      res.json({ msg: 'New node is registered successfully' });
    });
});

// 새로운 노드를 네트워크 전체에 퍼져있는 노드에게 등록하는 코드이다.
// 바디(body)로 들어온 새로운 노드 url을 networkNodes에 이미 있는지 파악을 하고
// 그리고 현재 노드 url과 다르면 networkNodes 어레이(공간)에 새로운 노드를 푸쉬(추가)해서 등록한다.
app.post('/node/registration', (req, res) => {
  const newNodeUrl = req.body.newNodeUrl;
  const nodeNotInNetwork = !bitcoin.networkNodes.includes(newNodeUrl); // true
  const notCurrentNode = bitcoin.currentNodeUrl !== newNodeUrl; // true

  if (nodeNotInNetwork && notCurrentNode) {
    bitcoin.networkNodes.push(newNodeUrl);
  }
  res.json({
    msg: 'New node is successfully registrated',
  });
});

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

app.listen(port, () => {
  console.log(`Listening on port ${port}......changed`);
});
