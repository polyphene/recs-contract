//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
const util = require("util");
const request = util.promisify(require("request"));

task("get-approval", "Get the approval status for an account on a REC contract")
    .addParam("contract", "The REC contract address")
    .addParam("account", "The account for which the approval will be set")
    .setAction(async (taskArgs) => {
        const contractAddress = taskArgs.contract;
        const account = taskArgs.account;

        const Rec = await ethers.getContractFactory("REC");
        //Get signer information
        const accounts = await ethers.getSigners();
        const signer = accounts[0];


        const recContract = new ethers.Contract(contractAddress, Rec.interface, signer);

        let result = BigInt(await recContract.isApprovedForAll(signer.address, account)).toString();



        console.log(`Approval set to "${result ? "true" : "false"}" for account ${account}`);
    });

module.exports = {};
