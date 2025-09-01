// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract IoTData {
    struct Reading {
        uint256 timestamp;
        string reading; // JSON payload
        address sender;
    }

    // deviceId => readings
    mapping(string => Reading[]) private readingsByDevice;

    // Optional device binding to an NFT and its token-bound account (ERC-6551)
    struct DeviceBinding {
        address nft;
        uint256 tokenId;
        address account; // token-bound account (TBA); optional
    }

    mapping(string => DeviceBinding) private deviceBinding;

    event ReadingStored(string indexed deviceId, uint256 indexed index, uint256 timestamp, address indexed sender, string reading);
    event DeviceRegistered(string indexed deviceId, address indexed nft, uint256 indexed tokenId, address account);
    event DeviceAccountUpdated(string indexed deviceId, address indexed account);

    // Store a new sensor reading
    function storeReading(string calldata deviceId, string calldata reading, uint256 timestamp) external returns (uint256 index) {
        // If a binding exists, enforce permissions: sender must be the TBA or current NFT owner
        DeviceBinding memory b = deviceBinding[deviceId];
        if (b.nft != address(0)) {
            address owner;
            try IERC721(b.nft).ownerOf(b.tokenId) returns (address o) {
                owner = o;
            } catch {
                revert("NFT query failed");
            }
            require(msg.sender == owner || (b.account != address(0) && msg.sender == b.account), "Unauthorized");
        }
        Reading memory r = Reading({timestamp: timestamp, reading: reading, sender: msg.sender});
        readingsByDevice[deviceId].push(r);
        index = readingsByDevice[deviceId].length - 1;
        emit ReadingStored(deviceId, index, timestamp, msg.sender, reading);
    }

    // Get latest reading and count
    function latestReading(string calldata deviceId)
        external
        view
        returns (bool exists, uint256 timestamp, string memory reading, address sender, uint256 count)
    {
        Reading[] storage arr = readingsByDevice[deviceId];
        count = arr.length;
        if (count == 0) {
            return (false, 0, "", address(0), 0);
        }
        Reading storage r = arr[count - 1];
        return (true, r.timestamp, r.reading, r.sender, count);
    }

    // Get last N readings (up to available)
    function lastNReadings(string calldata deviceId, uint256 n)
        external
        view
        returns (uint256[] memory timestamps, string[] memory readings, address[] memory senders)
    {
        Reading[] storage arr = readingsByDevice[deviceId];
        uint256 len = arr.length;
        if (len == 0) {
            return (new uint256[](0), new string[](0), new address[](0));
        }
        if (n > len) n = len;
        timestamps = new uint256[](n);
        readings = new string[](n);
        senders = new address[](n);
        uint256 start = len - n;
        for (uint256 i = 0; i < n; i++) {
            Reading storage r = arr[start + i];
            timestamps[i] = r.timestamp;
            readings[i] = r.reading;
            senders[i] = r.sender;
        }
    }

    // Register or update a device binding. Only current NFT owner may register/update.
    function registerDevice(string calldata deviceId, address nft, uint256 tokenId, address account) external {
        require(nft != address(0), "nft=0");
        address owner;
        try IERC721(nft).ownerOf(tokenId) returns (address o) {
            owner = o;
        } catch {
            revert("NFT query failed");
        }
        require(msg.sender == owner, "Not NFT owner");
        deviceBinding[deviceId] = DeviceBinding({ nft: nft, tokenId: tokenId, account: account });
        emit DeviceRegistered(deviceId, nft, tokenId, account);
    }

    // Update account only, still restricted to current NFT owner.
    function setDeviceAccount(string calldata deviceId, address account) external {
        DeviceBinding storage b = deviceBinding[deviceId];
        require(b.nft != address(0), "Not registered");
        address owner;
        try IERC721(b.nft).ownerOf(b.tokenId) returns (address o) {
            owner = o;
        } catch {
            revert("NFT query failed");
        }
        require(msg.sender == owner, "Not NFT owner");
        b.account = account;
        emit DeviceAccountUpdated(deviceId, account);
    }

    function getDeviceBinding(string calldata deviceId) external view returns (address nft, uint256 tokenId, address account) {
        DeviceBinding memory b = deviceBinding[deviceId];
        return (b.nft, b.tokenId, b.account);
    }
}
