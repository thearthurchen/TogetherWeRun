// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

contract MockInviteCodeClient {

    function getRandomNumber(uint256 userProvidedSeed, address reqAddress) public returns (bytes32) {
        return bytes32(0x1);
    }

    function getInviteCode() public view returns (bytes2) {
        return bytes2(0x1234);
    }

}
