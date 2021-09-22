
// IMPORTS
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const ipfs = require('ipfs-api')({host: "localhost", port: 5001, protocol: "http"});
const fs = require('fs');
const {Web3Storage} = require('web3.storage');
const {NFTStorage, File} = require('nft.storage');
const CID = require('cids');

// CONSTANTS
const nftstorage_apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFBMEE3ODJlZmRBRmUxRmFiMWE2NjBEYzUwZTg1MDE3YTMxODIxNDUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYyNjg2MDk1NTgzOCwibmFtZSI6InRlc3QifQ.lySWBgIWC6YxBcKo2CKHWqODWHePpJokOMpaJuXh5d0";
const web3storage_apikey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDM1QTMxZjNCNzQwNmE3ZTcwQUUwMDZBQTE4QjMxQ0ExZTg1MTNDRkYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2MjkyMjQzMzIyMzcsIm5hbWUiOiJ0b2tlbm1vbmJldGEifQ.QDe0h8ClUbpfyttqssCahs-x2sEhvRsGYbnq1ykUlMA";
const infura_link_ropsten = 'https://ropsten.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef';
const infura_link_rinkeby = 'https://rinkeby.infura.io/3/ca6249643afa4dabbed3e314bbae53ef';

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
    
    // Get Image from nft.storage metadata:
    const metadata_buf = await ipfs.files.cat(nft_metadata.url.slice(7));
    const metadata = JSON.parse(metadata_buf.toString());
    const image_cid = metadata['image'].slice(7);
    
    const token_metadata = {
        "name" : name,
        "description" : desc,
        "image" : image_cid,
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

    // test alderaan bafybeia5oz6ryh2vs6jhhiabj2k2fcgsv27nf2yccpuufxxgvswfcuiwly
}

async function claimDomain(){

    
    const provider = new HDWalletProvider(
        // 12word mnemonic for the account to deploy the contract (must have some ether)
        'cart remind main urban turn west isolate south deal liquid into left',
        // link to network (in this case test network)
        infura_link_ropsten
    );


    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();

    console.log('Attempting to claim \'tokenmon0.eth\'...');
    let recordExists = await web3.eth.ens.recordExists('tokenmon0.eth');
    let result;
    if(!recordExists){
        try {
            result = await web3.eth.ens.setRecord(
                'tokenmon0.eth',
                accounts[0],
                "0xf6305c19e814d2a75429Fd637d01F7ee0E77d615", //default resolver for rinkeby
                10000000, // number of seconds for the domain to live
                {
                    from: accounts[0]
                },
                (data)=>{console.log(data)}
            );
        } catch (e) {
            console.log(e);
        }
    }
    
    return result;
}

async function updateToken(ensdomain, cidv1){
    const cidv0 = (new CID(cidv1)).toV0().toString();
    const provider = new HDWalletProvider(
        // 12word mnemonic for the account to deploy the contract (must have some ether)
        'cart remind main urban turn west isolate south deal liquid into left',
        // link to network (in this case test network)
        infura_link_rinkeby
    );
    
    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
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

async function extractCIDfromENS(address) {
    const provider = new HDWalletProvider(
        // 12word mnemonic for the account to deploy the contract (must have some ether)
        'cart remind main urban turn west isolate south deal liquid into left',
        // link to network (in this case test network)
        infura_link_rinkeby
    );
    
    const web3 = new Web3(provider);
    const result = await web3.eth.ens.getContenthash(address);
    return result['decoded'];
}

async function getTokenMetadata(cid){
    
    // Get the linker file pinned on web3.storage
    const metadata_res = await ipfs.files.cat(cid+"/metadata.json");
    const metadata = JSON.parse(metadata_res.toString());

    // Get the metadata file pinned on nft.storage
    /*const metadata_res = await ipfs.files.cat(metadata_cid);
    const metadata = metadata_res.toString();

    // Download the nft image.
    const image_link = metadata['image'];
    const image_cid = image_link.slice(7);
    const filename = image_cid.split('/')[1].trim(".");
    imagebuff = await ipfs.files.cat(image_cid);
    fs.createWriteStream(filename).write(res);*/

    return metadata;
}

/*uploadToken(
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
).then((cid) => {
    updateToken('nyxto.eth', cid)
});*/

//extractCIDfromENS('nyxto.eth').then(console.log);
//getTokenMetadata('QmQKfKnqt6rg1ZNzniz4vsrjHUeX93fvPzscMSZdi7uJJ1').then(console.log);

/*extractCIDfromENS('nyxto.eth').then((res) => {
    getTokenMetadata(res).then(console.log);
});*/
claimDomain().then(console.log);
//updateToken('nyxto.eth', 'bafybeia5oz6ryh2vs6jhhiabj2k2fcgsv27nf2yccpuufxxgvswfcuiwly').then(console.log);
//extractCIDfromENS('nyxto.eth').then(console.log);