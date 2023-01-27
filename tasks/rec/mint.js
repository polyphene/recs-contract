//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
const util = require("util");
const request = util.promisify(require("request"));

task("mint-allocate", "Mints and allocates RECs")
    .addParam("contract", "The REC contract address")
    .addParam("uri", "The RECs uri for metadata")
    .addParam("amount", "The amount of RECs to mint")
    .addOptionalParam(
        "allocations",
        "Allocations to be done on mint, format is '<account>:<amount>,<account>:<amount>,...'"
    )
    .setAction(async (taskArgs) => {
        const contractAddress = taskArgs.contract;
        const uri = taskArgs.uri;
        const amount = taskArgs.amount;
        const tmpAllocations = taskArgs.allocations?.split(",") || [];

        let allocated = [];
        let allocations = [];
        tmpAllocations.forEach((i) => {
            const [account, amount] = i.split(":");
            allocated.push(account);
            allocations.push(amount);
        });

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
        const nextTokenId = (await recContract.nextId()).toNumber();

        if(allocations.length === 0) {
            console.log(`Minting ${amount} for token Id "${nextTokenId}"...`);
        } else {
            console.log(`Minting ${amount} for token Id "${nextTokenId}" with allocations:`);

            console.log(`* Account (minter) ${signer.address}: ${amount - allocations.reduce((a, b) => a + b)} RECs`)
            allocations.forEach((a, i) => {
                console.log(`* Account ${allocated[i]}: ${a} RECs`);
            })
        }

        const tx = await recContract.mintAndAllocate(uri, amount, allocated, allocations, {
            gasLimit: 1000000000,
            maxPriorityFeePerGas: priorityFee,
        });

        console.log(`Transaction hash: ${tx.hash}`);

        const receipt = await tx.wait();

        console.log(`Transaction ${receipt.status === 1 ? 'successful' : 'failed'}`);

        if(!receipt.status) {
            process.exit();
        }

        console.log(`Minted ${amount} RECs for token Id "${nextTokenId}"`);
    });

module.exports = {};
