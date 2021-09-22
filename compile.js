// Path module (preinstalled in npm)
// cross-platform support for paths (macOS, Windows, linux, ...)
const path = require('path');
//import path from 'path';
// Filesystem module
const fs = require('fs');
//import fs from 'fs';
// Solidity compiler module
const solc = require('solc');
//import solc from 'solc';


// Get the source code...
const tokenmonPath = path.resolve(__dirname, 'contract', 'Tokenmon.sol');
const source = fs.readFileSync(tokenmonPath, 'utf8');


var input = {
    language: 'Solidity',
    sources: {
        'Tokenmon.sol' : {
            content: source
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': [ '*' ]
            }
        }
    }
};
module.exports = JSON.parse(solc.compile(JSON.stringify(input)))["contracts"]['Tokenmon.sol']['Tokenmon'];