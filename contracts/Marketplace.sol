pragma solidity ^0.8.15;

import "@openzeppelin/contracts/utils/Context.sol";
import "hardhat/console.sol";

import "./REC.sol";

contract MarketPlace is Context {
    // Event emitted when a token is listed for sale
    event TokenListed(
        address token,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 tokenAmount,
        uint256 price
    );

    // Event emitted when a token is bought
    event TokenBought(
        address token,
        address indexed buyer,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 tokenAmount,
        uint256 price
    );

    // Listing struct
    struct TokenListing {
        address seller;
        uint256 tokenAmount;
        uint256 price;
    }

    // Mapping of token IDs to their listing information
    mapping(address => mapping(uint256 => TokenListing)) private _tokenListings;

    /**
     * List a token for sale on the marketplace.
     *
     * @param _token The address of the ERC1155 token contract.
     * @param tokenId The ID of the token to list for sale.
     * @param tokenAmount The amount of tokens to list for sale.
     * @param price The price in wei for each token.
     */
    function list(address _token, uint256 tokenId, uint256 tokenAmount, uint256 price) external {
        // Ensure amount to be listed is positive
        require(tokenAmount > 0, "Amount to be listed should be positive");
        // Ensure seller has enough tokens
        require(
            REC(_token).balanceOf(_msgSender(), tokenId) >= tokenAmount,
            "Sender should own the amount of tokens to be listed"
        );
        // Ensure marketplace can manage tokens for seller
        require(
            REC(_token).isApprovedForAll(_msgSender(), address(this)),
            "Marketplace should be approved to manage user tokens"
        );

        // Save the listing information
        _tokenListings[_token][tokenId] = TokenListing({
            seller: msg.sender,
            tokenAmount: tokenAmount,
            price: price
        });
        // Emit the TokenListed event
        emit TokenListed(_token, _msgSender(), tokenId, tokenAmount, price);
    }

    /**
     * Buy a listed token amount from a seller
     * @param _token the address of the ERC1155 contract
     * @param tokenId the ID of the token being bought
     * @param tokenAmount the amount of tokens being bought
     */
    function buy(address _token, uint256 tokenId, uint256 tokenAmount) external payable {
        // Get the listing information
        TokenListing storage listing = _tokenListings[_token][tokenId];

        // Ensure that the token is listed
        require(listing.seller != address(0), "Token is not listed");

        // Ensure that the correct amount of tokens are being purchased
        require(tokenAmount <= listing.tokenAmount, "Incorrect amount of tokens being purchased");

        // Calculate the total cost of the purchase
        uint256 totalCost = tokenAmount * listing.price;

        // Ensure that the buyer has enough ether to make the purchase
        require(msg.value >= totalCost, "Not enough ether to make the purchase");

        // Transfer the ether to the seller
        payable(listing.seller).transfer(totalCost);

        // Transfer the tokens to the buyer
        REC(_token).safeTransferFrom(listing.seller, _msgSender(), tokenId, tokenAmount, "");

        // Emit the TokenBought event
        emit TokenBought(_token, _msgSender(), listing.seller, tokenId, tokenAmount, listing.price);

        // Update the listing information
        listing.tokenAmount -= tokenAmount;
        if (listing.tokenAmount == 0) {
            delete _tokenListings[_token][tokenId];
        }
    }

    function tokenListing(
        address token,
        uint256 tokenId
    ) public view returns (TokenListing memory) {
        return _tokenListings[token][tokenId];
    }
}
