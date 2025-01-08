const sql = require('mssql');
const config = require('./dbConfig');
const Block = require('./block');

class Blockchain {
    constructor(difficulty = 4, name = "My Blockchain") {
        this.chain = [];
        this.difficulty = difficulty;
        this.name = name;
    }

    async init() {
        try {
            const pool = await sql.connect(config);
            const result = await pool.request().query(`SELECT * FROM blockchain`);
            this.chain = result.recordset.map(this.createBlockInstance.bind(this));

            if (this.chain.length === 0) {
                const genesisBlock = await this.createGenesisBlock();
                await this.addBlock(genesisBlock);
            } else {
                console.log(`Blockchain loaded successfully with ${this.chain.length} blocks.`);
            }
        } catch (err) {
            console.error("Error initializing blockchain from database:", err);
            throw err;
        } finally {
            sql.close();
        }
    }

    createBlockInstance(blockData) {
        const block = new Block(
            blockData.blockId,
            blockData.prevHash,
            blockData.timestamp,
            blockData.difficulty
        );
        block.setHashes({
            hashCustomer: blockData.Hash_Customer,
            hashLocation: blockData.Hash_Location,
            hashPayment: blockData.Hash_Payment,
            merkleRoot: blockData.merkleRoot
        });
        block.hash = blockData.hash;
        block.nonce = blockData.nonce;
        return block;
    }

    async getLastBlock() {
        return this.chain.length > 0 ? this.chain[this.chain.length - 1] : null;
    }

    async createGenesisBlock() {
        const genesisBlock = new Block(0, "0", Date.now(), this.difficulty);
        genesisBlock.mine();
        return genesisBlock;
    }

    async addBlock(newBlock) {
        try {
            if (!(await this.isValid(newBlock))) {
                console.error("Invalid block!");
                return;
            }

            await this.saveBlockToDatabase(newBlock);
            this.chain.push(newBlock);
            console.log(`Block ${newBlock.blockId} added successfully.`);
        } catch (err) {
            console.error("Error adding block:", err);
        }
    }

    async isValid(block) {
        const lastBlock = await this.getLastBlock();
        if (lastBlock) {
            if (block.blockId !== lastBlock.blockId + 1 || block.prevHash !== lastBlock.hash) {
                return false;
            }
        }
        block.hash = block.calculateHash();
        return block.hash.startsWith('0'.repeat(block.difficulty));
    }

    async saveBlockToDatabase(block) {
        try {
            const pool = await sql.connect(config);
            await pool.request()
                .input('blockId', sql.Int, block.blockId)
                .input('prevHash', sql.NVarChar, block.prevHash)
                .input('timestamp', sql.BigInt, block.timestamp)
                .input('merkleRoot', sql.NVarChar, block.merkleRoot)
                .input('hash', sql.NVarChar, block.hash)
                .input('nonce', sql.Int, block.nonce)
                .input('difficulty', sql.Int, block.difficulty)
                .input('hashCustomer', sql.NVarChar, block.hashCustomer)
                .input('hashLocation', sql.NVarChar, block.hashLocation)
                .input('hashPayment', sql.NVarChar, block.hashPayment)
                .input('status', sql.NVarChar, block.status)
                .query(`
                    INSERT INTO blockchain (blockId, prevHash, timestamp, merkleRoot, hash, nonce, difficulty, Hash_Customer, Hash_Location, Hash_Payment, status)
                    VALUES (@blockId, @prevHash, @timestamp, @merkleRoot, @hash, @nonce, @difficulty, @hashCustomer, @hashLocation, @hashPayment, @status)
                `);
            console.log(`Block ${block.blockId} saved to database.`);
        } catch (err) {
            console.error("Error saving block to database:", err);
            throw err;
        } finally {
            sql.close();
        }
    }

    printBlockchainInfo() {
        console.log(`Blockchain Name: ${this.name}`);
        console.log(`Total Blocks: ${this.chain.length}`);
        console.log("Chain:");
        this.chain.forEach(block => {
            console.log({
                blockId: block.blockId,
                prevHash: block.prevHash,
                timestamp: block.timestamp,
                merkleRoot: block.merkleRoot,
                hash: block.hash,
                difficulty: block.difficulty,
                status: block.status
            });
        });
    }
}

module.exports = Blockchain;
