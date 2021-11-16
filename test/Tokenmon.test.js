const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const provider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'cart remind main urban turn west isolate south deal liquid into left',
    // link to network (in this case Rinkeby test network)
    'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef'
);
const web3 = new Web3(provider);


const interface = require('../compile');
const abi = interface['abi'];
const bytecode = interface['evm']['bytecode']['object'];

const tokenmon = require('../Tokenmon');

async function test() {

    const accounts = await web3.eth.getAccounts();    
    // get current mint token ID
    const result = await tokenmon.methods.getIdcounter().call();
    console.log(result);
    //const tokid = await tokenmon.methods.createToken('test2.test.eth').send({
      //  from: accounts[0]
    //});
    const result2 = await tokenmon.methods.getTokenURI('0').call();
    console.log(result2);
}
test();
