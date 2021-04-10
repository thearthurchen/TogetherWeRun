// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IRefundEscrow {
    function deposit(address refundee) external payable;
    function withdraw(address payable payee) external;
    function enableRefunds() external;
    function close() external;
}
