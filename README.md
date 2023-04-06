## Renewable Energy Certificates Marketplace

This repository contains a proposal on how to implement Renewable Energy Certificates (RECs) along with a marketplace to sell them.

## Contracts

> ⚠️ As Hyperspace does not support cross-contract calling today, we use a fusion of both Marketplace and REC contracts to
> ensure all tokens functionalities.

### RECs

The RECs contract had a set of features that were define with the Filecoin Green team. The specification are:
- The RECs should be a fungible token (FT) supply attached to a non-fungible token (NFT) to set metadata for the whole supply. A 
concept closely relating to semi-fungible tokens.


- Whe minting RECs, it has to be possible to allocate part of it directly to a Storage Provider (SP).


- The RECs FTs should be transferable by anyone, effectively making them available on the free market
  > _Note: As the redemption should only be done by SPs in the same geographical region as the seller, any interface implementing
  the marketplace should ensure that the SPs can filter RECs based on geographical location and time frame._
  
- The FTs should be redeemable by their owners, effectively committing on the usage of the renewable energy.  


- Some roles should be implemented to restrict operations:
  - Minter: List of accounts allowed to mint tokens.
  - Redeemer: List of accounts allowed to redeem RECs.


- Once all the FTs are redeemed the minter has to be allowed to set a new metadata for the NFT.

### Markeplace

The marketplace to be implemented allows owner of RECs to list the FTs for a given price.

_Note: This contract is only for PoC usage. It only covers a happy path and does not handle cancellation of a listing for example._

## Hardhat tasks

We created a few hardhat tasks to interact with the [Hyperspace network](https://github.com/filecoin-project/testnet-hyperspace),
 the test network of the Filecoin ecosystem.

### Installation

Install the dependencies with:
```shell
yarn install
```

Create a `.env.local` file and set the `PRIVATE_KEY` variable to a valid ethereum private key.

### Usage

The list of available tasks are:
- `get-address`: Gets Filecoin f4 address and corresponding Ethereum address
- `set-role`: Mints and allocates RECs
- `mint-allocate`: Mints and allocates RECs
- `redeem`: Redeem owned supply of RECs token
- `get-balance`: Calls the REC Contract to read the amount of RECs owned by the account.
- `list-recs`: List RECs on a Marketplace contract
- `buy-recs`: Buy listed RECs on a Marketplace contract
- `get-listed-recs`: Listed RECs on a Marketplace contract

For more information run:
```shell
yarn hardhat --help
```

### Deployment

```shell
yarn hardhat deploy
```

### Test

```shell
yarn hardhat test --network hardhat
```

## Inspirations 

To create this project we were inspired by the [FEVM Hardhat Kit](https://github.com/filecoin-project/FEVM-Hardhat-Kit) and 
Zondax [filecoin-solidity repository](https://github.com/Zondax/filecoin-solidity).