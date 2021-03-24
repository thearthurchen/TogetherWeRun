// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@chainlink/contracts/src/v0.6/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '@openzeppelin/contracts/access/Ownable.sol';


contract InviteGenerator is Ownable, VRFConsumerBase {

    bytes32 internal keyHash;
    uint256 internal fee;
    address internal linkAddress;

    mapping( address => bytes2 ) addressToInviteCode;
    mapping( bytes32 => address ) requestIdToAddress;
    /**
        * Constructor inherits VRFConsumerBase
        *
        * Network: Kovan
        * Chainlink VRF Coordinator address: 0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9
        * LINK token address:                0xa36085F69e2889c224210F603D836748e7dC0088
        * Key Hash: 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4
        */
    constructor()
    VRFConsumerBase(
        0xdD3782915140c8f3b190B5D67eAc6dc5760C46E9, // VRF Coordinator
        0xa36085F69e2889c224210F603D836748e7dC0088  // LINK Token
    ) public payable
    {
        keyHash = 0x6c3699283bda56ad74f6b855546325b68d482e983852a7a82979cc4807b641f4;
        fee = 0.1 * 10 ** 18; // 0.1 LINK (varies by network)
//        linkAddress = 0xa36085F69e2889c224210F603D836748e7dC0088;
    }

    /**
     * @dev equests randomness from a user-provided seed
     * Save the requestId and address mapping
     * NOTE: A person can keep on requesting random numbers if the choose to
     */
    function getRandomNumber(uint256 userProvidedSeed, address reqAddress) public returns (bytes32) {
        // NOTE: We have to approve an allowance for contract using token.allow(contractAddress, allowance);
        // Currently just fund the contract to test
        // require(IERC20(linkAddress).transferFrom(reqAddress, payable(address(this)), fee), "Must pay oracle");
        require(LINK.balanceOf(address(this)) >= fee, "Not enough LINK - fill contract with faucet");
        bytes32 requestId = requestRandomness(keyHash, fee, userProvidedSeed);
        requestIdToAddress[requestId] = reqAddress;
        return requestId;
    }

    /**
     * Callback function used by VRF Coordinator
     * We store the randomness based on the requestId -> requesting address previous stored in getRandomNumber
     */
    function fulfillRandomness(bytes32 requestId, uint256 randomness) internal override {
        address reqAddress = requestIdToAddress[requestId];
        require(reqAddress != address(0), "Couldn't find address based on request id");
        addressToInviteCode[reqAddress] = bytes2(keccak256(abi.encodePacked(reqAddress, randomness)));
    }

    // @dev get addressToInviteCode for the msg.sender if they've requested before
    function getInviteCode() external view returns (bytes2) {
        require(addressToInviteCode[msg.sender] != bytes2(0), "Couldn't find result based on sender address");
        return addressToInviteCode[msg.sender];
    }

}
