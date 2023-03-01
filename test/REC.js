const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("REC", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployRECFixture() {
        // Contracts are deployed using the first signer/account by default
        const [owner, minter, redeemer, auditor, nobody] = await ethers.getSigners();

        const REC = await ethers.getContractFactory("REC");
        const rec = await REC.deploy();

        await rec.grantRole(await rec.MINTER_ROLE(), minter.address);
        await rec.grantRole(await rec.REDEEMER_ROLE(), redeemer.address);
        await rec.grantRole(await rec.AUDITOR_ROLE(), auditor.address);

        return { rec, owner, minter, redeemer, auditor, nobody };
    }

    async function deployAndMintRECFixture() {
        const payload = await loadFixture(deployRECFixture);

        const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

        await payload.rec
            .connect(payload.minter)
            .mintAndAllocate(uri, 15, [payload.redeemer.address], [15], [false]);

        return { ...payload, uri };
    }

    describe("Deployment", function () {
        it("Should set sender as admin for access control", async function () {
            const { rec, owner } = await loadFixture(deployRECFixture);

            await expect(await rec.hasRole(await rec.DEFAULT_ADMIN_ROLE(), owner.address)).to.be
                .true;
        });

        it("Should set sender as minter, redeemer and auditor", async function () {
            const { rec, owner } = await loadFixture(deployRECFixture);

            await expect(await rec.hasRole(await rec.MINTER_ROLE(), owner.address)).to.be.true;
            await expect(await rec.hasRole(await rec.REDEEMER_ROLE(), owner.address)).to.be.true;
            await expect(await rec.hasRole(await rec.AUDITOR_ROLE(), owner.address)).to.be.true;
        });
    });

    describe("Interface available", function () {
        it("Should have the ERC1155 interface", async function () {
            const IERC1155_ID = "0xd9b67a26";
            const IERC1155METADATA_ID = "0x0e89341c";

            const { rec } = await loadFixture(deployRECFixture);

            expect(await rec.supportsInterface(IERC1155_ID)).to.be.true;
            expect(await rec.supportsInterface(IERC1155METADATA_ID)).to.be.true;
        });
        it("Should have the AccessControl interface", async function () {
            const IACCESSCONTROL_ID = "0x7965db0b";

            const { rec } = await loadFixture(deployRECFixture);

            expect(await rec.supportsInterface(IACCESSCONTROL_ID)).to.be.true;
        });
    });

    describe("Mint", function () {
        it("Should revert if sender is not a minter", async function () {
            const { rec, nobody } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await expect(rec.connect(nobody).mintAndAllocate(uri, 10, [], [], [])).to.be.revertedWith(
                "Sender must have MINTER_ROLE to mint new tokens"
            );
        });

        it("Should revert if allocated and allocations have different length", async function () {
            const { rec, minter, redeemer } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await expect(
                rec.connect(minter).mintAndAllocate(uri, 10, [redeemer.address], [], [false])
            ).to.be.revertedWith("Allocated and allocations arrays must be of the same length");
        });

        it("Should revert if allocated and allocations redeemed have different length", async function () {
            const { rec, minter, redeemer } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await expect(
                rec.connect(minter).mintAndAllocate(uri, 10, [redeemer.address], [10], [false, true])
            ).to.be.revertedWith("Allocated and allocations redeemed arrays must be of the same length");
        });

        it("Should revert if allocations amount to more than supply amount", async function () {
            const { rec, minter, redeemer } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await expect(
                rec.connect(minter).mintAndAllocate(uri, 10, [redeemer.address], [20], [false])
            ).to.be.revertedWith("ERC1155: insufficient balance for transfer");
        });

        it("Should mint supply to owner of no allocations", async function () {
            const { rec, minter } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await rec.connect(minter).mintAndAllocate(uri, 10, [], [], []);

            await expect(await rec.balanceOf(minter.address, 0)).to.equal(10);
        });

        it("Should allocate proper amount to recipients", async function () {
            const { rec, minter, redeemer } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await rec.connect(minter).mintAndAllocate(uri, 10, [redeemer.address], [5], [false]);

            await expect(await rec.balanceOf(minter.address, 0)).to.equal(5);
            await expect(await rec.balanceOf(redeemer.address, 0)).to.equal(5);
        });

        it("Should set sender as minter of tokens", async function () {
            const { rec, minter, redeemer } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await rec.connect(minter).mintAndAllocate(uri, 10, [redeemer.address], [5], [false]);

            await expect(await rec.minterOf(0)).to.equal(minter.address);
        });

        it("Should set uri for the token", async function () {
            const { rec, minter, redeemer } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await rec.connect(minter).mintAndAllocate(uri, 10, [redeemer.address], [5], [false]);

            await expect(await rec.uri(0)).to.equal(uri);
        });

        it("Should automatically redeem tokens", async function () {
            const { rec, minter, redeemer } = await loadFixture(deployRECFixture);

            const uri = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

            await rec.connect(minter).mintAndAllocate(uri, 10, [redeemer.address], [5], [true]);

            // Balance check
            await expect(await rec.balanceOf(minter.address, 0)).to.equal(5);
            await expect(await rec.balanceOf(redeemer.address, 0)).to.equal(0);
            // Redeem checks
            await expect(await rec.redeemedSupplyOf(0)).to.equal(5);
            await expect(await rec.amountRedeemed(redeemer.address, 0)).to.equal(5);
        });
    });

    describe("Redeem", function () {
        it("Should revert if sender is not redeemer", async function () {
            const { rec, nobody } = await loadFixture(deployAndMintRECFixture);

            await expect(rec.connect(nobody).redeem(0, 5)).to.be.revertedWith(
                "Redeemer must have REDEEMER_ROLE to redeem tokens"
            );
        });

        it("Should revert if the account does not own the specified amount", async function () {
            const { rec, redeemer } = await loadFixture(deployAndMintRECFixture);

            await expect(rec.connect(redeemer).redeem(0, 30)).to.be.revertedWith(
                "ERC1155: burn amount exceeds balance"
            );
        });

        it("Should revert if the specified id does not exist", async function () {
            const { rec, redeemer } = await loadFixture(deployAndMintRECFixture);

            await expect(rec.connect(redeemer).redeem(2, 5)).to.be.revertedWith(
                "ERC1155: burn amount exceeds balance"
            );
        });

        it("Should increase the amount of tokens redeemed by the account for the given id", async function () {
            const { rec, redeemer } = await loadFixture(deployAndMintRECFixture);

            await rec.connect(redeemer).redeem(0, 5);

            await expect(await rec.amountRedeemed(redeemer.address, 0)).to.equal(5);
        });

        it("Should increase the amount of tokens redeemed for the given id", async function () {
            const { rec, redeemer } = await loadFixture(deployAndMintRECFixture);

            await expect(await rec.redeemedSupplyOf(0)).to.equal(0);

            await rec.connect(redeemer).redeem(0, 5);

            await expect(await rec.redeemedSupplyOf(0)).to.equal(5);
        });

        it("Should make transfer of the tokens impossible", async function () {
            const { rec, redeemer, nobody } = await loadFixture(deployAndMintRECFixture);

            await expect(await rec.redeemedSupplyOf(0)).to.equal(0);

            await rec.connect(redeemer).redeem(0, 15);

            await expect(
                rec.safeTransferFrom(redeemer.address, nobody.address, 0, 15, [])
            ).to.be.revertedWith("ERC1155: caller is not token owner or approved");
        });

        it("should emit Redeem events", async function () {
            const { rec, redeemer } = await loadFixture(deployAndMintRECFixture);

            await rec.connect(redeemer).redeem(0, 5);

            await expect(rec.connect(redeemer).redeem(0, 5))
                .to.emit(rec, "Redeem")
                .withArgs(redeemer.address, 0, 5);
        });
    });

    describe("Redemption Statement", function () {
        it("Should revert if sender is not the tokens minter", async function () {
            const { rec, redeemer } = await loadFixture(deployAndMintRECFixture);

            await expect(
                rec.connect(redeemer).setRedemptionStatement(0, "redemtpion-statement-url")
            ).to.be.revertedWith("Sender should be the RECs' minter");
        });

        it("Should revert if not all tokens were redeemed", async function () {
            const { rec, minter } = await loadFixture(deployAndMintRECFixture);

            await expect(
                rec.connect(minter).setRedemptionStatement(0, "redemtpion-statement-url")
            ).to.be.revertedWith(
                "Supply should be redeemed before setting redemption statement"
            );
        });

        it("Should revert if the redemption statement has already been set", async function () {
            const { rec, redeemer, minter } = await loadFixture(deployAndMintRECFixture);

            await rec.connect(redeemer).redeem(0, 15);
            await rec.connect(minter).setRedemptionStatement(0, "redemption-statement-url");

            await expect(
                rec.connect(minter).setRedemptionStatement(0, "redemption-statement-url")
            ).to.be.revertedWith("Redemption statement can not be updated");
        });

        it("Should set the redemption statement", async function () {
            const { rec, redeemer, minter } = await loadFixture(deployAndMintRECFixture);

            await rec.connect(redeemer).redeem(0, 15);
            await rec.connect(minter).setRedemptionStatement(0, "redemption-statement-url");

            await expect(await rec.redemptionStatementOf(0)).to.equal("redemption-statement-url");
        });
    });
});
