// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;


import '@openzeppelin/contracts/payment/escrow/RefundEscrow.sol';

contract Pact is Ownable {

    event Deposited(
        address indexed _from,
        uint _value
    );

    address payable wallet;
    address host;
    address[] participants;
    string public inviteCode;
    uint256 public id;
    RefundEscrow escrow;

    // @dev borrowed from
    // https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    constructor(address payable _wallet, address _host, uint256 _id) public {
        wallet = _wallet;
        host = _host;
        id = _id;
        escrow = new RefundEscrow(wallet);
    }

    // Deposit the amount of ether sent from sender
    function sendPayment() external payable {
        escrow.deposit{value: msg.value}(wallet);
        emit Deposited(msg.sender, msg.value);
    }
}
