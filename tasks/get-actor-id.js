//
// DRAFT!! THIS CODE HAS NOT BEEN AUDITED - USE ONLY FOR PROTOTYPING
//
const fa = require("@glif/filecoin-address");
const util = require("util");
const {idFromAddress} = require("@glif/filecoin-address");
const request = util.promisify(require("request"));

task("get-actor-id", "Gets Filecoin f4 address and corresponding Ethereum address.")
    .addParam("contract", "The Ethereum address of the deployed contract")
    .setAction(
    async (taskArgs) => {
        const contractAddr = taskArgs.contract;

        const f4Address = fa.newDelegatedEthAddress(contractAddr);
        console.log(f4Address.subAddrHex)
        const aa = fa.decode(f4Address.toString());
        console.log(aa.toString())
        const actorID = fa.idFromAddress(f4Address);
        console.log(actorID)
        console.log(`f4address = ${f4Address.toString()}`);
        console.log(`ActorID = ${actorID}`);
        console.log(`Ethereum address = ${contractAddr}`);
    }
);

module.exports = {};
