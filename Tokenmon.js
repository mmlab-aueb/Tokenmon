const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const provider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'cart remind main urban turn west isolate south deal liquid into left',
    // link to network (in this case Rinkeby test network)
    'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef'
);
const web3 = new Web3(provider);

const interface = require('./compile');
const abi = interface['abi'];
const bytecode = interface['evm']['bytecode']['object'];

module.exports = new web3.eth.Contract(abi,'0xd0d1497F7478e07ED49154602F865eC265d4863c');