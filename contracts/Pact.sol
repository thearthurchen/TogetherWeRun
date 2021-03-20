// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;


import '@openzeppelin/contracts/payment/escrow/RefundEscrow.sol';

contract Pact is Ownable {
    using SafeMath for uint256;
    using SafeMath for uint64;

    // Pact can only be Pending, InProgress, or Finished
    enum PactState { Pending, InProgress, Finished }

    // Track events
    event Deposited(
        address indexed _from,
        uint _value
    );
    // Wallet of the host
    address payable wallet;
    // Hosting address of person who started this pact
    address public host;
    // Mapping of the participants in this Pact
    mapping ( address => bool ) private participantMap;
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
    }

    // @dev setter and getter for conditions
    function setConditions(address _caller, uint256 _pledge, uint64 _endDate, uint64 _checkpointThreshold) external {
        require(state == PactState.Pending, "Pact is not allowing anymore pledges!");
        require(_caller == host, "You are not the host you can't change the conditions");
        pledge = _pledge;
        endDate = _endDate;
        checkpointThreshold = _checkpointThreshold;
    }

    function getConditions() external returns (uint256, uint64, uint64) {
        return (pledge, endDate, checkpointThreshold);
    }

    // Deposit the amount of ether sent from sender
    function makePledge() external payable {
        require(state == PactState.Pending, "Pact is not allowing anymore pledges!");
        // Make sure that they have enough to pledge
        require(msg.sender.balance >= pledge, "You need to pledge a bit more to be better together");
        // Deposit into our escrow
        escrow.deposit{value: msg.value}(wallet);
        emit Deposited(msg.sender, msg.value);
    }

    // TODO take the private key to sign it?
    function _generateInviteCode() internal returns (string memory) {
        require(state == PactState.Pending, "Pact is already started or finished can't invite more people");
        return "Hello!!";
    }

    function addParticipant(address participant) external {
        require(participantMap[participant], "Participant already added!");
        require(state == PactState.Pending, "You can't add anymore participants");
        participantMap[participant] = true;
    }

    function getOwner() public view returns (address) {
        return owner();
    }

    function getHost() public view returns (address) {
        return host;
    }

    function foo(address user) public view returns (address, address, address) {
        return (msg.sender, user, host);
    }

    function wtf() public view returns (bool) {
        return keccak256(abi.encodePacked(msg.sender)) == keccak256(abi.encodePacked(host));
    }
}
