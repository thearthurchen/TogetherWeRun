// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IStravaClient {
    function requestStravaData() external returns (bytes32);
    function fulfill(bytes32 _requestId, uint256 _volume) external;
}
