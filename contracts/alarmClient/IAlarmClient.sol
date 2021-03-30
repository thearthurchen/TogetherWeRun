// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IAlarmClient {
    function setAlarm(address pactAddress, uint64 endDateUtc) external;
    function fulfill(bytes32 requestId) external;
}
