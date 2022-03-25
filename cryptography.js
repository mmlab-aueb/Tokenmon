const crypto = require('crypto');
/**
 * Shamir's threshold secret sharing scheme for JavaScript.
 */
const secrets = require('secrets.js-grempe');
const fs = require('fs');


/**
 * Temporary function to interact with the local database to fetch the keys of a token.
 * @param {string} tokenDomain The token's domain.
 * @returns {JSON} A JSON object containing the keys associated with the token's domain.
 */
function getKeys(tokenDomain){
    const keys = JSON.parse(fs.readFileSync('keys/keys.json'));
    return keys[tokenDomain];
}

/**
 * Encryption function for encrypting files using Shamir's threshold secret sharing scheme.
 * @param {string} tokenDomain The token's domain.
 * @param {string} source The artwork path.
 * @returns {string} The path of the encrypted artwork file.
 */
function encrypt(tokenDomain, source){
    var writeFile = true;
    var keys = JSON.parse(fs.readFileSync("keys/keys.json",'utf-8'));

    var key;
    if(keys[tokenDomain] == undefined){
        console.log('No keys record for token with tokenDomain = '+tokenDomain.toString());
        console.log('Generating key...');
        key = crypto.randomBytes(32).toString('hex'); //generating random nft related key
        // break the key in 3 keys
        console.log('Generating shares...');
        const shares = secrets.share(key,3,2);
        
        keys[tokenDomain] = {
            'key' : key,
            'company' : shares[0],
            'artist' : shares[1],
            'owner' : shares[2]
        };
        
    } else {
        key = keys[tokenDomain]['key'];
        writeFile = false;
    }


    // create a cipher algorithm
    const cipher = crypto.createCipher('aes-256-cbc', key);
    const input = fs.createReadStream(source);
    var output = fs.createWriteStream(source+'.enc')
    input.pipe(cipher).pipe(output);

    //console.log(keys);
    if(writeFile){
        console.log('Updating key database...');
        fs.writeFileSync("keys/keys.json", JSON.stringify(keys));
        console.log('SUCCESS!');
    }

    return source+'.enc';
}

/**
 * Decryption function for decrypting files using Shamir's threshold secret sharing scheme.
 * @param {string} source The path of the encrypted file.
 * @param {string} share1 One of the 3 keys (company/artist/owner)
 * @param {string} share2 Another one of the 3 keys (company/artist/owner)
 */
function decrypt(source, share1, share2){
    const shares = [share1, share2];
    const key = secrets.combine(shares);
    const cipher = crypto.createDecipher('aes-256-cbc', key);

    const input = fs.createReadStream(source);
    var new_source_array = source.replace('.enc','');
    var output = fs.createWriteStream(new_source_array);

    input.pipe(cipher).pipe(output);

    output.on('finish', function() {
        console.log('Decrypted file written to disk!',key); //encrypting image file
    });
}

exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.getKeys = getKeys;