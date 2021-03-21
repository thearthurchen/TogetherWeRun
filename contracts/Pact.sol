// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;


import '@openzeppelin/contracts/access/AccessControl.sol';
import '@openzeppelin/contracts/payment/escrow/RefundEscrow.sol';

contract Pact is AccessControl {
    using SafeMath for uint256;
    using SafeMath for uint64;

    // Pact can only be Pending, Started, or Finished
    enum PactState { Pending, Started, Finished }
    // Roles
    bytes32 public constant HOST_ROLE = keccak256("HOST_ROLE");
    bytes32 public constant FRIEND_ROLE = keccak256("FRIEND_ROLE");

    // Events to listen to if we so choose to
    event Deposited(address indexed from, uint value);
    event FriendJoined(address indexed friend);
//    event ProgressUpdated();
    event PactStatusChanged(PactState state);

    // Wallet of the host
    address payable wallet;
    // Hosting address of person who started this pact
    address public host;
    // Mapping of the participants in this Pact
    mapping ( address => bool ) private participantMap;
    address[] public participants;
    // Unique inviteCode for this Pact
    string public inviteCode;
    // Id of the Pact
    uint256 public id;
    // The escrow that actually holds the money
    RefundEscrow escrow;
    // The state of current Pact
    PactState state;

    // Conditions for the Pact, maybe we can make it a struct
    uint256 pledge;
    uint64 endDate;
    uint64 checkpointThreshold;

    // @dev borrowed from
    // https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    constructor(address payable _wallet, address _host, uint256 _id) public {
        wallet = _wallet;
        host = _host;
        id = _id;
        escrow = new RefundEscrow(wallet);
        inviteCode = _generateInviteCode();
        inviteCode = "Hello";
        state = PactState.Pending;
        // Grant the host HOST_ROLE
        _setupRole(HOST_ROLE, _host);
    }

    function _compareStringsByBytes(string memory s1, string memory s2) internal pure returns(bool){
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }

    // @dev setter and getter for conditions
    function setConditions(uint256 _pledge, uint64 _endDate, uint64 _checkpointThreshold) external {
        // Check that we haven't started the Pact
        require(state == PactState.Pending, "Pact is not allowing anymore pledges!");
        // Check that the caller is the actual host
        require(hasRole(HOST_ROLE, msg.sender), "Caller is not a host");
        // Set the desired conditions
        pledge = _pledge;
        endDate = _endDate;
        checkpointThreshold = _checkpointThreshold;
    }

    function getConditions() external view returns (uint256, uint64, uint64) {
        return (pledge, endDate, checkpointThreshold);
    }

    // Deposit the amount of ether sent from sender
    function makePledge() external payable {
        require(state == PactState.Pending, "Pact is not allowing anymore pledges!");
        require(hasRole(FRIEND_ROLE, msg.sender), "Caller is not a friend");
        // Make sure that they have enough to pledge
        require(msg.sender.balance > 0, "This should work?");
        require(msg.sender.balance >= pledge, "You need to pledge a bit more to be better together");
        // Deposit into our escrow
        escrow.deposit{value: msg.value}(wallet);
        emit Deposited(msg.sender, msg.value);
    }

    // TODO take the private key to sign it?
    function _generateInviteCode() internal view returns (string memory) {
        require(state == PactState.Pending, "Pact is already started or finished can't invite more people");
        return "Hello!!";
    }

    // Make sure that they have the right invite code
    function joinPact(address _host, string memory _inviteCode) external {
        // Checks to make sure Pact is in good state and the caller is calling the right Pact
        require(!participantMap[msg.sender], "Participant already added!");
        require(state == PactState.Pending, "You can't add anymore participants");
        require(host == _host && _compareStringsByBytes(inviteCode, _inviteCode), "You have the wrong host and invite code");
        participantMap[msg.sender] = true;
        participants.push(msg.sender);
        // Give the participant FRIEND_ROLE
        _setupRole(FRIEND_ROLE, msg.sender);
    }

    // @dev get who the host is for this pact
    function getHost() external view returns (address) {
        require(hasRole(FRIEND_ROLE, msg.sender) || hasRole(HOST_ROLE, msg.sender), "You are not part of the pact");
        return host;
    }

    // TODO DEBUG REMOVE THIS LATER
    function getMyBalance() external view returns (uint256, uint256, uint256) {
        return (msg.sender.balance, pledge, address(escrow).balance);
    }

    // TODO DEBUG REMOVE THIS LATER
    function foo(address user) external view returns (address, address, address) {
        return (msg.sender, user, host);
    }

    // @dev Not sure if there's a more optimal way of getting the participants
    // EVM doesn't support iterating over a map
    // It's also expensive to iterate a list to check if an element exists
    function getParticipants() external view returns (address[] memory) {
        require(hasRole(FRIEND_ROLE, msg.sender) || hasRole(HOST_ROLE, msg.sender), "You are not part of the pact");
        return participants;
    }

    // TODO check the progress
    function getProgress() external view returns (bool) {
        return true;
    }

    // We want to check whether or not
    function isPactComplete() external view returns (bool) {
        return false;
    }

    function startPact() external {
        require(hasRole(HOST_ROLE, msg.sender), "You must be the host");
        state = PactState.Started;
    }
}
