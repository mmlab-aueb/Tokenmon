const Web3 = require('web3');
const fs = require('fs');
const {Web3Storage} = require('web3.storage');
const {NFTStorage, File} = require('nft.storage');
const CID = require('cids'); // This import is required for converting the IPFS v1 cid to v0.
const cpt = require('./cryptography');
const ipfs = require('ipfs-api')({host: "localhost", port: 5001, protocol: "http"});

// IPFS IMPORTS -- must be imported
const IPFS = require('ipfs-http-client');

/**
 * This class encapsulates all the mechanisms that support the 
 * Decentralized NFT-based Evolvable Games system. This version
 * leverages the InterPlanetary Name Service.
 */
class TokenmonIPNS {

    #ipfs
    #provider // = new HDWalletProvider()...
    #web3 // the web3 object
    #contract // require('./Tokenmon')
    #accounts

    /**
     * @param {IPFS Client} ipfs
     * @param {HDWalletProvider} provider 
     * @param {web3.eth.Contract} contract 
     */
    constructor(ipfs, provider, contract){
        this.#ipfs = ipfs;
        this.#provider = provider;
        this.#contract = contract;
        this.#web3 = new Web3(this.#provider);
    }

    /**
     * Important function to set up any web3 components that
     * require asynchronous calls.
     */
    async init(){
        console.log("Fetching web3 accounts...");
        this.#accounts = await this.#web3.eth.getAccounts();
        console.log("DONE!");
    }

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
    async #uploadToken(name, desc, attributes, imagepath, coverpath){

        console.log('Uploading cover of artwork on nft.storage...');
        let content = fs.readFileSync(coverpath);
        const cover_cid = await this.#ipfs.add(content);
        console.log('SUCCESS!');
    
        console.log('Uploading encrypted artwork on nft.storage...');
        let encr_content = fs.readFileSync(imagepath);
        const artwork_cid = await this.#ipfs.add(encr_content);
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
        const metadata_cid = await this.#ipfs.add(file);
        console.log('SUCCESS! Token metadata CID; '+metadata_cid.cid);
        console.log('Swarming peers...');
        var swarm_peers = await this.#ipfs.swarm.peers();
        console.log('SUCCESS! '+swarm_peers.length+" number of peers.");
        return metadata_cid.cid;
    }

    /**
     * Creates a unique static ENS address for the token.
     * 
     * @param {string} tid - the most recent NOT USED token id in order to be used. (stored in the smart contarct)
     * @param {string} cidv1 - the v1 cid of the token's metadata folder
     * @returns {Promise} the ENS address of the token that has been created
     */
    async #createToken(tid, cidv1){
        console.log('Creating ipns address...');
        const ipns_addr = await this.#updateToken(tid.toString(), cidv1);
        console.log("DONE creating IPNS address!")
        return ipns_addr;
    }

    /**
     * Updates the content hash of a token's ENS address to the latest cid.
     * 
     * @param {string} ensdomain - the ENS address of the token
     * @param {string} cidv1 - the new v1 cid of the token's folder to update to
     * @returns {Promise} result of the transaction from the interaction with ENS
     */
    async #updateToken(tid, cidv1){
        let ipns_hash = await this.#ipnsify(tid, cidv1)
        return ipns_hash;
    }

    /**
     * Function for decrypting the token's encrypted artwork.
     * @param {string} share1 One of the 3 keys (company/artist/owner)
     * @param {string} share2 Another one of the 3 keys (company/artist/owner) (must be different from share1)
     */
    async #decryptToken(tid, share1, share2){
        // A different IPFS object is required from a different module some IPFS modules do not contain the 'files' library.
        const ipfsWithFilesAPI = require('ipfs-api')({host: "localhost", port: 5001, protocol: "http"});
        console.log("MAKE SURE THE IPFS DAEMON IS RUNNING.");
        console.log("Getting the content hash from token id:\'"+tid.toString()+"\' ...");
        const ipns_addr = await this.#contract.methods.getTokenURI(tid.toString()).call();

        console.log("SUCCESS!");
        // buffer object (ipfsobj)
        console.log("Resolving the IPNS address...");
        const ipfs_hash_async_item = await this.#ipfs.name.resolve(ipns_addr.toString());
        console.log("Getting token metadata...");
        let ipfs_hash;
        for await (const item of ipfs_hash_async_item) {
            ipfs_hash = item;
        }
        const ipfsobj = await ipfsWithFilesAPI.files.cat(ipfs_hash.split("/")[2]);
        const metadata = JSON.parse(ipfsobj.toString());
        console.log("SUCCESS!");
        // Get encrypted image:
        console.log("Downloading the encrypted artwork...");
        const img_obj = await ipfsWithFilesAPI.files.cat(metadata["image"]);
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

    async #ipnsify(tid, cidv1) {
        console.log('IPNSifying...');
        let name_keys = [];
        //Exports all the keys to array name_keys
        const lista = await this.#ipfs.key.list();
        var L = lista.length;
        for (var i = 0; i < L; i++) {
          var obj = lista[i];
          name_keys.push(obj.name);
        }
        if (name_keys.includes(tid)) {
          console.log("Key responding to", tid, "already exists.")
          console.log("Updating the existing key..")
          const ipns = await this.#ipfs.name.publish(cidv1, {
            key: tid
          });
          console.log(`https://gateway.ipfs.io/ipns/${ipns.name}`);
          this.#updateJSON(tid, cidv1.path, ipns.name)
          return ipns.name
      
        } else {
          console.log('Key for', tid, 'not found!');
          console.log('Generating Key...');
          let key = await ipfs.key.gen(tid, {
            type: 'rsa',
            size: 2048
          })
          console.log("Publishing...");
          sleep(500)
          const ipns = await this.#ipfs.name.publish(cidv1, {
              key: tid
            }
          );
          console.log(`https://gateway.ipfs.io/ipns/${ipns.name}`);
          updateJSON(tid, cidv1.path, ipns.name)
          return ipns.name
      
        }
    }
      
      
    #updateJSON(tid, cid, name) {
        var writeFile = true;
        var keys = JSON.parse(fs.readFileSync("keys/db.json", 'utf-8'));

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
          fs.writeFileSync("keys/db.json", JSON.stringify(keys));
          console.log('SUCCESS!');
        }
    }
      
    #sleep(milliseconds) {
        const date = Date.now();
        let currentDate = null;
        do {
          currentDate = Date.now();
        } while (currentDate - date < milliseconds);
    }
      
    #getRandomInt(max) {
        return Math.floor(Math.random() * max);
    }

    /**
     * Uploads artwork on NFT.storage and metadata on web3.storage. Mints
     * a new token.
     * 
     * @param {String} name - the name of the token
     * @param {String} desc - the description of the token
     * @param {JSON} attributes - the attributes of the token
     * @param {String} artworkPath - the path to the full artwork
     * @param {String} artworkCoverPath - the path to the artwork cover
     */
    async upload(name, desc, attributes, artworkPath, artworkCoverPath){

        const tid = await this.#contract.methods.getNextAvailableId().call();

        var encryptedArtworkPath = cpt.encrypt(tid.toString(), artworkPath);
        const cid = await this.#uploadToken(
            name,
            desc,
            attributes,
            encryptedArtworkPath,
            artworkCoverPath
        );

        const ipns_addr = await this.#createToken(tid, cid);
        const res = await this.#contract.methods.createToken(ipns_addr).send({
            from: this.#accounts[0]
        });
        
        console.log(res);
    }

    /**
     * Updates (evolves) token associated with a specific ENS address.
     * 
     * @param {String} ensdomain - - the Ethereum Name Service (ENS) address associated the token
     * @param {String} name - the name of the token
     * @param {String} desc - the description of the token
     * @param {JSON} attributes - the attributes of the token
     * @param {String} artworkPath - the path to the full artwork
     * @param {String} artworkCoverPath - the path to the artwork cover
     */
    async update(tid, name, desc, attributes, artworkPath, artworkCoverPath){
        var encryptedArtworkPath = cpt.encrypt(tid.toString(), artworkPath);
        const cid = await this.#uploadToken(
            name,
            desc,
            attributes,
            encryptedArtworkPath,
            artworkCoverPath
        );

        const res = await this.#updateToken(tid.toString(), cid);
        console.log(res);
    }


    /**
     * Breaks the seal of the token. Downloads artwork and decrypts it locally.
     * 
     * @param {String} tid - the tokein ID
     */
    async breakSeal(tid, keyshare1, keyshare2){

        const sealIsBroken = await this.#contract.methods.isBroken(tid.toString()).call();
        if(!sealIsBroken){
            const res = await this.#contract.methods.breakSeal(tid.toString()).send({
                from: this.#accounts[0]
            });
        }   
        await this.#decryptToken(tid, keyshare1, keyshare2);
        return 0;
    }

}

module.exports = TokenmonIPNS;