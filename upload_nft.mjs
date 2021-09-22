import { NFTStorage, File } from 'nft.storage';
import fs from 'fs';

const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweDFBMEE3ODJlZmRBRmUxRmFiMWE2NjBEYzUwZTg1MDE3YTMxODIxNDUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTYyNjg2MDk1NTgzOCwibmFtZSI6InRlc3QifQ.lySWBgIWC6YxBcKo2CKHWqODWHePpJokOMpaJuXh5d0";

const client = new NFTStorage({ token: API_KEY });
let content = fs.readFileSync('img/sun.jpg');

const metadata = await client.store({
    name: 'Test',
    description: 'Test desc',
    attributes: 'null',
    image: new File(
      [
        content
      ],
      'sun.jpg',
      { type: 'image/jpg' }
    )
});
console.log(metadata.url);

// ipfs hash bafkreiehsoaxtwweebv5x6ui354fiweytcxlt7ribgcnce7m7txhwbak6q