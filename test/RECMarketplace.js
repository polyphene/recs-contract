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

            await expect(recMarketplace.list(0, 0, 1)).to.be.revertedWith(
                "Amount to be listed should be positive"
            );
        });

        it("Should revert if sender does not own listed amount", async function () {
            const { recMarketplace, nobody } = await loadFixture(deployFixture);

            await expect(
                recMarketplace.connect(nobody).list(0, 10, 1)
            ).to.be.revertedWith("Sender should own the amount of tokens to be listed");
        });

        it("Should list amount of token", async function () {
            const { recMarketplace, owner } = await loadFixture(deployFixture);

            await recMarketplace.list(0, 10, 1);

            const listing = await recMarketplace.tokenListings(0);
            await expect(listing.length).to.be.equal(1);
            await expect(listing[0].length).to.be.equal(3);
            await expect(listing[0][0]).to.be.equal(owner.address);
            await expect(listing[0][1]).to.be.equal(10);
            await expect(listing[0][2]).to.be.equal(1);
        });

        it("should emit TokenListed events", async function () {
            const { recMarketplace, owner } = await loadFixture(deployFixture);

            await expect(recMarketplace.list(0, 10, 1))
                .to.emit(recMarketplace, "TokenListed")
                .withArgs(owner.address, 0, 10, 1);
        });
    });

    describe("Buy", async function () {
        it("Should revert if tokens are not listed", async function () {
            const { recMarketplace, buyer, owner } = await loadFixture(deployAndList);

            await expect(recMarketplace.connect(buyer).buy(1, owner.address, 10)).to.be.revertedWith(
                "Specified seller has not listed given token ID"
            );
        });

        it("Should revert if amount specified is too great", async function () {
            const { recMarketplace, buyer, owner } = await loadFixture(deployAndList);

            await expect(recMarketplace.connect(buyer).buy(0, owner.address, 1000)).to.be.revertedWith(
                "Incorrect amount of tokens being purchased"
            );
        });

        it("Should revert if buyer does not send enough ethers", async function () {
            const { recMarketplace, buyer, owner } = await loadFixture(deployAndList);

            await expect(recMarketplace.connect(buyer).buy(0, owner.address, 10)).to.be.revertedWith(
                "Not enough ether to make the purchase"
            );
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
            await expect(listing[0].length).to.be.equal(3);
            await expect(listing[0][0]).to.be.equal(ethers.constants.AddressZero);
            await expect(listing[0][1]).to.be.equal(0);
            await expect(listing[0][2]).to.be.equal(0);
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
    });
});
