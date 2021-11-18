
// IMPORTS
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const {Web3Storage} = require('web3.storage');
const {NFTStorage, File} = require('nft.storage');
// This import is required for converting the IPFS v1 cid to v0.
const CID = require('cids');

// This import is required to get the bytecode/abi of the smart contract.
const tokenmon = require('./Tokenmon');

// CONSTANTS - API KEYS
const nftstorage_apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFBMEE3ODJlZmRBRmUxRmFiMWE2NjBEYzUwZTg1MDE3YTMxODIxNDUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYyNjg2MDk1NTgzOCwibmFtZSI6InRlc3QifQ.lySWBgIWC6YxBcKo2CKHWqODWHePpJokOMpaJuXh5d0";
const web3storage_apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDM1QTMxZjNCNzQwNmE3ZTcwQUUwMDZBQTE4QjMxQ0ExZTg1MTNDRkYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2MjkyMjQzMzIyMzcsIm5hbWUiOiJ0b2tlbm1vbmJldGEifQ.QDe0h8ClUbpfyttqssCahs-x2sEhvRsGYbnq1ykUlMA";
const infura_link_ropsten = 'https://ropsten.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef';
const infura_link_rinkeby = 'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef';

// Prepare the Web3 provider. The HDWalletProvider has built in support for MetaMask.
const provider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'cart remind main urban turn west isolate south deal liquid into left',
    // link to network (in this case Rinkeby test network)
    'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef'
);

//Init web3.
const web3 = new Web3(provider);


/**
 * Uploads a token on IPFS; artwork to nft.storage and metadata to web3.storage.
 * 
 * @param {string} name - the name of the token
 * @param {string} desc - the description of the token
 * @param {JSON} attributes - the attributes of the token
 * @param {string} imagepath - the local path of the image artwork
 * @returns {Promise} cid of the token's metadata folder
 */
async function uploadToken(name, desc, attributes, imagepath){

    // Upload to nft.storage
    console.log('Uploading artwork on nft.storage...');
    const client = new NFTStorage({token: nftstorage_apikey});
    let content = fs.readFileSync(imagepath);

    const extension = imagepath.split('.')[1];
    const nft_metadata = await client.store({
        name: "name",
        description: 'desc',
        attributes: 'null',
        image: new File(
            [
                content
            ],
            'artwork.'+extension,
            { type: 'image/'+extension }
        )
    });
    console.log('SUCCESS!');
    
    const artwork_cid = nft_metadata.data.image.href.slice(7);
    const token_metadata = {
        "name" : name,
        "description" : desc,
        "image" : artwork_cid,
        "attributes" : attributes
    };
    const token_toStr = JSON.stringify(token_metadata);

    //Upload to web3.storage
    console.log('Uploading token metadata on web3.storage...');
    const file = new File([token_toStr], "metadata.json", {type: "text/plain"});
    const storage = new Web3Storage({ token: web3storage_apikey });
    const folder_cid = await storage.put([file]);
    console.log('SUCCESS! Token metadata CID; '+folder_cid);
    return folder_cid;

}
/**
 * 
 * Creates a unique static ENS address for the token.
 * 
 * @param {string} tid - the most recent NOT USED token id in order to be used. (stored in the smart contarct)
 * @param {string} cidv1 - the v1 cid of the token's metadata folder
 * @returns {Promise} the ENS address of the token that has been created
 */

async function createToken(tid, cidv1){
    
    let accounts = await web3.eth.getAccounts();

    console.log('Creating ENS subdomain...');
    
    let _domain = 'nyxto.eth';
    let _subdomain = 'atoken'    
    let link = _subdomain + tid + '.' + _domain;

    let recordresult = await web3.eth.ens.setSubnodeRecord(
        _domain,
        web3.utils.soliditySha3(_subdomain+tid),
        accounts[0],
        '0xf6305c19e814d2a75429Fd637d01F7ee0E77d615',
        60, // TTL seems to be redudant 
        {
            from: accounts[0]
        }
    );
    console.log('SUCCESS!');

    const upd_res = await updateToken(link, cidv1);

    return link;
}

/**
 * 
 * Updates the content hash of a token's ENS address to the latest cid.
 * 
 * @param {string} ensdomain - the ENS address of the token
 * @param {string} cidv1 - the new v1 cid of the token's folder to update to
 * @returns {Promise} result of the transaction from the interaction with ENS
 */

async function updateToken(ensdomain, cidv1){
    let accounts = await web3.eth.getAccounts();
    
    const cidv0 = (new CID(cidv1)).toV0().toString();
    
    console.log("Updating ENS domain \'"+ensdomain+"\'...");
    const result = await web3.eth.ens.setContenthash(
        ensdomain, 
        "ipfs://"+cidv0,
        {
            from: accounts[0]
        }
    );
    console.log('SUCCESS!');
    return result;
}



/**
 * upladDemo is a demo on how the functions are supposed to be used in order for the system to operate properly
 * @returns {Promise}
 */
async function uploadDemo() {
    let accounts = await web3.eth.getAccounts();

    const cid = await uploadToken(
        'Imperial Destroyer',
        'Cool looking spaceship, lorem ipsum.',
        {
            'region' : 'Core Worlds',
            'sector' : 'Alderaan Sector',
            'system' : 'Alderaan System',
        },
        'img/black_hole.jpg'
    );
    
    const tid = await tokenmon.methods.getIdcounter().call();
    const link = await createToken(tid, cid);
    const res = await tokenmon.methods.createToken(link).send({
        from: accounts[0]
    });
    console.log(res);
}


/**
 * updateDemo is a demo on how the functions are supposed to be used in order for the system to operate properly.
 * 
 * @returns {Promise}
 */
async function updateDemo(){

    let accounts = await web3.eth.getAccounts();

    const cid = await uploadToken(
        'Alderaan',
        'Alderaan, located in the Core Worlds, was a terrestrial planet covered with mountains. During the waning decades of the Galactic Republic, it was ruled by Queen Breha Organa and represented in the Galactic Senate by her husband, Senator Bail Prestor Organa.',
        {
            'region' : 'Core Worlds',
            'sector' : 'Alderaan Sector',
            'system' : 'Alderaan System',
            'suns' : "1",
            'moons' : "0",
            'grid-coordinates' : 'M-10',
            'trade-routes' : 'Commenor Run',
            'rotation-period' : '18SH',
            'orbital-period' : '364SD'
        },
        'img/alderaan.jpg'
    );
    const res = await updateToken('atoken2.nyxto.eth', cid);
    console.log(res);
}

//uploadDemo();
//updateDemo();