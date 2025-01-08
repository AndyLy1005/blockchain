const SHA256 = require('crypto-js/sha256');

function calculateMerkleRoot(hashes) {
    if (!Array.isArray(hashes) || hashes.length === 0) {
        throw new Error("Invalid hash array for Merkle Root calculation");
    }

    while (hashes.length > 1) {
        const temp = [];
        for (let i = 0; i < hashes.length; i += 2) {
            const left = hashes[i];
            const right = hashes[i + 1] || hashes[i];
            temp.push(SHA256(left + right).toString());
        }
        hashes = temp;
    }

    return hashes[0];
}

module.exports = { calculateMerkleRoot };