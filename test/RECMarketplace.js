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

        const Marketplace = await ethers.getContractFactory("MarketPlace");
        const marketplace = await Marketplace.deploy();

        return { marketplace, recMarketplace, owner, buyer, nobody };
    }

    async function deployAndList() {
        const payload = await deployFixture();

        await payload.recMarketplace.setApprovalForAll(payload.marketplace.address, true);

        const unitPriceWei = ethers.utils.parseEther("1.0");
        await payload.marketplace.list(payload.recMarketplace.address, 0, 10, unitPriceWei);

        return { ...payload, unitPriceWei };
    }

    describe("List", async function () {
        it("Should revert if listed amount is not positive", async function () {
            const { marketplace, recMarketplace } = await loadFixture(deployFixture);

            await expect(marketplace.list(recMarketplace.address, 0, 0, 1)).to.be.revertedWith(
                "Amount to be listed should be positive"
            );
        });

        it("Should revert if sender does not own listed amount", async function () {
            const { marketplace, recMarketplace, nobody } = await loadFixture(deployFixture);

            await expect(
                marketplace.connect(nobody).list(recMarketplace.address, 0, 10, 1)
            ).to.be.revertedWith("Sender should own the amount of tokens to be listed");
        });

        it("Should revert if marketplace has not management approval", async function () {
            const { marketplace, recMarketplace } = await loadFixture(deployFixture);

            await expect(marketplace.list(recMarketplace.address, 0, 10, 1)).to.be.revertedWith(
                "Marketplace should be approved to manage user tokens"
            );
        });

        it("Should list amount of token", async function () {
            const { marketplace, recMarketplace, owner } = await loadFixture(deployFixture);

            await recMarketplace.setApprovalForAll(marketplace.address, true);

            await marketplace.list(recMarketplace.address, 0, 10, 1);

            const listing = await marketplace.tokenListing(recMarketplace.address, 0);
            await expect(listing.length).to.be.equal(3);
            await expect(listing[0]).to.be.equal(owner.address);
            await expect(listing[1]).to.be.equal(10);
            await expect(listing[2]).to.be.equal(1);
        });

        it("should emit TokenListed events", async function () {
            const { marketplace, recMarketplace, owner } = await loadFixture(deployFixture);

            await recMarketplace.setApprovalForAll(marketplace.address, true);
            await expect(marketplace.list(recMarketplace.address, 0, 10, 1))
                .to.emit(marketplace, "TokenListed")
                .withArgs(recMarketplace.address, owner.address, 0, 10, 1);
        });
    });

    describe("Buy", async function () {
        it("Should revert if tokens are not listed", async function () {
            const { marketplace, recMarketplace, buyer } = await loadFixture(deployAndList);

            await expect(marketplace.connect(buyer).buy(recMarketplace.address, 1, 10)).to.be.revertedWith(
                "Token is not listed"
            );
        });

        it("Should revert if amount specified is too great", async function () {
            const { marketplace, recMarketplace, buyer } = await loadFixture(deployAndList);

            await expect(marketplace.connect(buyer).buy(recMarketplace.address, 0, 1000)).to.be.revertedWith(
                "Incorrect amount of tokens being purchased"
            );
        });

        it("Should revert if buyer does not send enough ethers", async function () {
            const { marketplace, recMarketplace, buyer } = await loadFixture(deployAndList);

            await expect(marketplace.connect(buyer).buy(recMarketplace.address, 0, 10)).to.be.revertedWith(
                "Not enough ether to make the purchase"
            );
        });

        it("Should buy token", async function () {
            const { marketplace, recMarketplace, owner, buyer } = await loadFixture(deployAndList);

            // check token balance
            await expect(await recMarketplace.balanceOf(owner.address, 0)).to.be.equal(15);
            await expect(await recMarketplace.balanceOf(buyer.address, 0)).to.be.equal(0);
            // Check Eth balance
            const oldOwnerBalance = await owner.getBalance();
            const oldBuyerBalance = await buyer.getBalance();

            const valueSent = ethers.utils.parseEther("10.0");
            const receipt = await (
                await marketplace.connect(buyer).buy(recMarketplace.address, 0, 10, { value: valueSent })
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
            const { marketplace, recMarketplace, owner, buyer } = await loadFixture(deployAndList);

            const valueSent = ethers.utils.parseEther("10.0");
            await marketplace.connect(buyer).buy(recMarketplace.address, 0, 10, { value: valueSent });

            const listing = await marketplace.tokenListing(recMarketplace.address, 0);
            await expect(listing.length).to.be.equal(3);
            await expect(listing[0]).to.be.equal(ethers.constants.AddressZero);
            await expect(listing[1]).to.be.equal(0);
            await expect(listing[2]).to.be.equal(0);
        });

        it("Should emit TokenBought events", async function () {
            const { marketplace, recMarketplace, owner, buyer, unitPriceWei } = await loadFixture(
                deployAndList
            );

            const valueSent = ethers.utils.parseEther("10.0");
            await expect(marketplace.connect(buyer).buy(recMarketplace.address, 0, 10, { value: valueSent }))
                .to.emit(marketplace, "TokenBought")
                .withArgs(recMarketplace.address, buyer.address, owner.address, 0, 10, unitPriceWei);
        });
    });
});
