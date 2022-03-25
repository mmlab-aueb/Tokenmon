
// IMPORTS
const Web3 = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const fs = require('fs');
const {Web3Storage} = require('web3.storage');
const {NFTStorage, File} = require('nft.storage');
// This import is required for converting the IPFS v1 cid to v0.
const CID = require('cids');

// IPFS IMPORTS
const IPFS = require('ipfs-http-client');
const Client = require('node-rest-client').Client;
const client = new Client();

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
 * Uploads a token on IPFS; artwork and metadata to IPFS.
 * 
 * @param {IPFSHTTPClient} - the ipfs node object.
 * @param {string} name - the name of the token
 * @param {string} desc - the description of the token
 * @param {JSON} attributes - the attributes of the token
 * @param {string} imagepath - the local path of the image artwork
 * @param {string} coverpath - the local path of the cover of the artwork
 * @returns {Promise} cid of the token's metadata folder
 */
async function uploadToken_IPFSify(ipfs, name, desc, attributes, imagepath, coverpath){
    
    console.log('Uploading cover of artwork on nft.storage...');
    let content = fs.readFileSync(coverpath);
    const cover_cid = await ipfs.add(content);
    console.log('SUCCESS!');

    console.log('Uploading encrypted artwork on nft.storage...');
    let encr_content = fs.readFileSync(imagepath);
    const artwork_cid = await ipfs.add(encr_content);
    console.log('SUCCESS!');
    
    const artwork_format = imagepath.split(".")[1];

    const token_metadata = {
        "name" : name,
        "description" : desc,
        "image" : artwork_cid.path,
        "cover" : cover_cid.path,
        "format": artwork_format,
        "attributes" : attributes
    };
    const token_toStr = JSON.stringify(token_metadata);

    console.log('Uploading token metadata on IPFS...');
    const file = new File([token_toStr], "metadata.json", {type: "text/plain"});
    const metadata_cid = await ipfs.add(file);
    console.log('SUCCESS! Token metadata CID; '+metadata_cid.cid);
    console.log('Swarming peers...');
    var swarm_peers = await ipfs.swarm.peers();
    console.log('SUCCESS! '+swarm_peers.length+" number of peers.");
    return metadata_cid.cid;

}
/**
 * 
 * Creates a unique static ENS address for the token.
 * 
 * @param {string} tid - the most recent NOT USED token id in order to be used. (stored in the smart contarct)
 * @param {string} cidv1 - the v1 cid of the token's metadata folder
 * @returns {Promise} the ENS address of the token that has been created
 */

async function createToken_IPFSify(ipfs, tid, cidv1){
  console.log('Creating ipns address...');
  const ipns_addr = await updateToken_IPFSify(ipfs, tid.toString(), cidv1);
  console.log("DONE creating IPNS address!")
  return ipns_addr;
}

/**
 * 
 * Updates the content hash of a token's ENS address to the latest cid.
 * 
 * @param {string} ensdomain - the ENS address of the token
 * @param {string} cidv1 - the new v1 cid of the token's folder to update to
 * @returns {Promise} result of the transaction from the interaction with ENS
 */

async function updateToken_IPFSify(ipfs, tid, cid){    
    let ipns_hash = await ipnsify(ipfs, tid, cid)
    return ipns_hash;
}
/**
 * Function for decrypting the token's encrypted artwork.
 * @param {string} tokenDomain The domain of the token.
 * @param {string} share1 One of the 3 keys (company/artist/owner)
 * @param {string} share2 Another one of the 3 keys (company/artist/owner) (must be different from share1)
 */
async function decryptToken_IPFSify(ipfs, tid, share1, share2){
    console.log("MAKE SURE THE IPFS DAEMON IS RUNNING.");
    console.log("Getting the content hash from token id:\'"+tid.toString()+"\' ...");
    const ipns_addr = await tokenmon.methods.getTokenURI(tid.toString()).call();

    console.log("SUCCESS!");
    // buffer object (ipfsobj)
    console.log("Resolving the IPNS address...");
    const ipfs_hash = await ipfs.name.resolve(ipns_addr.toString());
    console.log("Getting token metadata...");
    const ipfsobj = await ipfs.files.cat(ipfs_hash.split("/")[2])
    const metadata = JSON.parse(ipfsobj.toString());
    console.log("SUCCESS!");
    // Get encrypted image:
    console.log("Downloading the encrypted artwork...");
    const img_obj = await ipfs.files.cat(metadata["image"]);
    // TODO: fix download bug --> becomes udefined.
    console.log("SUCCESS!");
    //const enc_path = "temp/"+metadata["image"];
    const enc_path = 'temp/artwork.'+metadata['format']+".enc";
    console.log(enc_path);
    // Write encrypted image on disk
    console.log("Saving file on disk...");
    fs.createWriteStream(enc_path).write(img_obj);
    console.log("SUCCESS!");

    // Decrypt image:
    console.log("Decrypting artwork...");
    cpt.decrypt(enc_path, share1, share2);
    console.log("SUCCESS! Decrypted file saved in 'temp' folder...");
}

async function ipnsify(ipfs, tid, cidv1) {
    console.log('IPNSifying...');
    name_keys = [];
    //Exports all the keys to array name_keys
    const lista = await ipfs.key.list();
    var L = lista.length;
    for (var i = 0; i < L; i++) {
      var obj = lista[i];
      name_keys.push(obj.name);
    }
    if (name_keys.includes(tid)) {
      console.log("Key responding to", tid, "already exists.")
      console.log("Updating the existing key..")
      const ipns = await ipfs.name.publish(cidv1, {
        key: tid
      });
      console.log(`https://gateway.ipfs.io/ipns/${ipns.name}`);
      updateJSON(tid, cidv1.path, ipns.name)
      return ipns.name
  
    } else {
      console.log('Key for', tid, 'not found!');
      console.log('Generating Key...');
      key = await ipfs.key.gen(tid, {
        type: 'rsa',
        size: 2048
      })
      console.log("Publishing...");
      sleep(500)
      const ipns = await ipfs.name.publish(cidv1, {
          key: tid
        }
      );
      console.log(`https://gateway.ipfs.io/ipns/${ipns.name}`);
      updateJSON(tid, cidv1.path, ipns.name)
      return ipns.name
  
    }
}
  
  
function updateJSON(tid, cid, name) {
    var writeFile = true;
    var keys = JSON.parse(fs.readFileSync("keys/db.json", 'utf-8'));
  
    var key;
  
    if (keys[tid] == undefined) {
      console.log('No record for token with id = ' + tid.toString());
  
  
      keys[tid] = {
        'cid': cid,
        'name': name,
        'date': Date.now()
      };
  
    } else {
      console.log("1", keys[tid].cid, cid)
      if (keys[tid].cid != cid) {
        console.log("Updated cid, updating the file!")
        keys[tid] = {
          'cid': cid,
          'name': name,
          'date': Date.now()
        };
  
      } else {
        key = keys[tid]['key'];
        writeFile = false;
      }
    }
  
    if (writeFile) {
      console.log('Updating key database...');
      fs.writeFileSync("db.json", JSON.stringify(keys));
      console.log('SUCCESS!');
    }
}
  
function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}
  
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
  
  
async function get(name) {
    return new Promise(async (resolve,reject )=> {
      var start = Date.now();
      gateways = [
        'https://gateway.ipfs.io/ipns/',
        'https://cloudflare-ipfs.com/ipns/',
        'https://gateway.pinata.cloud/ipns/'
      ];
      var i = getRandomInt(3);
  
      client.get(gateways[i]+name,function(data,res){
        var duration = Date.now() - start;
        console.log('response',data.toString())
        resolve([duration,data.toString(),i]);
      });
  
    });
}

// -------------------- DEMO --------------------

async function createDemo(){
  const ipfs = await IPFS.create();
  let accounts = await web3.eth.getAccounts();
  const tid = await tokenmon.methods.getNextAvailableId().call();

  var artworkpath = cpt.encrypt(tid.toString(), 'img/artwork.jpg');
  const cid = await uploadToken_IPFSify(
    ipfs,
    'Earth Test',
    'Fernando Alonso, two-time formula one world champion. Goat.',
    {
        'racepace' : 'outstanding',
        'wdc' : '2'
    },
    artworkpath,
    'img/artwork.jpg'
  );

  const ipns_addr = await createToken_IPFSify(ipfs, tid, cid);
  const res = await tokenmon.methods.createToken(ipns_addr).send({
      from: accounts[0]
  });
  
  console.log(res);
}

async function updateDemo(){
  const ipfs = await IPFS.create();
  var artworkpath = cpt.encrypt("1", 'img/sebhm.jpg');
  const cid = await uploadToken_IPFSify(
    ipfs,
    'Sebastian Vettel',
    'Sebastian Vettel, four-time formula one world champion.',
    {
        'racepace' : 'excellent',
        'wdc' : '4'
    },
    artworkpath,
    'img/sebhm_cover.jpg'
  );

  const res = await updateToken_IPFSify(ipfs, "1", cid);
  console.log(res);
}

async function breakSealDemo(){
  const ipfs = require('ipfs-api')({host: "localhost", port: 5001, protocol: "http"});

  let accounts = await web3.eth.getAccounts();

  const sealIsBroken = await tokenmon.methods.isBroken("4").call();
  if(!sealIsBroken){
      const res = await tokenmon.methods.breakSeal("4").send({
          from: accounts[0]
      });
  }   
  await decryptToken_IPFSify(ipfs, "4", cpt.getKeys("4")["owner"], cpt.getKeys("4")["company"]);
  return 0;
}

async function createIPNSDemo(){
  const ipfs = await IPFS.create();
  const met_cid = await uploadToken_IPFSify(
      ipfs,
      "Ipfsify",
      "This is a test of ipfsify.",
      {
          "mosul" : "ipsum",
          "death" : "0"
      },
      "img/king.jpg",
      "img/king.jpg"
  );
  const ipname = await ipnsify(ipfs, "zero", met_cid);
  console.log(ipname);
};

async function updateIPNSDemo(){
  const ipfs = await IPFS.create();
  const cid = await uploadToken_IPFSify(
    ipfs,
    'Ipfsify2',
    'This is a test of ipfsify2.',
    {
      "mosul" : "ipsum",
      "death" : "0"
    },
    "img/nanopodio_cover.jpg",
    "img/nanopodio_cover.jpg"
  );

  const res = await updateToken_IPFSify(ipfs, "zero", cid);
  console.log(res);

}

async function kappa(){
  const ipns_addr = await tokenmon.methods.getTokenURI("3").call();
  return ipns_addr;  
}

breakSealDemo().then(console.log);