// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IStravaClient {
    function requestStravaData(address user, uint timestamp) external returns (bytes32);
    function fulfill(bytes32 requestId, address user, uint timestamp, uint8 distance) external;
}
