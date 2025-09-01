// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract IoTData {
    struct Reading {
        uint256 timestamp;
        string reading; // JSON payload
        address sender;
    }

    // deviceId => readings
    mapping(string => Reading[]) private readingsByDevice;

    event ReadingStored(string indexed deviceId, uint256 indexed index, uint256 timestamp, address indexed sender, string reading);

    // Store a new sensor reading
    function storeReading(string calldata deviceId, string calldata reading, uint256 timestamp) external returns (uint256 index) {
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
}
