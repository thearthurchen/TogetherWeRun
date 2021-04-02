// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


// TODO Pact will become StravaClient
contract StravaClient is Ownable, ChainlinkClient {

    uint256 public distance;

    // Chainlink Stuff
    address private oracle;
    bytes32 private jobId;
    uint256 private externalAdapterFee;

    /**
    * ExternalAdapter
    * Network: Kovan
    * Oracle: 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e
    * Job ID: 29fa9aa13bf1468788b7cc4a500a45b8
    * Fee: 0.1 LINK
    *
    * AlarmClock
    * JobID: a7ab70d561d34eb49e9b1612fd2e044b
    * TODO we need to move this out and use this pattern
    * https://github.com/tweether-protocol/tweether/blob/master/contracts/Tweether.sol#L69
    */
    constructor () public {
        setPublicChainlinkToken();
        oracle = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e;
        jobId = "29fa9aa13bf1468788b7cc4a500a45b8"; // TODO (tanner): update this once deployed
        externalAdapterFee = 0.1 * 10 ** 18; // 0.1 LINK
    }

    /**
     * @dev
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     */
    function requestStravaData(address user, uint timestamp) internal returns (bytes32 requestId)
    {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        req.add("user", user);
        req.add("timestamp", timestamp);


        // Sends the request
        return sendChainlinkRequestTo(oracle, req, externalAdapterFee);
    }

    /**
     * @dev
     * Receive the response in the form of uint256
     */
    function fulfill(bytes32 _requestId, uint256 _distance) public virtual {
        distance = _distance;
    }
}
