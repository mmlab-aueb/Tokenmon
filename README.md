# Tokenmon

Repository hosting the system proposed in "*Decentralized NFT-based Evolvable Games*". 

Authors; **Christos Karapapas**, **Georgios Syros**, **Iakovos Pittaras**, **George C. Polyzos**

## Introduction

The popularity of blockchain games continues to grow as Non-Fungible Tokens (**NFTs**) become the center of attention, contributing to the move towards Web3. We leverage the InterPlanetary File System (**IPFS**) and NFTs, backed by blockchains, to build a flexible, decentralized, and fair base- line system for trading games. Our solution creates a fully decentralized system, where new business models are enabled. In particular, we introduce and support the evolvability of in- game assets, enable their resale with dynamic pricing, depending on their rarity, and automatically provide a cut to the digital artists, without the need for a trusted (third) party. Our system guarantees that the in-game assets will remain online long-term, by orchestrating various decentralized services. Thus, users do not risk losing control over the artefacts or their value, even if the gaming company loses interest, or goes bankrupt. We considered and compared the Ethereum Name Service (**ENS**) and the InterPlanetary Name System (**IPNS**) as the naming component of the system and selected ENS for our solution, despite the fact it introduces monetary cost. Finally, we validate our claims and evaluate the feasibility and performance of the proposed system through a proof of concept implementation.

The '_**Tokenmon**_' application programming interface (**API**) was developed to encapsulate all the mechanisms described in the aforementioned system and to provide developers with the tools to adopt the described business model.

## Project Architecture - Contents

- **contract** - folder of the Solidity-based smart contracts being used by the system.
  - **Tokenmon.sol** - the base smart contract used by the system in Solidity.
- **img** - folder containing the token artworks.
- **keys** - folder containing the JSON files that store the encryption keys for each token.
- **temp** - folder that will contain the decrypted artworks, upon user request.
- **test** - folder of scripts and results that were used to evaluate the system.
- **node_modules** - folder of Node.js modules.

## Scripts

- **compile.js** - script for compiling the system's smart contract.
- **deploy.js** -- script responsible for deploying the system's smart contract on the Ethereum Network.
- **Tokenmon.js** - module that implements the system's mechanics using the *Ethereum Name Service* (**ENS**).
- **TokenmonIPNS.js** - module that implements the system's mechanics using the *InterPlanetary Name System* (**IPNS**).
- **cryptography.js** - cryptography module implementing Shamir's threshold secret sharing scheme.

## Demo - Ethereum Name Service version

### Preparation

Before using the API, a few imports need to be made:

```
const myContract = require('./Contract'); // The compiled smart contract.
const cpt = require('./cryptography'); // The cryptography module.
```

The API requires a wallet provider in order to function. This version requires Truffle's **HDWalletProvider**:

```
const HDWalletProvider = require('@truffle/hdwallet-provider');

const myProvider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'car remind main city turn east isolate north deal liquid into right',
    // link to network (in this example: Rinkeby test network)
    'https://rinkeby.infura.io/v3/ca6240642afa5dacced3e314bcae53ef'
);
```

Finally, the module needs to be imported:

```
const Tokenmon = require('./Tokenmon');
```

After all the modules are imported, a **Tokenmon** instance can be created:

```
var tokenmon = new Tokenmon(
    myProvider, // The wallet provider.
    {
        "nftstorage_apikey": ... , // The nft.storage api key
        "web3storage_apikey": ... // The web3.storage api key
    },
    myContract // The compiled smart contract.
);
```

**Upon creation**, the instance's asynchronous `init()` method **must** be invoked to initialied Web3 components that are required:

```
await tokenmon.init(); 
```

### Usage

#### `upload()`

The first of the three basic methods offered by the API is `upload()`. It is used to:
1. Encrypt the tokens's original artwork.
2. Upload the token's encrypted original artwork and its cover on nft.storage.
3. Upload the token's metadata file on web3.storage.
4. Claim a new ENS subdomain for the new token.
5. Mint the token on the system's smart contract.

Example:

```
await tokenmon.upload(
        'Fernando Alonso', // The token's name.
        'Fernando Alonso, two-time formula one world champion.', // The token's description.
        {
            'racepace' : 'outstanding', // The token's attributes.
            'wdc' : '2'
        },
        'img/nanopodio.jpg', // The original artwork path.
        'img/nanopodio_cover.jpg' // The artwork cover path.
);
```

#### `update()`

The second of the three basic methods offered by the API is `update()`. It is used to 'evolve' a token. More specifically, it is used to:
1. Encrypt the tokens's original artwork.
2. Upload the token's encrypted original artwork and its cover on nft.storage.
3. Upload the token's metadata file on web3.storage.
4. **Update the ENS address content hash field (IPFS contend identifier) to the latest metadata file.**

Example:

```
await tokenmon.update(
        "tok1.myaddr.eth", // The ENS address that corresponds the token to be evolved.
        'Sebastian Vettel',
        'Sebastian Vettel, four-time formula one world champion.',
        {
            'racepace' : 'excellent',
            'wdc' : '4'
        },
        'img/sebhm_cover.jpg',
        'img/sebhm_cover.jpg'
);
```

#### `breakSeal()`

The last of the three basic methods offered by the API is `breakSeal()`. It is used to 'break the seal' a token i.e. decrypt the encrypted artwork and reveal the full-size original artwork to the owner. More specifically, it is used to:
1. Check if the token's seal is broken by querying the Ethereum blockchain via the system's smart contract.
2. If the seal is not broken:
  1. The encrypted artwork is downloaded locally from IPFS.
  2. The encrypted artwork is decrypted using two out of the three (owner - artist - company) key shares.
  3. The decrypted full-size original artwork is stored locally.

Example:

```
tokenmon.breakSeal(
        "1", // The token ID (can be found on the system smart contract.
        "tok1.myaddr.eth", // The ENS address that corresponds to the token.
        cpt.getKeys("finaltok10.nyxto.eth")["owner"], // owner key share
        cpt.getKeys("finaltok10.nyxto.eth")["company"] // company key share
);
```

In the example above, the `cryptography` module is used to fetch the key shares from the local database. In custom implementations, the developer could ask for the key shares via prompts:


```
tokenmon.breakSeal(
        "1", // The token ID (can be found on the system smart contract.
        "tok1.myaddr.eth", // The ENS address that corresponds to the token.
        ... , // key share 1 provided by some text input.
        ... , // key share 2 provided by some other text input.
);
```