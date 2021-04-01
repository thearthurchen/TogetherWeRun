// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/AccessControl.sol';
import "@openzeppelin/contracts/utils/Counters.sol";
import '@openzeppelin/contracts/payment/escrow/RefundEscrow.sol';
import "./alarmClient/IAlarmClient.sol";
import "./stravaClient/IStravaClient.sol";
import "./stravaClient/StravaClient.sol";


contract Pact is Ownable, AccessControl, StravaClient {

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
//    event ProgressUpdated();
    event PactStatusChanged(PactState state);

    // Wallet of the gateway
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

    // Clients that will call into our Pact
    address alarmAddress;
    IAlarmClient alarmClient;

    // Constants
    uint256 SECONDS_IN_A_DAY = 86400;

    mapping ( address => mapping ( uint256 => uint256 ) ) timeToProgressIndex;
    mapping ( address => uint8[] ) progress;
    mapping ( address => Counters.Counter ) indexes;
    uint256 minPledge;
    Counters.Counter daysUntilEnd;
    uint256 startDateUtc;
    uint256 endDateUtc;
    uint256 daysPerCheck;

    // @dev borrowed from
    // https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    // Transfer ownership of the escrow to charity
    constructor(
        address payable _wallet, // do we want this to be beneficiary?
        address _host,
        uint256 _id,
        address _alarmAddress,
        string memory _inviteCode
    ) StravaClient() public  {
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
        // Set alarm clock to the alarm clients based on provided addresses
        alarmClient = IAlarmClient(_alarmAddress);
        alarmAddress = _alarmAddress;
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

    // @dev setter and getter for conditions
    function setConditions(uint256 _minPledge, uint64 _endDateUtc, uint64 _daysPerCheck) external {
        // Check that we haven't started the Pact
        require(state == PactState.Pending, "Pact is not allowing anymore pledges!");
        // Check that the caller is the actual host
        require(hasRole(HOST_ROLE, msg.sender), "Caller is not a host");
        // Set the desired conditions
        minPledge = _minPledge;
        endDateUtc = _endDateUtc;
        daysPerCheck = _daysPerCheck;
    }

    function getConditions() external view returns (uint256, uint256, uint256) {
        return (minPledge, endDateUtc, daysPerCheck);
    }

    // Deposit the amount of ether sent from sender
    function makePledge() external payable {
        require(state == PactState.Pending, "Pact is not allowing anymore pledges!");
        // TODO let host make a pledge too
        require(hasRole(FRIEND_ROLE, msg.sender), "Caller is not a friend");
        // Make sure that they have enough to pledge
        require(msg.sender.balance > 0, "This should work?");
        // TODO this is probably not right we only care if the msg.value is >= pledge
        require(msg.sender.balance >= minPledge, "You need to pledge a bit more to be better together");
        // Deposit into our escrow
        escrow.deposit{value: msg.value}(wallet);
        emit Deposited(msg.sender, msg.value);
    }

    // TODO take the private key to sign it?
    // DONT NEED THIS ANYMORE
    function _generateInviteCode() internal view returns (string memory) {
        require(state == PactState.Pending, "Pact is already started or finished can't invite more people");
        return "Hello!!";
    }

    // Make sure that they have the right invite code
    // TODO combine this w/ makePact
    function joinPact(address _host, string memory _inviteCode) external payable {
        // Checks to make sure Pact is in good state and the caller is calling the right Pact
        require(!participantMap[msg.sender], "Participant already added!");
        require(state == PactState.Pending, "You can't add anymore participants");
        require(host == _host && _compareStringsByBytes(inviteCode, _inviteCode), "Invalid host or code");
        participantMap[msg.sender] = true;
        participants.push(msg.sender);
        // Give the participant FRIEND_ROLE
        _setupRole(FRIEND_ROLE, msg.sender);
        // TAKE THEIR MONEY
        require(msg.sender.balance >= minPledge, "You need to pledge a bit more to be better together");
        // Deposit into our escrow
        escrow.deposit{value: msg.value}(wallet);
        emit Deposited(msg.sender, msg.value);
    }

    // HOW DO DEFAULT WORKS WITH COUNTERS AND STUFF
    function testAddingStruct()  external {
        // ADD THEM TO THE GOAL
        require(progress[msg.sender].length == 0, "You already got added somehow");
        // Create some fake progress
        progress[msg.sender].push(0);
        // Set current block.timestamp to index current ie. 0 because we just added
        timeToProgressIndex[msg.sender][0] = indexes[msg.sender].current();
        // Increment counter
        indexes[msg.sender].increment();
    }

    // @dev get who the host is for this pact
    function getHost() external view returns (address) {
        require(hasRole(FRIEND_ROLE, msg.sender), "You are not part of the pact");
        return host;
    }

    // @dev Not sure if there's a more optimal way of getting the participants
    // EVM doesn't support iterating over a map
    // It's also expensive to iterate a list to check if an element exists
    function getParticipants() external view returns (address[] memory) {
        require(hasRole(FRIEND_ROLE, msg.sender), "You are not part of the pact");
        return participants;
    }

//    // Returns the whole struct of goal back???
//    function getProgress() external view returns (Goal memory) {
//        return goal;
//    }

    // Is the pact complete
    function isPactComplete() external view returns (bool) {
        return state == PactState.Finished;
    }

    function startPact() external {
        require(hasRole(HOST_ROLE, msg.sender), "You must be the host");
        // Escrow is Active on creation
        // State must be Refund or Closed for any refund or beneficiary withdrawal
        alarmClient.setAlarm(address(this), endDateUtc);
        state = PactState.Started;
        // Set the number of days left in goal
        startDateUtc = block.timestamp;
        // TODO Too tired to think about inclusive endDate or not
        // Note: This is probably not ok to access _value directly
        // But I don't want to write my own Counter struct right now
        daysUntilEnd._value = _getDaysBetween(block.timestamp, endDateUtc);
    }

    // This would probably call the StravaClient to update the progress
    // For all the participants
    function updateProgress() external {
        // Make sure they are actively participant
        require(hasRole(FRIEND_ROLE, msg.sender), "You are not part of the pact");
        // Request Strava Data on behalf of the user
        // TODO we will request StravaData within Pact as it is also StravaClient?
        requestStravaData(msg.sender, uint64(block.timestamp));
    }

    function _updateProgress(address user, uint timestamp, uint8 distance) internal {
        require(indexes[user].current() > 0, "You were not initialized somehow");
        require(timestamp > 0, "Can't use zero timestamp");
        // We floor the timestamp to the start of day so that multiple updates
        // will just update old value
        // We could also make sure that people don't try to update more than X times a day?
        uint256 theDay = _floorToStartOfDay(timestamp);
        // Check if the value exists already in our timeToProgressIndex
        uint256 index = timeToProgressIndex[user][theDay];
        // If it does exist (ie. not 0) we simply update with the new distance
        if (index > 0 ) {
            progress[user][index] = distance;
        } else {
            // Add the distance to the progress array
            progress[user].push(distance);
            // Record which index it is based on timestamp
            timeToProgressIndex[user][theDay] = indexes[user].current();
            // Increment the counter
            indexes[user].increment();
        }
    }

    // TODO (TANNER) update progress with the data
    function fulfill(bytes32 requestId, address user, uint timestamp, uint8 distance) public override {
        // Make sure that we're in the Started state
        require(state == PactState.Started, "Pact must be started for any progress updates");
        _updateProgress(user, timestamp, distance);
    }

    // Make sure that the goal is complete for each participant
    function _checkComplete() internal returns (bool) {
        return false;
    }

    // Alarm clock calls this
    function _enableRefunds() internal {
        // Make sure that the goal is complete?
        // Call the necessary escrow methods to enable refunds or lock it
        // enableRefunds() or close()
    }

    // This will be called by AlarmClock
    // BetterTogetherGateway is the owner which will call into this
    function finishPact() public {
        // Make sure that its the right AlarmClock
        require(msg.sender == alarmAddress, "You are not the AlarmClock");
        // TODO calculate differences
        bool complete = _checkComplete();
        // Set state to finished
        state = PactState.Finished;
        // enableRefunds if goal fail beneficiary else participants
        if (complete) {
            _enableRefunds();
        } else {
            // TODO send to charity somehow? transfer ownership?
        }
    }

    // TODO DEBUG REMOVE THIS LATER
    function getMyBalance() external view returns (uint256, uint256, uint256) {
        return (msg.sender.balance, minPledge, address(escrow).balance);
    }

    // TODO DEBUG REMOVE THIS LATER
    function foo(address user) external view returns (address, address, address) {
        return (msg.sender, user, host);
    }

}
