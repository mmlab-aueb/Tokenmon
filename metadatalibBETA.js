
// IMPORTS
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const {Web3Storage} = require('web3.storage');
const {NFTStorage, File} = require('nft.storage');
// This import is required for converting the IPFS v1 cid to v0.
const CID = require('cids');

const cpt = require('./cryptography');

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
 * @param {string} coverpath - the local path of the cover of the artwork
 * @returns {Promise} cid of the token's metadata folder
 */
async function uploadToken(name, desc, attributes, imagepath, coverpath){

    // Upload to nft.storage
    
    const client = new NFTStorage({token: nftstorage_apikey});
    console.log('Uploading cover of artwork on nft.storage...');
    let content = fs.readFileSync(coverpath);

    const extension = coverpath.split('.')[1];
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

    console.log('Uploading encrypted artwork on nft.storage...');
    let encr_content = fs.readFileSync(imagepath);

    const encr_extension_array = imagepath.split('.');
    const encr_extension = encr_extension_array[encr_extension_array.length - 2]+'.'+encr_extension_array[encr_extension_array.length - 1];
    const encr_metadata = await client.store({
        name: "name",
        description: 'desc',
        attributes: 'null',
        image: new File(
            [
                encr_content
            ],
            'artwork.'+encr_extension,
            { type: 'image/'+encr_extension }
        )
    });
    console.log('SUCCESS!');
    
    const cover_cid = nft_metadata.data.image.href.slice(7);
    const artwork_cid = encr_metadata.data.image.href.slice(7);
    const token_metadata = {
        "name" : name,
        "description" : desc,
        "image" : artwork_cid,
        "cover" : cover_cid,
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
    let _subdomain = 'abetatok'    
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
 * Function for decrypting the token's encrypted artwork.
 * @param {string} tokenDomain The domain of the token.
 * @param {string} share1 One of the 3 keys (company/artist/owner)
 * @param {string} share2 Another one of the 3 keys (company/artist/owner) (must be different from share1)
 */
async function decryptToken(tokenDomain, share1, share2){
    let accounts = await web3.eth.getAccounts();
    console.log("MAKE SURE THE IPFS DAEMON IS RUNNING.");
    const ipfs = require('ipfs-api')({host: "localhost", port: 5001, protocol: "http"});

    console.log("Getting the content hash from \'"+tokenDomain+"\' ...");
    const hashobj = await web3.eth.ens.getContenthash(tokenDomain);
    console.log("SUCCESS!");
    const content_hash = hashobj['decoded'];
    // buffer object (ipfsobj)
    console.log("Getting token metadata...");
    const ipfsobj = await ipfs.files.cat(content_hash+"/metadata.json");
    const metadata = JSON.parse(ipfsobj.toString());
    console.log("SUCCESS!");
    
    // Get encrypted image:
    console.log("Downloading the encrypted artwork...");
    const img_obj = await ipfs.files.cat(metadata["image"]);
    console.log("SUCCESS!");
    const enc_path = "temp/"+metadata["image"].split("/")[1];
    // Write encrypted image on disk
    console.log("Saving file on disk...");
    fs.createWriteStream(enc_path).write(img_obj);
    console.log("SUCCESS!");

    // Decrypt image:
    console.log("Decrypting artwork...");
    cpt.decrypt(enc_path, share1, share2);
    console.log("SUCCESS! Decrypted file saved in 'temp' folder...");
}

// -------------------- DEMO --------------------

async function cryptographyDemo(){
    let accounts = await web3.eth.getAccounts();
    const tid = await tokenmon.methods.getNextAvailableId().call();

    var artworkpath = cpt.encrypt('abetatok'+tid.toString()+".nyxto.eth", 'img/nanopodio.jpg');
    const cid = await uploadToken(
        'Fernando Alonso',
        'Fernando Alonso, two-time formula one world champion. Goat.',
        {
            'racepace' : 'outstanding',
            'wdc' : '2'
        },
        artworkpath,
        'img/nanopodio_cover.jpg'
    );

    const link = await createToken(tid, cid);
    const res = await tokenmon.methods.createToken(link).send({
        from: accounts[0]
    });
    
    console.log(res);
}

async function cryptographyUpdateDemo(){

    var artworkpath = cpt.encrypt("abetatok1.nyxto.eth", 'img/sebhm.jpg');
    const cid = await uploadToken(
        'Sebastian Vettel',
        'Sebastian Vettel, four-time formula one world champion.',
        {
            'racepace' : 'excellent',
            'wdc' : '4'
        },
        artworkpath,
        'img/sebhm_cover.jpg'
    );

    const res = await updateToken('abetatok1.nyxto.eth', cid);
    
    console.log(res);
}

async function breakSealDemo(){
    let accounts = await web3.eth.getAccounts();

    const sealIsBroken = await tokenmon.methods.isBroken("1").call();
    if(!sealIsBroken){
        const res = await tokenmon.methods.breakSeal("1").send({
            from: accounts[0]
        });
    }   
    decryptToken("abetatok1.nyxto.eth", cpt.getKeys("abetatok1.nyxto.eth")["owner"], cpt.getKeys("abetatok1.nyxto.eth")["company"]);
}