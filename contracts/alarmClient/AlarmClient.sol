// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../IPact.sol";


contract AlarmClient is Ownable, ChainlinkClient {

    event Finished();
    // Chainlink Stuff
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    /**
    * AlarmClock
    * Network: Kovan
    * Oracle: 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e
    * JobID: a7ab70d561d34eb49e9b1612fd2e044b
    * Fee: 1 LINK
    */
    constructor(address _link, address _oracle) public {
        setChainlinkToken(_link);
        // local node (needs to be running) listen to deployed oracle contract and
        // node configuration job id
        oracle = _oracle;
        jobId = "a7ab70d561d34eb49e9b1612fd2e044b";
        fee = 1 * 10 ** 18; // 1 LINK
    }

    /**
     * @dev
     * Fall back check if no one checks the progress on the day that Pact ends
     */
    function setAlarm(uint endDateUtc) internal {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfillAlarm.selector);
        req.addUint("until", endDateUtc);
        sendChainlinkRequestTo(oracle, req, fee);
    }

    /**
     * @dev
     * Receive the response in the form of uint256
     */
    function fulfillAlarm(bytes32 requestId) public virtual
    {
        emit Finished();
    }

}
