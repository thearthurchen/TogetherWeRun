// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import '@openzeppelin/contracts/payment/escrow/RefundEscrow.sol';

contract EscrowFactory is Ownable {

    function createEscrow(address newOwner) external onlyOwner returns (address) {
        RefundEscrow escrow = new RefundEscrow(payable(msg.sender));
        escrow.transferOwnership(newOwner);
        return address(escrow);
    }
}
