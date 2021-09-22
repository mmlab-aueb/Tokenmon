import { Web3Storage, getFilesFromPath } from 'web3.storage';

const api_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDM1QTMxZjNCNzQwNmE3ZTcwQUUwMDZBQTE4QjMxQ0ExZTg1MTNDRkYiLCJpc3MiOiJ3ZWIzLXN0b3JhZ2UiLCJpYXQiOjE2MjkyMjQzMzIyMzcsIm5hbWUiOiJ0b2tlbm1vbmJldGEifQ.QDe0h8ClUbpfyttqssCahs-x2sEhvRsGYbnq1ykUlMA";

const storage = new Web3Storage({ token: api_token });
const file = await getFilesFromPath("./file/link.json");

const cid = await storage.put(file);
console.log('Content added with CID:', cid);

// venus nft link.json bafybeif35jeapgc4pbscntputuvwxqtmt4gc6z6vqxhrtip4tcqjykdg3y