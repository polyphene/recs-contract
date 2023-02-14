require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("./tasks");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.15",
    defaultNetwork: "hyperspace",
    networks: {
        hyperspace: {
            url: "https://filecoin-hyperspace.chainstacklabs.com/rpc/v1\t",
            chainId: 3141,
            accounts: ["0x570a1f99caf2860cbbb34599473786fdb4450b179063be745f9b13cee0c82241"],
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
};
