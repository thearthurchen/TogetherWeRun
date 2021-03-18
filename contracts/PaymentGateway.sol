pragma solidity ^0.6.12;

import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/payment/escrow/Escrow.sol';
import '@openzeppelin/contracts/math/SafeMath.sol';


contract PaymentGateway is Ownable {

    event SendPayment(
        address indexed _from,
        uint _value
    );

    Escrow escrow;
    address payable wallet;

    using SafeMath for uint256;

    // @dev borrowed from
    // https://medium.com/@ethdapp/using-the-openzeppelin-escrow-library-6384f22caa99
    constructor(address payable _wallet) public {
        escrow = new Escrow();
        wallet = _wallet;
    }

    // Deposit the amount of ether sent from sender
    function sendPayment() external payable {
        escrow.deposit{value: msg.value}(wallet);
        emit SendPayment(msg.sender, msg.value);
    }

    // Only the owner of this escrow contract (aka the person who created)
    // can withdraw
    function withdraw() external onlyOwner {
        escrow.withdraw(wallet);
    }

    function balance() external view onlyOwner returns (uint256) {
        return escrow.depositsOf(wallet);
    }
}
