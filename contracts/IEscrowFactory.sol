// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IEscrowFactory {
    function createEscrow(address newOwner) external returns(address);
}
