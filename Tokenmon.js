const Web3 = require('web3');
const fs = require('fs');
const {Web3Storage} = require('web3.storage');
const {NFTStorage, File} = require('nft.storage');
const CID = require('cids'); // This import is required for converting the IPFS v1 cid to v0.
const cpt = require('./cryptography');
const ipfs = require('ipfs-api')({host: "localhost", port: 5001, protocol: "http"});

/**
 * This class encapsulates all the mechanisms that support the 
 * Decentralized NFT-based Evolvable Games system. This version
 * leverages the Ethereum Name Service.
 */
class Tokenmon {
    
    #provider // = new HDWalletProvider()...
    #nftstorage_apikey // the NFT.storage api key
    #web3storage_apikey // the Web3.storage api key
    #web3 // the web3 object
    #contract // require('./Tokenmon')
    #nftStorageClient
    #web3StorageClient
    #accounts

    /**
     * 
     * @param {HDWalletProvider} provider 
     * @param {JSON} keys 
     * @param {web3.eth.Contract} contract 
     */
    constructor(provider, keys, contract){
        this.#nftstorage_apikey = keys.nftstorage_apikey;
        this.#web3storage_apikey = keys.web3storage_apikey;
        this.#provider = provider;
        this.#contract = contract;
        this.#web3 = new Web3(this.#provider);
        this.#nftStorageClient = new NFTStorage({token: this.#nftstorage_apikey});
        this.#web3StorageClient = new Web3Storage({ token: this.#web3storage_apikey });
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

        // Upload to nft.storage
        console.log('Uploading cover of artwork on nft.storage...');
        let content = fs.readFileSync(coverpath);

        const extension = coverpath.split('.')[1];
        const nft_metadata = await this.#nftStorageClient.store({
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
        const encr_metadata = await this.#nftStorageClient.store({
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
            "seal" : "intact",
            "attributes" : attributes
        };
        const token_toStr = JSON.stringify(token_metadata);

        //Upload to web3.storage
        console.log('Uploading token metadata on web3.storage...');
        const file = new File([token_toStr], "metadata.json", {type: "text/plain"});
        const folder_cid = await this.#web3StorageClient.put([file]);
        console.log('SUCCESS! Token metadata CID; '+folder_cid);
        return folder_cid;
    }

    /**
     * Creates a unique static ENS address for the token.
     * 
     * @param {string} tid - the most recent NOT USED token id in order to be used. (stored in the smart contarct)
     * @param {string} cidv1 - the v1 cid of the token's metadata folder
     * @returns {Promise} the ENS address of the token that has been created
     */
    async #createToken(tid, cidv1){
        
        console.log('Creating ENS subdomain...');
    
        let _domain = 'nyxto.eth';
        let _subdomain = 'finaltok'    
        let link = _subdomain + tid + '.' + _domain;

        console.log(this.#accounts[0]);
        // timer start
        let recordresult = await this.#web3.eth.ens.setSubnodeRecord(
            _domain,
            this.#web3.utils.soliditySha3(_subdomain+tid),
            this.#accounts[0],
            '0xf6305c19e814d2a75429Fd637d01F7ee0E77d615',
            60, // TTL seems to be redudant 
            {
                from: this.#accounts[0]
            }
        );
        console.log('SUCCESS!');

        const upd_res = await this.#updateToken(link, cidv1);

        return link;
    }

    /**
     * Updates the content hash of a token's ENS address to the latest cid.
     * 
     * @param {string} ensdomain - the ENS address of the token
     * @param {string} cidv1 - the new v1 cid of the token's folder to update to
     * @returns {Promise} result of the transaction from the interaction with ENS
     */
    async #updateToken(ensdomain, cidv1){
        const cidv0 = (new CID(cidv1)).toV0().toString();
        console.log("Updating ENS domain \'"+ensdomain+"\'...");
        const result = await this.#web3.eth.ens.setContenthash(
            ensdomain, 
            "ipfs://"+cidv0,
            {
                from: this.#accounts[0]
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
    async #decryptToken(tokenDomain, share1, share2){
        console.log("MAKE SURE THE IPFS DAEMON IS RUNNING.");

        console.log("Getting the content hash from \'"+tokenDomain+"\' ...");
        const hashobj = await this.#web3.eth.ens.getContenthash(tokenDomain);
        console.log("SUCCESS!");
        const content_hash = hashobj['decoded'];
        // buffer object (ipfsobj)
        console.log("Getting token metadata...");
        const ipfsobj = await ipfs.files.cat(content_hash+"/metadata.json");
        let metadata = JSON.parse(ipfsobj.toString());
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

        // Updating token metadta:
        metadata['seal'] = 'broken';
        const newMetadata_toStr = JSON.stringify(metadata);

        //Upload updated metadata to web3.storage
        console.log('Uploading UPDATED token metadata on web3.storage...');
        const file = new File([newMetadata_toStr], "metadata.json", {type: "text/plain"});
        const folder_cid = await this.#web3StorageClient.put([file]);
        console.log('SUCCESS! Token metadata CID; '+folder_cid);
        let transaction_res = await this.#updateToken(tokenDomain, folder_cid);
        return transaction_res;

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

        var encryptedArtworkPath = cpt.encrypt('finaltok'+tid.toString()+".nyxto.eth", artworkPath);
        const cid = await this.#uploadToken(
            name,
            desc,
            attributes,
            encryptedArtworkPath,
            artworkCoverPath
        );

        const link = await this.#createToken(tid, cid);
        const res = await this.#contract.methods.createToken(link).send({
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
    async update(ensdomain, name, desc, attributes, artworkPath, artworkCoverPath){
        var encryptedArtworkPath = cpt.encrypt(ensdomain, artworkPath);
        const cid = await this.#uploadToken(
            name,
            desc,
            attributes,
            encryptedArtworkPath,
            artworkCoverPath
        );

        const res = await this.#updateToken(ensdomain, cid);
        console.log(res);
    }


    /**
     * Breaks the seal of the token. Downloads artwork and decrypts it locally.
     * 
     * @param {String} tid - the tokein ID
     * @param {String} ensdomain - the Ethereum Name Service (ENS) address associated the token
     */
    async breakSeal(tid, ensdomain, keyshare1, keyshare2){

        const sealIsBroken = await this.#contract.methods.isBroken(tid.toString()).call();
        if(!sealIsBroken){
            this.#decryptToken(ensdomain, keyshare1, keyshare2);
            const res = await this.#contract.methods.breakSeal(tid.toString()).send({
                from: this.#accounts[0]
            });
            console.log('Done!');
        }
    }

}

module.exports = Tokenmon;