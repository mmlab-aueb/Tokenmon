const TokenmonIPNS = require('./TokenmonIPNS');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const cpt = require('./cryptography');


// This import is required to get the bytecode/abi of the smart contract.
const my_contract = require('./Contract');

const my_provider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'cart remind main urban turn west isolate south deal liquid into left',
    // link to network (in this case Rinkeby test network)
    'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef'
);

// IPFS IMPORTS -- must be imported
const IPFS = require('ipfs-http-client');
const ipfs = IPFS.create();

/*tok.init().then(()=>{
    tok.upload(
        'Makunga Alonso',
        'Makunga Alonso, two-time formula one world champion. Goat.',
        {
            'racepace' : 'outstanding',
            'wdc' : '2'
        },
        'img/nanopodio.jpg',
        'img/nanopodio_cover.jpg'
    );
});*/

/*tok.init().then(()=>{
    tok.update(
        "finaltok10.nyxto.eth",
        'Ungabunga Vettel',
        'Ungabunga Vettel, four-time formula one world champion.',
        {
            'racepace' : 'excellent',
            'wdc' : '4'
        },
        'img/sebhm_cover.jpg',
        'img/sebhm_cover.jpg'
    );
});*/

/*tok.init().then(()=>{
    tok.breakSeal(
        "10",
        "finaltok10.nyxto.eth",
        cpt.getKeys("finaltok10.nyxto.eth")["owner"],
        cpt.getKeys("finaltok10.nyxto.eth")["company"]
    );
});*/

async function main(){
    const ipfs = await IPFS.create();
    var tok = new TokenmonIPNS(
        ipfs,
        my_provider,
        {
            "nftstorage_apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFBMEE3ODJlZmRBRmUxRmFiMWE2NjBEYzUwZTg1MDE3YTMxODIxNDUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYyNjg2MDk1NTgzOCwibmFtZSI6InRlc3QifQ.lySWBgIWC6YxBcKo2CKHWqODWHePpJokOMpaJuXh5d0",
            "web3storage_apikey":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDM1QTMxZjNCNzQwNmE3ZTcwQUUwMDZBQTE4QjMxQ0ExZTg1MTNDRkYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2MjkyMjQzMzIyMzcsIm5hbWUiOiJ0b2tlbm1vbmJldGEifQ.QDe0h8ClUbpfyttqssCahs-x2sEhvRsGYbnq1ykUlMA"   
        },
        my_contract
    );
    await tok.init();

    // Upload

    /*await tok.upload(
        'Makunga Alonso',
        'Makunga Alonso, two-time formula one world champion. Goat.',
        {
            'racepace' : 'outstanding',
            'wdc' : '2'
        },
        'img/nanopodio.jpg',
        'img/nanopodio_cover.jpg'
    );*/

    /*await tok.update(
        "12",
        'Ungabunga Vettel',
        'Ungabunga Vettel, four-time formula one world champion.',
        {
            'racepace' : 'excellent',
            'wdc' : '4'
        },
        'img/sebhm.jpg',
        'img/sebhm_cover.jpg'
    );*/

    /*await tok.breakSeal(
        "12",
        cpt.getKeys("12")["owner"],
        cpt.getKeys("12")["company"]
    );*/

}

main().then(()=>{});