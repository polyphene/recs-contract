//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
task("get-balance", "Calls the REC Contract to read the amount of RECs owned by the account")
    .addParam("contract", "The address the RECs contract")
    .addParam("account", "The address of the account you want the balance for")
    .addParam("tokenid", "The id of the token you want the balance for")
    .setAction(async (taskArgs) => {
        const contractAddr = taskArgs.contract;
        const account = taskArgs.account;
        const tokenId = taskArgs.tokenid;
        const networkId = network.name;
        console.log(
            `Reading RECs owned by ${account} for token ID "${tokenId}" on network ${networkId}`
        );
        const Rec = await ethers.getContractFactory("REC");

        //Get signer information
        const accounts = await ethers.getSigners();
        const signer = accounts[0];

        const recContract = new ethers.Contract(contractAddr, Rec.interface, signer);
        let result = BigInt(await recContract.balanceOf(account, tokenId)).toString();
        console.log(`Token owned for token Id "${tokenId}": ${result}`);
    });

module.exports = {};
