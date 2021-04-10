// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IEscrowFactory {
    function getEscrow(address host) external view returns(address);
    function createEscrow(address host, address pactAddress) external;
}
