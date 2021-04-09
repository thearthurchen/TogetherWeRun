// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


// TODO Pact will become StravaClient
contract StravaClient is Ownable, ChainlinkClient {

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
    constructor (address _link, address _oracle) public {
        setChainlinkToken(_link);
        // local node (needs to be running) listen to deployed oracle contract and
        // node configuration job id
        oracle = _oracle;
        jobId = "414a4cc978d148c3add54a1c0b3534c9";
        externalAdapterFee = 0.1 * 10 ** 18; // 0.1 LINK
    }

    function addressToString(address _address) public pure returns (string memory _uintAsString) {
        uint _i = uint256(_address);
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len - 1;
        while (_i != 0) {
            bstr[k--] = byte(uint8(48 + _i % 10));
            _i /= 10;
        }
        return string(bstr);
    }

    /**
     * @dev
     * Create a Chainlink request to retrieve API response, find the target
     * data, then multiply by 1000000000000000000 (to remove decimal places from data).
     */
    function requestStravaData(address user, uint timestamp) external returns (bytes32 requestId)
    {
        Chainlink.Request memory req = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

        req.add("user", addressToString(user));
        req.addUint("timestamp", timestamp);


        // Sends the request
        return sendChainlinkRequestTo(oracle, req, externalAdapterFee);
    }

    /**
     * @dev
     * Receive the response in the form of uint256
     */
    function fulfill(bytes32 requestId, uint256 distance) public virtual {
    }
}
