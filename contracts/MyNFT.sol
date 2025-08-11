// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC6551Registry {
    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external returns (address);
}


contract MyNFT is ERC721, Ownable {
    uint256 public nextTokenId;
    address public registry;
    address public implementation;

    mapping(uint256 => address) public tokenBoundAccounts;

    event NFTMinted(address indexed to, uint256 indexed tokenId, address account);

    constructor(address _registry, address _implementation) ERC721("MyNFT", "MNFT") Ownable(msg.sender) {
        registry = _registry;
        implementation = _implementation;
    }

    function mint(address to) external onlyOwner returns (uint256, address) {
        uint256 tokenId = nextTokenId++;
        _mint(to, tokenId);
        // Create token-bound account
        bytes32 salt = keccak256(abi.encodePacked(to, tokenId, block.timestamp));
        address account = IERC6551Registry(registry).createAccount(
            implementation,
            salt,
            block.chainid,
            address(this),
            tokenId
        );
        tokenBoundAccounts[tokenId] = account;
        emit NFTMinted(to, tokenId, account);
        return (tokenId, account);
    }

    function getAccount(uint256 tokenId) external view returns (address) {
        return tokenBoundAccounts[tokenId];
    }
}
