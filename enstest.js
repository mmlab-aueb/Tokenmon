// THIS IS A TEST FILE; TESTING ALTERNATIVE PROVIDERS (NOT TRUFFLE'S HDWALLETPROVIDER)

const Web3 = require('web3');

const web3 = new Web3(new Web3.providers.HttpProvider("https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef"));
web3.eth.accounts.wallet.add({
    privateKey: "0x39697f9632ff1ae9b48a788cd3f139934c8d792ff62462f25c9d89a222dacf6a",
    address: '0x14f9273D760E10c7Dc13b35d9236E77bd9f0CA2B'
});

console.log('Done adding accout...');
//console.log(web3.eth.accounts.wallet);
//web3.eth.getAccounts().then(console.log);

console.log('Attempting to claim \'tokenmon0.eth\'...');
let recordExists = web3.eth.ens.recordExists('tokenmon0.eth').then((exists) => {
    
    if(!exists){
        console.log('Record does NOT exist...');
        let result = web3.eth.ens.setRecord(
            'tokenmon0.eth',
            '0x14f9273D760E10c7Dc13b35d9236E77bd9f0CA2B',
            "0xf6305c19e814d2a75429Fd637d01F7ee0E77d615", //default resolver for rinkeby
            3600, // number of seconds for the domain to live
            {
                from: '0x14f9273D760E10c7Dc13b35d9236E77bd9f0CA2B',
            }
        ).then((res) => { console.log(res); });
    
    }
});

//web3.eth.getAccounts().then((res) => console.log(res));
web3.eth.getBalance('0x14f9273D760E10c7Dc13b35d9236E77bd9f0CA2B').then(console.log);
