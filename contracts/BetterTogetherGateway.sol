// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;


import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/payment/escrow/RefundEscrow.sol";
import "./Pact.sol";
import "./alarmClient/AlarmClient.sol";


contract BetterTogetherGateway is Ownable {

    // Use SafeMath because its safe
    using SafeMath for uint256;
    // Use counter to track all ids
    using Counters for Counters.Counter;

    // Events to listen to if we so choose to
    event PactJoined(address host, address pact);

    // Track the pacts we have
    Pact[] public pacts;
    Counters.Counter private _numOfPacts;
    // Track the originator to their escrow
    mapping (address => uint256) private _addressToPactIndex;
    // Achieve 1 goal at a time
    mapping (address => bool) private _host;

    // Client addresses that we'll inject into our Pacts
//    AlarmClient _alarmClient;
//    address _alarmAddress;

    // @dev borrowed from
    // https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    constructor() public payable {
        // We want all new contracts from this gateway to start at 1
        Pact dummy = new Pact(
            payable(address(this)),
            msg.sender,
            _numOfPacts.current(),
            "asdf"
        );
        pacts.push(dummy);
        _numOfPacts.increment();
    }

    function _compareStringsByBytes(string memory s1, string memory s2) internal pure returns(bool) {
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }
    
    // @dev We take the msg.sender and create a goal for them
    // Check to make sure they are not currently an originator for being better together movement
    // If they are not hosting we return the invite code for their goal
    function createPact(string memory inviteCode) external {
        require(_addressToPactIndex[msg.sender] == 0, "You already have a pact!");
        Pact pact = new Pact(
            payable(address(this)),
            msg.sender,
            _numOfPacts.current(),
            inviteCode
        );
        pacts.push(pact);
        // We track w/ gateway just in case the host forgets their Pact address
        _addressToPactIndex[msg.sender] = _numOfPacts.current();
        _numOfPacts.increment();
        emit PactJoined(msg.sender, address(pact));
    }

    // Join a pact through gateway
    function joinPact(address host, string memory inviteCode) external {
        uint256 pactIndex = _addressToPactIndex[host];
        require(pactIndex > 0, "Your friend doesn't want to be better together");
        Pact pact = pacts[pactIndex];
        require(_compareStringsByBytes(inviteCode, pact.inviteCode()), "Invite code is wrong");
        pact.addParticipant(msg.sender);
        _addressToPactIndex[msg.sender] = pactIndex;
        emit PactJoined(msg.sender, address(pact));
    }

    // @dev Return the Pact Address after we've created pact
    // Frontend will always query this on dapp load to see if address already has pact
    function getMyPact() external view returns (address) {
        uint256 pactIndex = _addressToPactIndex[msg.sender];
        require(pactIndex > 0, "Your friend doesn't want to be better together");
        return address(pacts[pactIndex]);
    }
}
