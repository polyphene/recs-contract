require("hardhat-deploy");
require("hardhat-deploy-ethers");

const util = require("util");
const request = util.promisify(require("request"));

const ethers = require("ethers");

const DEPLOYER_PRIVATE_KEY = network.config.accounts[0];
const deployer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY);

module.exports = async ({ deployments }) => {
    const { deploy } = deployments;

    const priorityFee = await callRpc("eth_maxPriorityFeePerGas");

    console.log("Wallet Ethereum Address:", deployer.address);

    console.log("deploying Marketplace...");
    await deployLogError(deploy, "MarketPlace", {
        from: deployer.address,
        args: [],
        // maxPriorityFeePerGas to instruct hardhat to use EIP-1559 tx format
        maxPriorityFeePerGas: priorityFee,
        log: true,
    });
};

const callRpc = async (method, params) => {
    const options = {
        method: "POST",
        url: "https://api.calibration.node.glif.io/",
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

// Wraps Hardhat's deploy, logging errors to console.
const deployLogError = async (deploy, title, obj) => {
    let ret;
    try {
        ret = await deploy(title, obj);
    } catch (error) {
        console.log(error.toString());
        process.exit(1);
    }
    return ret;
};