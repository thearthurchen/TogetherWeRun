// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IInviteCodeClient {
    function getRandomNumber(uint256 userProvidedSeed, address reqAddress) external returns (bytes32);
    function getInviteCode() external view returns (bytes2);
}
