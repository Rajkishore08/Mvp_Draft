// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

// ERC-6551 Registry
contract ERC6551Registry {
    using Clones for address;
    
    event ERC6551AccountCreated(
        address account,
        address indexed implementation,
        bytes32 salt,
        uint256 chainId,
        address indexed tokenContract,
        uint256 indexed tokenId
    );
    
    function createAccount(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external returns (address) {
        bytes32 bytecodeHash = keccak256(_getCreationCode(implementation, salt, chainId, tokenContract, tokenId));
        
        address account = implementation.cloneDeterministic(bytecodeHash);
        
        ERC6551Account(payable(account)).initialize(
            chainId,
            tokenContract,
            tokenId
        );
        
        emit ERC6551AccountCreated(account, implementation, salt, chainId, tokenContract, tokenId);
        
        return account;
    }
    
    function account(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) external view returns (address) {
        bytes32 bytecodeHash = keccak256(_getCreationCode(implementation, salt, chainId, tokenContract, tokenId));
        return implementation.predictDeterministicAddress(bytecodeHash);
    }
    
    function _getCreationCode(
        address implementation,
        bytes32 salt,
        uint256 chainId,
        address tokenContract,
        uint256 tokenId
    ) internal pure returns (bytes memory) {
        return abi.encodePacked(
            hex"3d60ad80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3",
            salt,
            chainId,
            tokenContract,
            tokenId
        );
    }
}

// ERC-6551 Account Implementation
contract ERC6551Account is IERC165, IERC1271 {
    uint256 private _state;
    
    uint256 public chainId;
    address public tokenContract;
    uint256 public tokenId;
    
    // Transaction logging for asset tracking
    struct TransactionRecord {
        uint256 timestamp;
        string action;
        address from;
        address to;
        string details;
    }
    
    TransactionRecord[] public transactionHistory;
    
    event TransactionExecuted(address indexed target, uint256 value, bytes data);
    event TransactionLogged(uint256 indexed timestamp, string action, address indexed from, address indexed to, string details);
    
    modifier onlyOwner() {
        require(_isValidSigner(msg.sender), "Not token owner");
        _;
    }
    
    constructor() {
        // Prevent implementation from being initialized
        chainId = 1;
        tokenContract = address(1);
        tokenId = 1;
    }
    
    function initialize(
        uint256 _chainId,
        address _tokenContract,
        uint256 _tokenId
    ) external {
        require(chainId == 0, "Already initialized");
        
        chainId = _chainId;
        tokenContract = _tokenContract;
        tokenId = _tokenId;
    }
    
    // Execute arbitrary transactions
    function execute(
        address target,
        uint256 value,
        bytes calldata data
    ) external payable onlyOwner returns (bytes memory) {
        _state++;
        
        (bool success, bytes memory result) = target.call{value: value}(data);
        require(success, "Transaction failed");
        
        emit TransactionExecuted(target, value, data);
        return result;
    }
    
    // Batch execute multiple transactions
    function executeBatch(
        address[] calldata targets,
        uint256[] calldata values,
        bytes[] calldata datas
    ) external payable onlyOwner returns (bytes[] memory) {
        require(targets.length == values.length && values.length == datas.length, "Array length mismatch");
        
        bytes[] memory results = new bytes[](targets.length);
        
        for (uint256 i = 0; i < targets.length; i++) {
            _state++;
            (bool success, bytes memory result) = targets[i].call{value: values[i]}(datas[i]);
            require(success, string(abi.encodePacked("Transaction ", i, " failed")));
            results[i] = result;
            emit TransactionExecuted(targets[i], values[i], datas[i]);
        }
        
        return results;
    }
    
    // Log custom transactions for asset tracking
    function logTransaction(string calldata action, address to, string calldata details) external onlyOwner {
        transactionHistory.push(TransactionRecord({
            timestamp: block.timestamp,
            action: action,
            from: msg.sender,
            to: to,
            details: details
        }));
        emit TransactionLogged(block.timestamp, action, msg.sender, to, details);
    }
    
    // Get transaction history
    function getTransactionHistory() external view returns (TransactionRecord[] memory) {
        return transactionHistory;
    }
    
    // Get specific transaction by index
    function getTransaction(uint256 index) external view returns (TransactionRecord memory) {
        require(index < transactionHistory.length, "Transaction index out of bounds");
        return transactionHistory[index];
    }
    
    // Get transaction count
    function getTransactionCount() external view returns (uint256) {
        return transactionHistory.length;
    }
    
    // Get token info
    function token() external view returns (uint256, address, uint256) {
        return (chainId, tokenContract, tokenId);
    }
    
    // Get current state
    function state() external view returns (uint256) {
        return _state;
    }
    
    // Check if signer is valid (ERC-1271)
    function isValidSignature(
        bytes32 hash,
        bytes memory signature
    ) external view returns (bytes4) {
        bool isValid = SignatureChecker.isValidSignatureNow(owner(), hash, signature);
        return isValid ? IERC1271.isValidSignature.selector : bytes4(0);
    }
    
    // Check if signer is valid (ERC-6551)
    function isValidSigner(address signer, bytes calldata) external view returns (bytes4) {
        return _isValidSigner(signer) ? IERC6551Account.isValidSigner.selector : bytes4(0);
    }
    
    // Get NFT owner
    function owner() public view returns (address) {
        if (chainId != block.chainid) return address(0);
        
        try IERC721(tokenContract).ownerOf(tokenId) returns (address _owner) {
            return _owner;
        } catch {
            return address(0);
        }
    }
    
    function _isValidSigner(address signer) internal view returns (bool) {
        return signer == owner();
    }
    
    // Support for receiving ETH
    receive() external payable {}
    
    // ERC-165 support
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return
            interfaceId == type(IERC165).interfaceId ||
            interfaceId == type(IERC6551Account).interfaceId ||
            interfaceId == type(IERC1271).interfaceId;
    }
}

// Interface definitions
interface IERC6551Account {
    function token() external view returns (uint256 chainId, address tokenContract, uint256 tokenId);
    function state() external view returns (uint256);
    function isValidSigner(address signer, bytes calldata context) external view returns (bytes4 magicValue);
}