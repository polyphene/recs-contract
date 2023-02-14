//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
const util = require("util");
const request = util.promisify(require("request"));

task("set-approval", "Grant a given approval to an account on a REC contract")
    .addParam("contract", "The REC contract address")
    .addParam("account", "The account for which the approval will be set")
    .addParam("approval", "Approval to set, true or false")
    .setAction(async (taskArgs) => {
        const contractAddress = taskArgs.contract;
        const account = taskArgs.account;
        const tmpApproval = taskArgs.approval;

        const networkId = network.name;
        const Rec = await ethers.getContractFactory("REC");
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

        const recContract = new ethers.Contract(contractAddress, Rec.interface, signer);

        let approval = false;
        if (tmpApproval === "true") {
            approval = true;
        }

        console.log(`Setting approval to "${tmpApproval}" for account ${account}...`);

        const tx = await recContract.setApprovalForAll(account, approval, {
            gasLimit: 1000000000,
            maxPriorityFeePerGas: priorityFee,
        });

        console.log(`Transaction hash: ${tx.hash}`);

        const receipt = await tx.wait();

        console.log(`Transaction ${receipt.status === 1 ? 'successful' : 'failed'}`);

        if(!receipt.status) {
            process.exit();
        }

        console.log(`Set approval "${tmpApproval}" to account ${account}`);
    });

module.exports = {};
