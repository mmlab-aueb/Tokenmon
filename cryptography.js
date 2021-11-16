const EC = require('elliptic').ec;

const curve = new EC('secp256k1');

const key0 = curve.genKeyPair();
const key1 = curve.genKeyPair();
const key2 = curve.genKeyPair();


const privsum = key0.getPrivate().add(key1.getPrivate().add(key2.getPrivate()));
const publsum = key0.getPublic().add(key1.getPublic().add(key2.getPublic()));

const privsumkey = curve.genKeyPair();
const publsumkey = curve.genKeyPair();

privsumkey._importPrivate(privsum);
publsumkey._importPublic(publsum);

const message = "SECRET";

var signed = curve.sign(message, privsumkey.getPrivate());

// experimenting with shards
var shardkey = curve.genKeyPair();
const shardpubl = key0.getPublic().add(key1.getPublic());
shardkey._importPublic(shardpubl);

console.log(shardkey.verify(message, signed));

/*const privateKey = '278a5de700e29faae8e40e366ec5012b5ec63d36ec77e8a2417154cc1d25383f'

const publicKey = curve.keyFromPrivate(privateKey).getPublic(true, 'hex')

var message = "This is a secret message."

var signed = curve.sign(message, privateKey)
var publicKeyObject = curve.keyFromPublic(publicKey,"hex")

var check = publicKeyObject.verify(message+'1', signed)

console.log("private key: "+privateKey);
console.log("public key: "+publicKey);
console.log(check);*/