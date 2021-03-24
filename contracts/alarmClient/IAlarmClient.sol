// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IAlarmClient {
    function cronJob(address pactAddress) external;
    function fulfill(bytes32 requestId) external;
}
