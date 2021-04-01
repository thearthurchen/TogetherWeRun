// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../IPact.sol";


contract AlarmClient is Ownable, ChainlinkClient {

    // Chainlink Stuff
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    mapping( bytes32 => address ) requestIdToAddress;

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
        jobId = "a7ab70d561d34eb49e9b1612fd2e044b";
        fee = 1 * 10 ** 18; // 1 LINK
    }

    /**
     * @dev
     * Fall back check if no one checks the progress on the day that Pact ends
     */
    function setAlarm(address pactAddress, uint64 endDateUtc) public onlyOwner {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        // Does this even work
        // TODO calculate days from now until endDate
        req.addUint("until", now + 8 weeks);
        bytes32 requestId = sendChainlinkRequestTo(oracle, req, fee);
        requestIdToAddress[requestId] = pactAddress;
    }

    /**
     * @dev
     * Receive the response in the form of uint256
     */
    function fulfill(bytes32 requestId) public recordChainlinkFulfillment(requestId)
    {
        address pactAddress = requestIdToAddress[requestId];
        // Take the interface and call the contract's to check outcome
        IPact pact = IPact(pactAddress);
        pact.setFinished();
    }

}
