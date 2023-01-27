//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
const util = require("util");
const request = util.promisify(require("request"));

task("set-role", "Grant a given role to an account on a REC contract")
    .addParam("contract", "The REC contract address")
    .addParam("account", "The account for which the role will be given")
    .addParam("role", "The role given to the account, either \"minter\", \"redeemer\" or \"auditor\"")
    .setAction(async (taskArgs) => {
        const contractAddress = taskArgs.contract;
        const account = taskArgs.account;
        const tmpRole = taskArgs.role;

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

        let role = "";
        switch(tmpRole) {
            case "minter":
                role = await recContract.MINTER_ROLE();
                break;
            case "redeemer":
                role = await recContract.REDEEMER_ROLE();
                break;
            case "auditor":
                role = await recContract.AUDITOR_ROLE();
                break;
            default:
                throw new Error("Given role parameter value is not valid. Expected either \"minter\", \"redeemer\" or \"auditor\"");
        }

        console.log(`Giving role "${tmpRole}" to account ${account}...`);

        const tx = await recContract.grantRole(role, account, {
            gasLimit: 1000000000,
            maxPriorityFeePerGas: priorityFee,
        });

        console.log(`Transaction hash: ${tx.hash}`);

        const receipt = await tx.wait();

        console.log(`Transaction ${receipt.status === 1 ? 'successful' : 'failed'}`);

        if(!receipt.status) {
            process.exit();
        }

        console.log(`Granted role "${tmpRole}" to account ${account}`);
    });

module.exports = {};
