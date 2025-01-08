const Blockchain = require('./blockchain');
const Block = require('./block');
const { calculateMerkleRoot } = require('./merkle_tree');
const SHA256 = require('crypto-js/sha256');
const sql = require('mssql');
const config = require('./dbConfig');

async function getBlockData() {
    try {
        const pool = await sql.connect(config);
        const result = await pool.request().query("SELECT * FROM block_data");
        return result.recordset;
    } catch (error) {
        console.error("Error fetching block data:", error);
        return [];
    } finally {
        sql.close();
    }
}

async function main() {
    try {
        const blockchain = new Blockchain(4, "My Blockchain");
        await blockchain.init();

        const blockData = await getBlockData();

        if (blockData.length === 0) {
            console.log("No new data to process.");
            return;
        }

        for (const data of blockData) {
            try {
                const lastBlock = await blockchain.getLastBlock();

                const hashCustomer = SHA256(JSON.stringify({
                    customer_id: data.customer_id,
                    full_name: data.full_name,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    middle_name: data.middle_name,
                    citizen_ID: data.citizen_ID,
                    phone_number: data.phone_number,
                    Gender: data.Gender,
                    DoB: data.DoB,
                    email: data.email,
                    status: data.status
                })).toString();

                const hashLocation = SHA256(JSON.stringify({
                    ward: data.ward,
                    ward_tiki_code: data.ward_tiki_code,
                    district: data.district,
                    district_tiki_code: data.district_tiki_code,
                    region: data.region,
                    region_tiki_code: data.region_tiki_code,
                    country: data.country,
                    country_id: data.country_id
                })).toString();

                const hashPayment = SHA256(JSON.stringify({
                    Account_holder: data.Account_holder,
                    Sort_of_card: data.Sort_of_card,
                    bank_name: data.bank_name,
                    Bank_number: data.Bank_number,
                    ["cvv/cvc"]: data["cvv/cvc"]
                })).toString();

                const merkleRoot = calculateMerkleRoot([hashCustomer, hashLocation, hashPayment]);

                const newBlock = new Block(
                    lastBlock ? lastBlock.blockId + 1 : 0,
                    lastBlock ? lastBlock.hash : "0",
                    Date.now(),
                    blockchain.difficulty
                );

                newBlock.setHashes({ hashCustomer, hashLocation, hashPayment, merkleRoot });

                newBlock.mine();
                await blockchain.addBlock(newBlock);

                const pool = await sql.connect(config);
                await pool.request().query(`UPDATE block_data SET status = 'processed' WHERE id = ${data.id}`);
            } catch (error) {
                console.error("Error adding block:", error);
            }
        }

        blockchain.printBlockchainInfo();
    } catch (error) {
        console.error("An error occurred:", error);
    }
}

main();
