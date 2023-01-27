//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
const util = require("util");
const request = util.promisify(require("request"));

task(
    "buy-recs",
    "Buy listed RECs on a Marketplace contract"
)
    .addParam("marketplacecontract", "The address of the Marketplace contract")
    .addParam("reccontract", "The address of the REC contract")
    .addParam("tokenid", "The id of the REC token to be listed")
    .addParam("amount", "The amount of REC tokens to be listed")
    .setAction(async (taskArgs) => {
            const marketplaceContractAddr = taskArgs.marketplacecontract;
            const recContractAddr = taskArgs.reccontract;
            const tokenId = taskArgs.tokenid;
            const amount = taskArgs.amount;
            const price = taskArgs.price;

            const Marketplace = await ethers.getContractFactory("MarketPlace");
            //Get signer information
            const accounts = await ethers.getSigners();
            const signer = accounts[0];

            async function callRpc(method, params) {
                    const options = {
                            method: "POST",
                            url: "https://api.hyperspace.node.glif.io/rpc/v1",
                            headers: {
                                    "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                    jsonrpc: "2.0",
                                    method: method,
                                    params: params,
                                    id: 1,
                            }),
                    };
                    const res = await request(options);
                    return JSON.parse(res.body).result;
            }

            const priorityFee = await callRpc("eth_maxPriorityFeePerGas");

            const marketplaceContract = new ethers.Contract(marketplaceContractAddr, Marketplace.interface, signer);

            const tokenListing = await marketplaceContract.tokenListing(recContractAddr, tokenId);


            const tx = await marketplaceContract.list(recContractAddr, tokenId, amount, {
                    gasLimit: 1000000000,
                    maxPriorityFeePerGas: priorityFee,
                    // TODO set value
                    value: tokenListing[2] * amount
            });

            console.log(`Transaction hash: ${tx.hash}`);

            const receipt = await tx.wait();

            console.log(`Transaction ${receipt.status === 1 ? 'successful' : 'failed'}`);

            if(!receipt.status) {
                    process.exit();
            }

            console.log(`Bought ${amount} RECs for token Id "${tokenId}" on contract ${recContractAddr} at ${price} wei`);
    });

module.exports = {};
