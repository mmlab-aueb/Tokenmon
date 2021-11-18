/**
 * This file is about the compilation of the smart contract.
 */


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
const _source_contract = 'Tokenmon.sol'

// Get the source code...
const tokenmonPath = path.resolve(__dirname, 'contract', _source_contract);
const source = fs.readFileSync(tokenmonPath, 'utf8');


var input = {
    language: 'Solidity',
    sources: {
        _source_contract : {
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
module.exports = JSON.parse(solc.compile(JSON.stringify(input)))["contracts"]['_source_contract'][_source_contract.split('.')[0]];