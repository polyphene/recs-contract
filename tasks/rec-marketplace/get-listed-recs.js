//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
const util = require("util");
const request = util.promisify(require("request"));

task(
    "tmp-get-listed-recs",
    "Listed RECs on a Marketplace contract"
)
    .addParam("contract", "The address of the RECMarketplace contract")
    .addParam("tokenid", "The id of the REC token to be listed")
    .setAction(async (taskArgs) => {
        const contractAddr = taskArgs.contract;
        const tokenId = taskArgs.tokenid;

        const recMarketplace = await ethers.getContractFactory("RECMarketPlace");
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

        const recMarketplaceContract = new ethers.Contract(contractAddr, recMarketplace.interface, signer);

        const tokenListing = await recMarketplaceContract.tokenListing(tokenId);

        console.log(`RECs listed for token Id "${tokenId}":`);
        console.log(`* Seller: ${tokenListing[0]}`);
        console.log(`* Amount: ${tokenListing[1]}`);
        console.log(`* Price (wei): ${tokenListing[2]}`);

    });

module.exports = {};
