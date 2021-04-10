// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/AccessControl.sol';
import "@openzeppelin/contracts/utils/Counters.sol";
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/payment/escrow/RefundEscrow.sol';
import "./alarmClient/AlarmClient.sol";
import "./stravaClient/StravaClient.sol";


contract Pact is Ownable, AccessControl, StravaClient, AlarmClient {

    // Use SafeMath because its safe
    using SafeMath for uint256;
    using SafeMath for uint64;
    // Use counter to track all ids
    using Counters for Counters.Counter;

    // Pact can only be Pending, Started, or Finished
    enum PactState { Pending, Started, Finished }
    // Roles
    bytes32 public constant HOST_ROLE = keccak256("HOST_ROLE");
    bytes32 public constant FRIEND_ROLE = keccak256("FRIEND_ROLE");

    // Events to listen to if we so choose to
    event Deposited(address indexed from, uint value);
    event FriendJoined(address indexed friend);
    event ProgressUpdated(address indexed friend, uint256 totalDistance);
    event PactStatusChanged(PactState state);

    // Wallet of the gateway
    address payable wallet;
    // Hosting address of person who started this pact
    address public host;
    // Mapping of the participants in this Pact
    mapping ( address => bool ) private participantMap;
    address[] public participants;
    // Unique inviteCode for this Pact
    // TODO arthur (make this host only)
    string public inviteCode;
    // Id of the Pact
    uint256 public id;
    // The escrow that actually holds the money
    RefundEscrow escrow;
    // The state of current Pact
    PactState public state;

    // Constants
    uint256 SECONDS_IN_A_DAY = 86400;
    address LINK_KOVAN = 0xa36085F69e2889c224210F603D836748e7dC0088;
    address ORACLE_KOVAN = 0x2f90A6D021db21e1B2A077c5a37B3C7E75D15b7e;
    
    // Deposit Tracking
    mapping ( address => uint256 ) deposits;

    // Goal Tracking
    mapping ( address => mapping ( uint256 => uint256 ) ) timeToProgressIndex;
    mapping ( address => uint256 ) progress;
    mapping ( address => uint256[] ) progressV2;
    mapping ( address => Counters.Counter ) indexes;
    mapping ( bytes32 => address) requestIdToAddress;
    mapping ( bytes32 => uint256) requestIdToTimestamp;
    uint minPledge;
    uint totalMiles;
    Counters.Counter daysUntilEnd;
    uint startDateUtc;
    uint endDateUtc;
    uint daysPerCheck;

    // @dev borrowed from
    // https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    // Transfer ownership of the escrow to charity
    constructor(
        address payable _wallet, // do we want this to be beneficiary?
        address _host,
        uint256 _id,
        string memory _inviteCode
    ) AlarmClient(LINK_KOVAN, ORACLE_KOVAN)
      StravaClient(LINK_KOVAN, ORACLE_KOVAN) public  {
        // Set the params we need for this Pact
        wallet = _wallet;
        host = _host;
        id = _id;
        // We use a refund escrow wallet should actually be the charity
        escrow = new RefundEscrow(wallet);
        // TODO We could opt to use the InviteCodeClient if we want VRF
        // Otherwise client passes in the code
        inviteCode = _inviteCode;
        // Pact is Pending by default
        state = PactState.Pending;
        // Grant the host HOST_ROLE and FRIEND_ROLE
        _setupRole(HOST_ROLE, _host);
        _setupRole(FRIEND_ROLE, _host);
        // Make host a participant
        participants.push(_host);
    }

    function _compareStringsByBytes(string memory s1, string memory s2) internal pure returns(bool) {
        return keccak256(abi.encodePacked(s1)) == keccak256(abi.encodePacked(s2));
    }

    function _floorToStartOfDay(uint256 timestamp) internal view returns (uint256) {
        return uint256(timestamp/SECONDS_IN_A_DAY) * SECONDS_IN_A_DAY;
    }

    function _getDaysBetween(uint256 start, uint256 end) internal view returns (uint256) {
        require(end > start, "End is before start");
        uint256 diff  = end - start;
        return diff / SECONDS_IN_A_DAY;
    }

    function getInviteCode() external returns (string memory) {
        // Check that the caller is the actual host
        require(hasRole(HOST_ROLE, msg.sender), "Caller is not a host");
        return inviteCode;
    }

    // @dev setter and getter for conditions
    function setConditions(uint _minPledge, uint _totalMiles, uint _endDateUtc, uint _daysPerCheck) external {
        // Check that we haven't started the Pact
        require(state == PactState.Pending, "Pact is not allowing anymore pledges!");
        // Check that the caller is the actual host
        require(hasRole(HOST_ROLE, msg.sender), "Caller is not a host");
        // Set the desired conditions
        minPledge = _minPledge * 10 ** 18;
        endDateUtc = _endDateUtc;
        daysPerCheck = _daysPerCheck;
        totalMiles = _totalMiles;
    }

    function getConditions() external view returns (uint, uint, uint, uint) {
        return (minPledge, totalMiles, endDateUtc, daysPerCheck);
    }

    // Deposit the amount of ether sent from sender
    function makePledge() external payable {
        require(state == PactState.Pending, "Pact is not allowing anymore pledges!");
        // TODO let host make a pledge too
        require(hasRole(FRIEND_ROLE, msg.sender), "Caller is not a friend");
        // TODO this is probably not right we only care if the msg.value is >= pledge
        require(msg.sender.balance >= minPledge, "You need to pledge a bit more to be better together");
        // Deposit into our escrow
        escrow.deposit{value: msg.value}(msg.sender);
        deposits[msg.sender] += msg.value;
        emit Deposited(msg.sender, msg.value);
    }

    function addParticipant(address participant) public onlyOwner {
        require(!participantMap[participant], "Participant already added!");
        require(state == PactState.Pending, "You can't add anymore participants");
        // Update the tracking + role
        participantMap[participant] = true;
        participants.push(participant);
        _setupRole(FRIEND_ROLE, participant);
        // Emit that a friend joined
        emit FriendJoined(participant);
    }

    // @dev get who the host is for this pact
    function getHost() external view returns (address) {
        require(hasRole(FRIEND_ROLE, msg.sender), "You are not part of the pact");
        return host;
    }

    // Get the address of the escrow of this pact
    // return address of the Refund Escrow contract
    function getEscrowAddress() external view returns (address) {
        return address(escrow);
    }

    // Withdraw funds of a specific payee
    function withdraw(address payable payee) external {
        escrow.withdraw(payee);
    }

    // @dev Not sure if there's a more optimal way of getting the participants
    // EVM doesn't support iterating over a map
    // It's also expensive to iterate a list to check if an element exists
    function getParticipants() external view returns (address[] memory) {
        require(hasRole(FRIEND_ROLE, msg.sender), "You are not part of the pact");
        return participants;
    }

    // Returns the whole struct of goal back???
    function getProgress(address user) external view returns (uint256, uint256) {
        require(hasRole(FRIEND_ROLE, msg.sender), "You are not part of the pact");
        return (progress[user], deposits[user]);
    }
    

    // Is the pact complete
    function isPactComplete() external view returns (bool) {
        return _checkComplete();
    }

    function startPact() external {
        require(hasRole(HOST_ROLE, msg.sender), "You must be the host");
        // Escrow is Active on creation
        // State must be Refund or Closed for any refund or beneficiary withdrawal
        setAlarm(endDateUtc);
        state = PactState.Started;
        // Set the number of days left in goal
        startDateUtc = block.timestamp;
        // TODO Too tired to think about inclusive endDate or not
        // Note: This is probably not ok to access _value directly
        // But I don't want to write my own Counter struct right now
        daysUntilEnd._value = _getDaysBetween(block.timestamp, endDateUtc);
    }

    // This would probably call the StravaClient to update the progressV2
    // For all the participants
    function updateProgress() external {
        // Make sure they are actively participant
        require(hasRole(FRIEND_ROLE, msg.sender), "You are not part of the pact");
        // Request Strava Data on behalf of the user
        bytes32 requestId = requestStravaData(msg.sender, uint64(block.timestamp));
        requestIdToAddress[requestId] = msg.sender;
    }

    // ???
    function _updateProgress(address user, uint256 timestamp, uint256 distance) public onlyOwner {
        // Make sure that we're in the Started state
        require(state == PactState.Started, "Pact must be started for any progressV2 updates");
        // Timestamp cant be 0
        require(timestamp > 0, "Can't use zero timestamp");
        // We floor the timestamp to the start of day so that multiple updates
        // will just update old value
        // We could also make sure that people don't try to update more than X times a day?
        uint256 theDay = _floorToStartOfDay(timestamp);
        // Check if the value exists already in our timeToProgressIndex
        uint256 index = timeToProgressIndex[user][theDay];
        // TODO arthur make our tracking more granular to make sure people dont cheat
        // and run total miles at the end in 1 day
        // If it does exist (ie. not 0) we simply update with the new distance
        if (index > 0 ) {
            progressV2[user][index] = distance;
        } else {
            // Add the distance to the progressV2 array
            progressV2[user].push(distance);
            // Record which index it is based on timestamp
            timeToProgressIndex[user][theDay] = indexes[user].current();
            // Increment the counter
            indexes[user].increment();
        }
        // dumb way to track for now
        progress[user] += distance;
        emit ProgressUpdated(user, progress[user]);
    }

    // Override the StravaClient method to call our _updateProgress
    function fulfill(bytes32 requestId, uint256 distance) public override recordChainlinkFulfillment(requestId){
        _updateProgress(requestIdToAddress[requestId], requestIdToTimestamp[requestId], distance);
    }

    function fulfillAlarm(bytes32 requestId) public override recordChainlinkFulfillment(requestId) {
        finishPact();
    }

    // Make sure that the goal is complete for each participant
    function _checkComplete() internal view returns (bool) {
        // Just check the total in progress
        for (uint i = 0; i < participants.length; i++ ) {
            if (progress[participants[i]] < totalMiles) {
                return false;
            }
        }
        return true;
    }

    // This will be called by AlarmClock
    // BetterTogetherGateway is the owner which will call into this
    function finishPact() internal {
        // TODO calculate differences
        bool complete = _checkComplete();
        // Set state to finished
        state = PactState.Finished;
        // enableRefunds if goal fail beneficiary else participants
        if (complete) {
            escrow.enableRefunds();
        } else {
            // TODO send to charity somehow? transfer ownership?
            // Beneficiary can withdraw now by calling beneficiaryWithdraw()
            escrow.close();
        }
    }
}
