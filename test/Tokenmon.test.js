const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const provider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'cart remind main urban turn west isolate south deal liquid into left',
    // link to network (in this case Rinkeby test network)
    'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef'
);
const web3 = new Web3(provider);

const fs = require('fs');
const interface = require('../compile');
const abi = interface['abi'];
const bytecode = interface['evm']['bytecode']['object'];

const tokenmon = require('../Tokenmon');

async function timeTest(){
  const accounts = await web3.eth.getAccounts();
  let i = 1;
  while(i <= 16){
    console.log("Test No. "+i+"...");
    let start = Date.now();
    const tokid = await tokenmon.methods.createToken('test'+i).send({
      from: accounts[0]
    });
    let duration = Date.now() - start;
    let output = tokid + " " + duration;
    console.log(output);
    fs.appendFileSync('createToken_time.txt', output+"\n");
    i = i + 1;
  }
  
}

async function timeTest2(){
  const accounts = await web3.eth.getAccounts();
  let i = 1;
  while(i <= 16){
    console.log("Test No. "+i+"...");
    let duration = 0;
    let output = "error";
    try {
      let start = Date.now();
      const tokid = await tokenmon.methods.evolveToken(7, 'test'+i).send({
        from: accounts[0]
      });
      duration = Date.now() - start;
      output = tokid + " " + duration;
      console.log(output);
    } catch (error) {
      console.log("Error!");
    }
    fs.appendFileSync('./evolveToken_time.txt', output+"\n");
    i = i + 1;
  }
  
}

async function timeTest3(){
  const accounts = await web3.eth.getAccounts();
  let i = 1;
  let init_tid = 23;
  while(i <= 16){
    console.log("Test No. "+i+"...");
    let duration = 0;
    let output = "error 0";
    try {
      let start = Date.now();
      const tokid = await tokenmon.methods.fuseTokens(init_tid, init_tid+1,'testNEW'+i).send({
        from: accounts[0]
      });
      duration = Date.now() - start;
      output = tokid + " " + duration;
      console.log(output);
    } catch (error) {
      console.log('Error!');
    }
    fs.appendFileSync('./test/fuseTokens_time.txt', output+"\n");
    i = i + 1;
    init_tid += 2;
  }
  
}

async function timeTest4(){
  const accounts = await web3.eth.getAccounts();
  let i = 1;
  let init_tid = 35;
  while(i <= 16){
    console.log("Test No. "+i+"...");
    let duration = 0;
    let output = "error 0";
    try {
      let start = Date.now();
      const tokid = await tokenmon.methods.breakSeal(init_tid).send({
        from: accounts[0]
      });
      duration = Date.now() - start;
      output = tokid + " " + duration;
      console.log(output);
    } catch (error) {
      console.log('Error!');
    }
    fs.appendFileSync('./test/breakSeal_time.txt', output+"\n");
    i = i + 1;
    init_tid += 1;
  }
  
}

async function timeTest5(){
  const accounts = await web3.eth.getAccounts();
  let i = 1;
  let init_tid = 35;
  while(i <= 16){
    console.log("Test No. "+i+"...");
    let duration = 0;
    let output = "error 0";
    try {
      let start = Date.now();
      const tokid = await tokenmon.methods.transferFrom(accounts[0], accounts[0],init_tid).send({
        from: accounts[0]
      });
      duration = Date.now() - start;
      output = tokid + " " + duration;
      console.log(output);
    } catch (error) {
      console.log('Error!');
    }
    fs.appendFileSync('./test/transferFrom_time.txt', output+"\n");
    i = i + 1;
    init_tid += 1;
  }
  
}

async function timeTest6(){
  const accounts = await web3.eth.getAccounts();
  let i = 1;
  while(i <= 16){
    console.log("Test No. "+i+"...");
    let duration = 0;
    let output = "error 0";
    try {
      let start = Date.now();
      let _subdomain = "timetest" + i;
      let recordresult = await web3.eth.ens.setSubnodeRecord(
        "nyxto.eth",
        web3.utils.soliditySha3(_subdomain),
        accounts[0],
        '0xf6305c19e814d2a75429Fd637d01F7ee0E77d615',
        60, // TTL seems to be redudant 
        {
            from: accounts[0]
        }
      );
      duration = Date.now() - start;
      output = "[obj ob]" + " " + duration;
      console.log(output);
    } catch (error) {
      console.log('Error!');
    }
    fs.appendFileSync('./test/setSubnodeRecord_time.txt', output+"\n");
    i = i + 1;

  }
  
}

async function timeTest7(){
  const accounts = await web3.eth.getAccounts();
  let i = 1;
  while(i <= 16){
    console.log("Test No. "+i+"...");
    let duration = 0;
    let output = "error 0";
    try {
      let start = Date.now();
      let _subdomain = "timetest" + i;
      const result = await web3.eth.ens.setContenthash(
        _subdomain+".nyxto.eth", 
        "ipfs://QmbrFoaRTcuCZxRKUhssFZozYA66CxnKF2k5GY5d2fNuZW",
        {
            from: accounts[0]
        }
      );
      duration = Date.now() - start;
      output = "[obj ob]" + " " + duration;
      console.log(output);
    } catch (error) {
      console.log('Error!');
    }
    fs.appendFileSync('./test/setContentHash_time.txt', output+"\n");
    i = i + 1;

  }
  
}

async function timeTest8(){
  const accounts = await web3.eth.getAccounts();
  let i = 1;
  while(i <= 16){
    console.log("Test No. "+i+"...");
    let duration = 0;
    let output = "error 0";
    try {
      let start = Date.now();
      let _subdomain = "timetest" + i;
      const hashobj = await web3.eth.ens.getContenthash(_subdomain+".nyxto.eth");
      duration = Date.now() - start;
      output = "[obj ob]" + " " + duration;
      console.log(output);
    } catch (error) {
      console.log('Error!');
    }
    fs.appendFileSync('./test/getContentHash_time.txt', output+"\n");
    i = i + 1;

  }
  
}

async function test() {
  

  const accounts = await web3.eth.getAccounts();    
  
  const result2 = await tokenmon.methods.getTokenURI('21').call();
  console.log(result2);
  //const tokid = await tokenmon.methods.fuseTokens(18, 13+1,'testNEW').send({
    //from: accounts[0]
  //});
  //console.log(tokid);
}

async function costTest(){
  const accounts = await web3.eth.getAccounts();
  let i = 0
  while (i<10){
    console.log("Setting content hash... #" + i.toString());
    const result = await web3.eth.ens.setContenthash(
      "this.nyxto.eth", 
      "ipfs://QmbrFoaRTcuCZxRKUhssFZozYA66CxnKF2k5GY5d2fNuZW",
      {
          from: accounts[0]
      }
    );
    console.log("Done! gasUsed:"+result['gasUsed']);
    i++;
  }
  
  return 0;
}

//timeTest();
//timeTest2();
//timeTest3();
//timeTest4();
//timeTest5();
//timeTest6();
//timeTest7();
//timeTest8();
//test();
costTest().then((res) => {console.log(res);});
