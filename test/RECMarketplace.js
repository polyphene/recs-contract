const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("RECMarketplace", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, buyer, nobody] = await ethers.getSigners();

        const RECMarketplace = await ethers.getContractFactory("RECMarketPlace");
        const recMarketplace = await RECMarketplace.deploy();

        const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

        await recMarketplace.mintAndAllocate(uri, 15, [], [], []);

        return { recMarketplace, owner, buyer, nobody };
    }

    async function deployAndList() {
        const payload = await deployFixture();

        const unitPriceWei = ethers.utils.parseEther("1.0");

        await payload.recMarketplace.list(0, 10, unitPriceWei);

        return { ...payload, unitPriceWei };
    }

    describe("List", async function () {
        it("Should revert if listed amount is not positive", async function () {
            const { recMarketplace } = await loadFixture(deployFixture);

            await expect(recMarketplace.list(0, 0, 1)).to.be.reverted;
        });

        it("Should revert if sender does not own listed amount", async function () {
            const { recMarketplace, nobody } = await loadFixture(deployFixture);

            await expect(
                recMarketplace.connect(nobody).list(0, 10, 1)
            ).to.be.reverted;
        });

        it("Should list amount of token", async function () {
            const { recMarketplace, owner } = await loadFixture(deployFixture);

            await recMarketplace.list(0, 10, 1);

            const listing = await recMarketplace.tokenListings(0);
            await expect(listing.length).to.be.equal(1);
            await expect(listing[0].length).to.be.equal(4);
            await expect(listing[0][0]).to.be.equal(0);
            await expect(listing[0][1]).to.be.equal(owner.address);
            await expect(listing[0][2]).to.be.equal(10);
            await expect(listing[0][3]).to.be.equal(1);
        });

        it("should emit TokenListed events", async function () {
            const { recMarketplace, owner } = await loadFixture(deployFixture);

            await expect(recMarketplace.list(0, 10, 1))
                .to.emit(recMarketplace, "TokenListed")
                .withArgs(owner.address, 0, 10, 1);
        });

        it("should total token amount listed", async function () {
            const { recMarketplace, owner } = await loadFixture(deployFixture);

            await recMarketplace.list(0, 10, 1);

            const supplyListed = await recMarketplace.tokenSupplyListed(0);
            await expect(supplyListed.toNumber()).to.be.equal(10);
        });
    });

    describe("Buy", async function () {
        it("Should revert if tokens are not listed", async function () {
            const { recMarketplace, buyer, owner } = await loadFixture(deployAndList);

            await expect(recMarketplace.connect(buyer).buy(1, owner.address, 10)).to.be.reverted;
        });

        it("Should revert if amount specified is too great", async function () {
            const { recMarketplace, buyer, owner } = await loadFixture(deployAndList);

            await expect(recMarketplace.connect(buyer).buy(0, owner.address, 1000)).to.be.reverted;
        });

        it("Should revert if buyer does not send enough ethers", async function () {
            const { recMarketplace, buyer, owner } = await loadFixture(deployAndList);

            await expect(recMarketplace.connect(buyer).buy(0, owner.address, 10)).to.be.reverted;
        });

        it("Should buy token", async function () {
            const { recMarketplace, owner, buyer } = await loadFixture(deployAndList);

            // check token balance
            await expect(await recMarketplace.balanceOf(owner.address, 0)).to.be.equal(15);
            await expect(await recMarketplace.balanceOf(buyer.address, 0)).to.be.equal(0);
            // Check Eth balance
            const oldOwnerBalance = await owner.getBalance();
            const oldBuyerBalance = await buyer.getBalance();

            const valueSent = ethers.utils.parseEther("10.0");
            const receipt = await (
                await recMarketplace.connect(buyer).buy(0, owner.address, 10, { value: valueSent })
            ).wait();

            // check token balance
            await expect(await recMarketplace.balanceOf(owner.address, 0)).to.be.equal(5);
            await expect(await recMarketplace.balanceOf(buyer.address, 0)).to.be.equal(10);
            // Check Eth balance
            await expect(await owner.getBalance()).to.be.equal(
                oldOwnerBalance.add(ethers.BigNumber.from(valueSent))
            );
            await expect(await buyer.getBalance()).to.be.equal(
                oldBuyerBalance.sub(valueSent).sub(receipt.gasUsed.mul(receipt.effectiveGasPrice))
            );
        });

        it("Should delete listing if there are no tokens left to sell", async function () {
            const { recMarketplace, owner, buyer } = await loadFixture(deployAndList);

            const valueSent = ethers.utils.parseEther("10.0");
            await recMarketplace.connect(buyer).buy(0, owner.address, 10, { value: valueSent });

            const listing = await recMarketplace.tokenListings(0);
            await expect(listing.length).to.be.equal(1);
            await expect(listing[0].length).to.be.equal(4);
            await expect(listing[0][0]).to.be.equal(0);
            await expect(listing[0][1]).to.be.equal(ethers.constants.AddressZero);
            await expect(listing[0][2]).to.be.equal(0);
            await expect(listing[0][3]).to.be.equal(0);
        });

        it("Should emit TokenBought events", async function () {
            const { recMarketplace, owner, buyer, unitPriceWei } = await loadFixture(
                deployAndList
            );

            const valueSent = ethers.utils.parseEther("10.0");
            await expect(recMarketplace.connect(buyer).buy(0, owner.address, 10, { value: valueSent }))
                .to.emit(recMarketplace, "TokenBought")
                .withArgs(buyer.address, owner.address, 0, 10, unitPriceWei);
        });

        it("should retrieve all valid listed offers", async function () {
            const { recMarketplace, owner, buyer } = await loadFixture(deployFixture);

            // Price
            const unitPrice = ethers.utils.parseEther("1.0");

            // List token id 0 and make the current listing non valid
            await recMarketplace.list(0, 5, unitPrice);
            const valueSent = ethers.utils.parseEther("5.0");
            await (
                await recMarketplace.connect(buyer).buy(0, owner.address, 5, { value: valueSent })
            ).wait();
            await expect(await recMarketplace.balanceOf(buyer.address, 0)).to.be.equal(5);

            // Mint and list token id 1;
            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";
            await recMarketplace.mintAndAllocate(uri, 15, [], [], []);
            await recMarketplace.list(1, 10, unitPrice);
            const newUnitPrice = ethers.utils.parseEther("2.0");
            await recMarketplace.list(1, 10, newUnitPrice);

            // Mint and list token id 2;
            await recMarketplace.mintAndAllocate(uri, 15, [], [], []);
            await recMarketplace.list(2, 15, unitPrice);

            const tokenListings = await recMarketplace.currentTokenListings();
            await expect(tokenListings.length).to.be.equal(2);
            await expect(tokenListings[0].length).to.be.equal(4);
            await expect(tokenListings[0][0]).to.be.equal(1);
            await expect(tokenListings[0][1]).to.be.equal(owner.address);
            await expect(tokenListings[0][2]).to.be.equal(10);
            await expect(tokenListings[0][3]).to.be.equal(newUnitPrice);
            await expect(tokenListings[1].length).to.be.equal(4);
            await expect(tokenListings[1][0]).to.be.equal(2);
            await expect(tokenListings[1][1]).to.be.equal(owner.address);
            await expect(tokenListings[1][2]).to.be.equal(15);
            await expect(tokenListings[1][3]).to.be.equal(unitPrice);
        });
    });
});