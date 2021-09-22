const infura_link_ropsten = 'https://ropsten.infura.io/v3/45c5a5f117d04e99b771800907329d13';
const infura_link_rinkeby = 'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef';

const Web3 = require('web3');
const HDWalletProvider = require('truffle-hdwallet-provider');

const provider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'cart remind main urban turn west isolate south deal liquid into left',
    // link to network (in this case test network)
    infura_link_rinkeby
);

const web3 = new Web3(provider);

web3.eth.ens.getContenthash('nyxto.eth').then(
    (result) => {
        console.log(result);
    }
);