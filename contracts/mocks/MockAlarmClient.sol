// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../IPact.sol";


contract MockAlarmClient {

    mapping( bytes32 => address ) requestIdToAddress;
    uint count;

    /**
     * @dev
     * Fall back check if no one checks the progress on the day that Pact ends
     */
    function cronJob(address pactAddress, uint64 endDateUtc) public  {
        requestIdToAddress[bytes32(count)] = pactAddress;
        count += 1;
    }

    /**
     * @dev Just convert address to bytes32 and it'll call the contract we want
     */
    function fulfill(bytes32 requestId) public {
        address pactAddress = requestIdToAddress[requestId];
        // Take the interface and call the contract's to check outcome
        IPact pact = IPact(pactAddress);
        pact.setFinished();
    }

}
