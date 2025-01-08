const SHA256 = require('crypto-js/sha256');

class Block {
    constructor(blockId, prevHash, timestamp, difficulty = 4) {
        this.blockId = blockId;
        this.prevHash = prevHash;
        this.timestamp = timestamp;
        this.merkleRoot = "";
        this.hashCustomer = "";
        this.hashLocation = "";
        this.hashPayment = "";
        this.hash = "";
        this.difficulty = difficulty;
        this.nonce = 0;
        this.status = "new";
    }

    setHashes({ hashCustomer, hashLocation, hashPayment, merkleRoot }) {
        this.hashCustomer = hashCustomer;
        this.hashLocation = hashLocation;
        this.hashPayment = hashPayment;
        this.merkleRoot = merkleRoot;
    }

    calculateHash() {
        return SHA256(
            this.blockId +
            this.prevHash +
            this.timestamp +
            this.merkleRoot +
            this.difficulty +
            this.nonce +
            this.status
        ).toString();
    }

    mine() {
        const startTime = Date.now();
        const maxMiningTime = 5000;
        while (!this.hash.startsWith(Array(this.difficulty + 1).join("0"))) {
            if (Date.now() - startTime > maxMiningTime) {
                throw new Error("Mining timeout: unable to find a valid hash within the time limit");
            }
            this.nonce++;
            this.hash = this.calculateHash();
        }
        console.log(`Block ${this.blockId} mined: ${this.hash}`);
    }
}

module.exports = Block;
