const ipfs = require('ipfs-api')({host: "localhost", port: 5001, protocol: "http"});
const fs = require('fs');

const hash = "QmazC9aJRsdzwwfewvHUEL6iZ18wj5UGkK5X8pXtwU15r5";

// Get the linker file pinned on web3.storage
ipfs.files.cat(hash+"/link.json", (err, linker_res) => {
    if (err) throw err;
    let linker = JSON.parse(linker_res.toString());
    let metadata_cid = linker['metadata'];

    // Get the metadata file pinned on nft.storage
    ipfs.files.cat(metadata_cid, (err, metadata_res) => {
        if (err) throw err;
        let metadata = JSON.parse(metadata_res.toString());
        
        let image_link = metadata['image'];
        let image_cid = image_link.slice(7);
        let filename = image_cid.split('/')[1].trim(".")

        // Download the nft image.
        ipfs.files.cat(image_cid, (err, res) => {
            if (err) throw err;
            fs.createWriteStream(filename).write(res);
        });

    });
});

