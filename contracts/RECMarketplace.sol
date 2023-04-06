pragma solidity ^0.8.15;

import "./REC.sol";

contract RECMarketPlace is REC {
    // Event emitted when a token is listed for sale
    event TokenListed(
        address indexed seller,
        uint256 indexed tokenId,
        uint256 tokenAmount,
        uint256 price
    );

    // Event emitted when a token is bought
    event TokenBought(
        address indexed buyer,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 tokenAmount,
        uint256 price
    );

    // Listing struct
    struct TokenListing {
        uint256 tokenId;
        address seller;
        uint256 tokenAmount;
        uint256 price;
    }

    // Mapping of token IDs to their listing information
    mapping(uint256 => TokenListing[]) private _tokenListings;

    // ListIndex struct
    struct ListIndex {
        bool listed;
        uint256 index;
    }

    // Mapping to know if a seller already listed a token: tokenId => seller => (listed, index)
    mapping(uint256 => mapping(address =>  ListIndex)) private _addressListedToken;

    // Valid listing count
    uint256 private _validListingCount;

    constructor() REC() {}

    /**
     * List a token for sale on the marketplace.
     *
     * @param tokenId The ID of the token to list for sale.
     * @param tokenAmount The amount of tokens to list for sale.
     * @param price The price in wei for each token.
     */
    function list(uint256 tokenId, uint256 tokenAmount, uint256 price) external {
        // Ensure amount to be listed is positive
        require(tokenAmount > 0);
        // Ensure seller has enough tokens
        require(
            balanceOf(_msgSender(), tokenId) >= tokenAmount
        );

        ListIndex storage listIndex = _addressListedToken[tokenId][_msgSender()];

        if(!listIndex.listed) {
            listIndex.index = _tokenListings[tokenId].length;
            _validListingCount += 1;

            // Save the listing information
            _tokenListings[tokenId].push(TokenListing({
            tokenId: tokenId,
            seller: msg.sender,
            tokenAmount: tokenAmount,
            price: price
            }));
        } else {
            // Save the listing information
            _tokenListings[tokenId][listIndex.index] = TokenListing({
                tokenId: tokenId,
                seller: msg.sender,
                tokenAmount: tokenAmount,
                price: price
            });
        }



        listIndex.listed = true;

        // Emit the TokenListed event
        emit TokenListed(_msgSender(), tokenId, tokenAmount, price);
    }

    /**
     * Buy a listed token amount from a seller
     * @param tokenId the ID of the token being bought
     * @param seller the address selling the token
     * @param tokenAmount the amount of tokens being bought
     */
    function buy(uint256 tokenId, address seller, uint256 tokenAmount) external payable {
        // Get the listing index
        ListIndex storage listIndex = _addressListedToken[tokenId][seller];

        // Ensure seller has listed given token Id
        require(listIndex.listed);

        // Get the listing information
        TokenListing storage listing = _tokenListings[tokenId][listIndex.index];

        // Ensure that the correct amount of tokens are being purchased
        require(tokenAmount <= listing.tokenAmount);

        // Calculate the total cost of the purchase
        uint256 totalCost = tokenAmount * listing.price;

        // Ensure that the buyer has enough ether to make the purchase
        require(msg.value >= totalCost);

        // Transfer the ether to the seller
        payable(listing.seller).transfer(totalCost);

        // Transfer the tokens to the buyer
        _safeTransferFrom(listing.seller, _msgSender(), tokenId, tokenAmount, "");

        // Emit the TokenBought event
        emit TokenBought(_msgSender(), listing.seller, tokenId, tokenAmount, listing.price);

        // Update the listing information
        listing.tokenAmount -= tokenAmount;

        // Remove listing if all is sold
        if(listing.tokenAmount == 0) {
            delete _tokenListings[tokenId][listIndex.index];
            listIndex.listed = false;
            _validListingCount -= 1;
        }
    }

    function tokenListings(uint256 tokenId) public view returns (TokenListing[] memory) {
        return _tokenListings[tokenId];
    }

    function currentTokenListings() external view returns (TokenListing[] memory) {
        TokenListing[] memory _currentTokenListings = new TokenListing[](_validListingCount);
        uint256 ci = 0;
        for (uint256 i = 0; i < nextId(); i++) {
            if (_tokenListings[i].length == 0) continue;
            for (uint256 j = 0; j < _tokenListings[i].length; j++) {
                if (_tokenListings[i][j].seller == address(0)) continue;
                if (_addressListedToken[i][_tokenListings[i][j].seller].listed) {
                    TokenListing storage _tmpListing = _tokenListings[i][j];
                    _currentTokenListings[ci] = _tmpListing;
                    ci += 1;
                }
            }
        }
        return _currentTokenListings;
    }

    function tokenSupplyListed(uint256 tokenId) external view returns (uint256 total) {
        for (uint256 i = 0; i < _tokenListings[tokenId].length; i++) {
            total += _tokenListings[tokenId][i].tokenAmount;
        }
        return total;
    }
}
