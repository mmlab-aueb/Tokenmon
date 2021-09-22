// Source of ether (unlock account)
const HDWalletProvider = require('truffle-hdwallet-provider');

const Web3 = require('web3');
const interface = require('./compile');
const abi = interface['abi'];
const bytecode = interface['evm']['bytecode']['object'];

const provider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'cart remind main urban turn west isolate south deal liquid into left',
    // link to network (in this case Rinkeby test network)
    'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef'
);

const web3 = new Web3(provider);

let contract;

// Helper function to use async/await
// Async/Await can ONLY be used inside a function!
const deploy = async () => {

    const accounts = await web3.eth.getAccounts();
    console.log('Attempting to deploy from account', accounts[0]);
    
    contract = await new web3.eth.Contract(abi)
		.deploy({
			data: bytecode,
		})
		.send({
			from: accounts[0],
			gas: '1000000'
		});

	contract.setProvider(provider);
    console.log(abi);
    console.log('Smart Contract Address:', contract.options.address);

};
deploy();