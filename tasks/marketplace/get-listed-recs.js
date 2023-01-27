//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
const util = require("util");
const request = util.promisify(require("request"));

task(
    "get-listed-recs",
    "Listed RECs on a Marketplace contract"
)
    .addParam("marketplacecontract", "The address of the Marketplace contract")
    .addParam("reccontract", "The address of the REC contract")
    .addParam("tokenid", "The id of the REC token to be listed")
    .setAction(async (taskArgs) => {
        const marketplaceContractAddr = taskArgs.marketplacecontract;
        const recContractAddr = taskArgs.reccontract;
        const tokenId = taskArgs.tokenid;

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

        console.log(`RECs listed for token Id "${tokenId}":`);
        console.log(`* Seller: ${tokenListing[0]}`);
        console.log(`* Amount: ${tokenListing[1]}`);
        console.log(`* Price (wei): ${tokenListing[2]}`);

    });

module.exports = {};
