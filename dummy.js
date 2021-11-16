const ENSContracts = require('ensdomains-ens-contracts');

const BaseRegistrar = ENSContracts.BaseRegistrar;
const BaseRegistrarImplementation = ENSContracts.BaseRegistrarImplementation;
const BulkRenewal = ENSContracts.BulkRenewal;
const MYENS = ENSContracts.ENS;
const ENSRegistry = ENSContracts.ENSRegistry;
const ENSRegistryWithFallback = ENSContracts.ENSRegistryWithFallback;
const ETHRegistrarController = ENSContracts.ETHRegistrarController;
const FIFSRegistrar = ENSContracts.FIFSRegistrar;
const LinearPremiumPriceOracle = ENSContracts.LinearPremiumPriceOracle;
const PriceOracle = ENSContracts.PriceOracle;
const PublicResolver = ENSContracts.PublicResolver;
const Resolver = ENSContracts.Resolver;
const ReverseRegistrar = ENSContracts.ReverseRegistrar;
const StablePriceOracle = ENSContracts.StablePriceOracle;
const TestRegistrar = ENSContracts.TestRegistrar;

const infura_link_rinkeby = 'https://rinkeby.infura.io/v3/ca6249643afa4dabbed3e314bbae53ef';

const HDWalletProvider = require('@truffle/hdwallet-provider');
const ENSModule = require('@ensdomains/ensjs');
const ENS = ENSModule.default;
const getEnsAddress = ENSModule.getEnsAddress;

const provider = new HDWalletProvider(
    // 12word mnemonic for the account to deploy the contract (must have some ether)
    'cart remind main urban turn west isolate south deal liquid into left',
    // link to network (in this case test network)
    infura_link_rinkeby
);

const ens = new ENS({ provider, ensAddress:getEnsAddress('1') })

//ens.name('nyxto.eth').getAddress().then(addr => console.log("addr=" + addr));
