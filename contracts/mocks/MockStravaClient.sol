// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

contract MockStravaClient {

    function requestStravaData(address user) internal returns (bytes32 requestId) {
        return bytes32(uint256(1));
    }
}
