// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import '@openzeppelin/contracts/access/Ownable.sol';


contract AlarmClient is Ownable, ChainlinkClient {

    // Chainlink Stuff
    address private oracle;
    bytes32 private alarmClockJobId;
    uint256 private alarmClockFee;

    /**
    * AlarmClock
    * Network: Kovan
    * Oracle: 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e
    * JobID: a7ab70d561d34eb49e9b1612fd2e044b
    * Fee: 1 LINK
    */
    constructor() public {
        setPublicChainlinkToken();
        oracle = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e;
        alarmClockJobId = "a7ab70d561d34eb49e9b1612fd2e044b";
        alarmClockFee = 1 * 10 ** 18; // 1 LINK
    }

    /**
     * @dev
     * Ghetto cron job
     * We just request everyday X times until we reach the end based on endDate
     */
    function cronJob() internal {
        // TODO make this a for-loop for N amount of days til endDate

        // TODO probably want a mapping also for each request sent which is a bytes32 requestId
        Chainlink.Request memory req = buildChainlinkRequest(alarmClockJobId, address(this), this.fulfillCronJob.selector);
        req.addUint("until", now + 5 minutes);
        sendChainlinkRequestTo(oracle, req, alarmClockFee);
    }

    /**
     * @dev
     * Receive the response in the form of uint256
     */
    function fulfillCronJob(bytes32 _requestId) public recordChainlinkFulfillment(_requestId)
    {
        // TODO probably want to track each requestId that we get and mark them as fulfilled
    }

}
