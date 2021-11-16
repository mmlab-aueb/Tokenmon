// THIS IS A TEST FILE; TESTING ALTERNATIVE PROVIDERS (NOT TRUFFLE'S HDWALLETPROVIDER)
const Web3 = require('web3');
const infura_link_rinkeby = 'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef';
const pocket_network_link_rinkeby = 'https://eth-rinkeby.gateway.pokt.network/v1/lb/614b7e9808bcf4003446cc9a';
//web3.setProvider(new Web3.providers.WebsocketProvider('ws://localhost:8546'));
const web3 = new Web3(new Web3.providers.HttpProvider(infura_link_rinkeby));
var wallet = web3.eth.accounts.wallet.create(0, []);
var account = web3.eth.accounts.privateKeyToAccount('0x39697f9632ff1ae9b48a788cd3f139934c8d792ff62462f25c9d89a222dacf6a');
wallet.add(account);
console.log(wallet['0']['address']);
//web3.eth.getAccounts().then((res) => console.log(res));
/*web3.eth.accounts.wallet.add({
    privateKey: "0x39697f9632ff1ae9b48a788cd3f139934c8d792ff62462f25c9d89a222dacf6a",
    address: '0x14f9273D760E10c7Dc13b35d9236E77bd9f0CA2B'
});*/

console.log('Done adding account...');
//console.log(web3.eth.accounts.wallet);
//web3.eth.getAccounts().then(console.log);

const main = async () => {
    console.log('Attempting to claim \'tokenmon0.eth\'...');
    let recordExists = await web3.eth.ens.recordExists('tokenmon0.eth');
    console.log(recordExists);
    if(!recordExists){
        console.log('Record does NOT exist... setting record.');
        let result = await web3.eth.ens.setRecord(
            'tokenmon0.eth',
            wallet['0']['address'],
            "0xf6305c19e814d2a75429Fd637d01F7ee0E77d615", //default resolver for rinkeby
            1000000, // number of seconds for the domain to live
            {
                from: wallet['0']['address'],
            }
        );
        console.log(result);
    }
};

main();


//web3.eth.getBalance('0x14f9273D760E10c7Dc13b35d9236E77bd9f0CA2B').then(console.log);
